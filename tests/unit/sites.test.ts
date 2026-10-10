import { describe, expect, it } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import {
  Rooms,
  serve,
  type Store,
  type StoredRoom,
} from '../../src/sites/rooms';
import { D1Store, type Database } from '../../src/sites/d1-store';
import { createRacer, STEP, tick, cpuInput } from '../../src/game/physics';
import { TRACKS } from '../../src/game/tracks';

class MemoryStore implements Store {
  data = new Map<string, StoredRoom>();
  conflicts = 0;
  async get(code: string) {
    return structuredClone(this.data.get(code) ?? null);
  }
  async put(room: StoredRoom, previous: number | null) {
    if (this.conflicts > 0 && previous !== null) {
      this.conflicts--;
      return false;
    }
    const current = this.data.get(room.code);
    if (previous === null ? !!current : current?.version !== previous)
      return false;
    this.data.set(room.code, structuredClone(room));
    return true;
  }
  async rate() {
    return true;
  }
}
function setup() {
  const store = new MemoryStore();
  let time = 100000;
  const rooms = new Rooms(store, () => time);
  return {
    store,
    rooms,
    time: () => time,
    advance: (ms: number) => {
      time += ms;
    },
  };
}
const command = (type: string, extra: object = {}) => ({
  type,
  requestId: crypto.randomUUID(),
  ...extra,
});
async function pair(s: ReturnType<typeof setup>, mode = 'free') {
  const host = await s.rooms.create({ name: 'ホスト', color: 0, mode });
  const guest = await s.rooms.join(host.room.code, {
    name: 'ゲスト',
    color: 1,
  });
  return { host, guest, code: host.room.code };
}
async function start(
  s: ReturnType<typeof setup>,
  p: Awaited<ReturnType<typeof pair>>,
) {
  for (const member of [p.host, p.guest])
    await s.rooms.command(
      p.code,
      member.credentials.token,
      command('ready', { ready: true }),
    );
  const response = await s.rooms.command(
    p.code,
    p.host.credentials.token,
    command('start'),
  );
  s.advance(3200);
  return response.room;
}
describe('Sitesの部屋とサーバー走行', () => {
  it('2人が同じ部屋を参照し、トークンと内部記録は配信しない', async () => {
    const s = setup(),
      p = await pair(s);
    const response = await s.rooms.read(p.code, p.guest.credentials.token);
    expect(response.room.players).toHaveLength(2);
    expect(JSON.stringify(response.room)).not.toContain('tokenHash');
    expect(JSON.stringify(response.room)).not.toContain(
      p.host.credentials.token,
    );
    expect(JSON.stringify(response.room)).not.toContain('requests');
    await expect(s.rooms.read(p.code, 'invalid')).rejects.toMatchObject({
      status: 403,
    });
    const other = await s.rooms.create({ name: '別室', color: 2 });
    await expect(
      s.rooms.read(p.code, other.credentials.token),
    ).rejects.toMatchObject({ status: 403 });
  });
  it('同時参加が競合しても10人を超えない', async () => {
    const s = setup(),
      host = await s.rooms.create({ name: '主', color: 0 });
    const attempts = await Promise.allSettled(
      Array.from({ length: 12 }, (_, i) =>
        s.rooms.join(host.room.code, { name: String(i), color: i % 4 }),
      ),
    );
    expect(attempts.filter((r) => r.status === 'fulfilled')).toHaveLength(9);
    const response = await s.rooms.read(host.room.code, host.credentials.token);
    expect(new Set(response.room.players.map((p) => p.slot)).size).toBe(10);
  });
  it('準備とホスト権限を必須とし、操作再送を重複実行しない', async () => {
    const s = setup(),
      p = await pair(s);
    await expect(
      s.rooms.command(p.code, p.host.credentials.token, command('start')),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      s.rooms.command(
        p.code,
        p.guest.credentials.token,
        command('settings', { mode: 'free', course: 3 }),
      ),
    ).rejects.toMatchObject({ status: 403 });
    const packet = command('ready', { ready: true });
    s.store.conflicts = 2;
    await s.rooms.command(p.code, p.host.credentials.token, packet);
    await s.rooms.command(p.code, p.host.credentials.token, packet);
    expect(s.store.data.get(p.code)!.requests).toHaveLength(1);
    await s.rooms.command(
      p.code,
      p.guest.credentials.token,
      command('ready', { ready: true }),
    );
    const racing = await s.rooms.command(
      p.code,
      p.host.credentials.token,
      command('start'),
    );
    expect(racing.room.phase).toBe('racing');
    expect(racing.room.startAt).toBe(s.time() + 3000);
    expect(racing.room.players.every((p) => p.racer?.cpu === false)).toBe(true);
  });
  it('位置は共通物理から算出し、再送は二重移動しない', async () => {
    const s = setup(),
      p = await pair(s),
      race = await start(s, p);
    const input = { steer: 0, push: false, assist: true };
    const expected = createRacer(TRACKS[0]!, 0, 0, false);
    for (let i = 1; i <= 24; i++)
      tick(TRACKS[0]!, expected, input, STEP, i * STEP);
    const packet = command('input', {
      raceId: race.raceId,
      seq: 1,
      frames: [{ ticks: 24, input }],
    });
    const response = await s.rooms.command(
      p.code,
      p.host.credentials.token,
      packet,
    );
    expect(response.room.players[0]!.racer!.x).toBeCloseTo(expected.x, 10);
    expect(response.room.players[0]!.ticks).toBe(24);
    const replay = await s.rooms.command(
      p.code,
      p.host.credentials.token,
      packet,
    );
    expect(replay.room.players[0]!.ticks).toBe(24);
    expect(
      (await s.rooms.read(p.code, p.guest.credentials.token)).room.players[0]!
        .racer!.x,
    ).toBeCloseTo(expected.x, 10);
  });
  it('加速チート・入力順序飛ばし・過去レース・NaN・任意throttleを拒否する', async () => {
    const s = setup(),
      p = await pair(s),
      race = await start(s, p);
    const packet = (extra: object = {}) =>
      command('input', {
        raceId: race.raceId,
        seq: 1,
        frames: [{ ticks: 24, input: { steer: 0, push: false, assist: true } }],
        ...extra,
      });
    await expect(
      s.rooms.command(
        p.code,
        p.host.credentials.token,
        packet({
          frames: [
            { ticks: 120, input: { steer: 0, push: false, assist: true } },
          ],
        }),
      ),
    ).rejects.toMatchObject({ status: 429 });
    await expect(
      s.rooms.command(p.code, p.host.credentials.token, packet({ seq: 2 })),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      s.rooms.command(
        p.code,
        p.host.credentials.token,
        packet({ raceId: 'old' }),
      ),
    ).rejects.toMatchObject({ status: 409 });
    for (const input of [
      { steer: NaN, push: false, assist: true },
      { steer: 0, push: false, assist: true, throttle: 5 },
    ]) {
      await expect(
        s.rooms.command(
          p.code,
          p.host.credentials.token,
          packet({ frames: [{ ticks: 24, input }] }),
        ),
      ).rejects.toMatchObject({ status: 400 });
    }
  });
  it('サーバー走行で実際に完走し、最下位・得点・次戦を確定する', async () => {
    const s = setup(),
      p = await pair(s, 'grand-prix');
    const race = await start(s, p);
    let seq = 0;
    for (let block = 0; block < 300; block++) {
      s.advance(1000);
      const state = s.store.data.get(p.code)!;
      const predicted = structuredClone(state.players[0]!.racer!);
      const frames = Array.from({ length: 120 }, (_, i) => {
        const input = cpuInput(TRACKS[0]!, predicted, 'normal');
        const legal = {
          steer: input.steer,
          push: input.push,
          assist: input.assist,
        };
        tick(
          TRACKS[0]!,
          predicted,
          legal,
          STEP,
          (state.players[0]!.ticks + i + 1) * STEP,
        );
        return { ticks: 1, input: legal };
      });
      await s.rooms.command(
        p.code,
        p.guest.credentials.token,
        command('heartbeat'),
      );
      const response = await s.rooms.command(
        p.code,
        p.host.credentials.token,
        command('input', { raceId: race.raceId, seq: ++seq, frames }),
      );
      if (response.room.phase !== 'racing') break;
    }
    const result = (await s.rooms.read(p.code, p.host.credentials.token)).room;
    expect(result.phase).toBe('results');
    expect(result.standings.map((s) => s.outcome)).toEqual(['finish', 'last']);
    expect(result.players.map((p) => p.score)).toEqual([15, 12]);
    const next = await s.rooms.command(
      p.code,
      p.host.credentials.token,
      command('next'),
    );
    expect(next.room.course).toBe(1);
    expect(next.room.phase).toBe('lobby');
  });
  it('退出したホストを交代し、タイムアウトでレースを止める', async () => {
    const s = setup(),
      p = await pair(s);
    await s.rooms.command(p.code, p.host.credentials.token, command('leave'));
    expect(
      (await s.rooms.read(p.code, p.guest.credentials.token)).room.hostId,
    ).toBe(p.guest.credentials.playerId);
    await expect(
      s.rooms.read(p.code, p.host.credentials.token),
    ).rejects.toMatchObject({ status: 403 });
    const fresh = setup(),
      racers = await pair(fresh);
    await start(fresh, racers);
    for (let i = 0; i < 200; i++) {
      fresh.advance(1000);
      await fresh.rooms.command(
        racers.code,
        racers.host.credentials.token,
        command('heartbeat'),
      );
      await fresh.rooms.command(
        racers.code,
        racers.guest.credentials.token,
        command('heartbeat'),
      );
    }
    expect(
      (await fresh.rooms.read(racers.code, racers.host.credentials.token)).room
        .phase,
    ).toBe('results');
  });
  it('期限切れ・不正な名前・不正な色・コースを拒否する', async () => {
    const s = setup(),
      p = await pair(s);
    s.advance(14400001);
    await expect(
      s.rooms.read(p.code, p.host.credentials.token),
    ).rejects.toMatchObject({ status: 410 });
    for (const body of [
      { name: '', color: 0 },
      { name: '名\n前', color: 0 },
      { name: '名前', color: 4 },
      { name: '名前', color: 0, course: 8 },
    ]) {
      await expect(s.rooms.create(body)).rejects.toMatchObject({ status: 400 });
    }
  });
});
describe('Sites HTTPとD1互換SQL', () => {
  it('同一オリジン・JSON制限・HTTPステータス・部屋権限を確認する', async () => {
    const store = new MemoryStore();
    const req = (
      path: string,
      body?: object,
      headers: Record<string, string> = {},
    ) =>
      new Request(`https://race.test/api${path}`, {
        method: body ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json', ...headers },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
    const created = await serve(req('/rooms', { name: '主', color: 0 }), store);
    expect(created.status).toBe(201);
    const data = (await created.json()) as {
      room: Room;
      credentials: Credentials;
    };
    expect((await serve(req(`/rooms/${data.room.code}`), store)).status).toBe(
      403,
    );
    expect(
      (
        await serve(
          req(`/rooms/${data.room.code}`, undefined, {
            Authorization: `Bearer ${data.credentials.token}`,
          }),
          store,
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await serve(
          req(
            '/rooms',
            { name: '主', color: 0 },
            { Origin: 'https://evil.test' },
          ),
          store,
        )
      ).status,
    ).toBe(403);
    expect(
      (await serve(req('/config'), store)).headers.get('Cache-Control'),
    ).toBe('no-store');
    expect(
      (
        (await (await serve(req('/config'), store)).json()) as {
          transport: string;
        }
      ).transport,
    ).toBe('poll');
    expect(
      (
        await serve(
          new Request('https://race.test/api/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{',
          }),
          store,
        )
      ).status,
    ).toBe(400);
  });
  it('実SQLiteで保存・CAS競合・レート制限・別インスタンス参照を確認する', async () => {
    const sqlite = new DatabaseSync(':memory:');
    sqlite.exec(
      readFileSync(
        new URL(
          '../../sites-host/drizzle/0000_charming_loa.sql',
          import.meta.url,
        ),
        'utf8',
      ),
    );
    const db: Database = {
      prepare(sql: string) {
        let values: (string | number)[] = [];
        const statement = {
          bind(...args: (string | number)[]) {
            values = args;
            return statement;
          },
          async first<T>() {
            return (sqlite.prepare(sql).get(...values) ?? null) as T | null;
          },
          async run() {
            return {
              meta: {
                changes: Number(sqlite.prepare(sql).run(...values).changes),
              },
            };
          },
        };
        return statement;
      },
    };
    const a = new D1Store(db),
      b = new D1Store(db),
      rooms = new Rooms(a, () => 100000);
    const host = await rooms.create({ name: '主', color: 0 });
    expect((await b.get(host.room.code))!.players).toHaveLength(1);
    const stored = (await a.get(host.room.code))!;
    expect(await b.put(stored, null)).toBe(false);
    stored.version = 1;
    expect(await a.put(stored, 0)).toBe(true);
    expect(await b.put(stored, 0)).toBe(false);
    expect(await a.rate('iphash', 1, 1)).toBe(true);
    expect(await b.rate('iphash', 1, 1)).toBe(false);
    sqlite.close();
  });
});

import type { Room, Credentials } from '../../src/online/protocol';
