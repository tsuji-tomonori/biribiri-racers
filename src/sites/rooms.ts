import { createRacer, STEP, tick } from '../game/physics';
import { TRACKS } from '../game/tracks';
import type {
  Member,
  Room,
  Standing,
  Credentials,
  Frame,
} from '../online/protocol';

export interface Player extends Member {
  tokenHash: string;
  lastSeen: number;
}
export interface StoredRoom extends Omit<Room, 'players'> {
  players: Player[];
  roster: string[];
  requests: string[];
  ttl: number;
}
export interface Store {
  get(code: string): Promise<StoredRoom | null>;
  put(room: StoredRoom, previous: number | null): Promise<boolean>;
  rate(key: string, bucket: number, maximum: number): Promise<boolean>;
}
export class RoomError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
function requireValue(
  condition: unknown,
  status: number,
  message: string,
): asserts condition {
  if (!condition) throw new RoomError(status, message);
}
type ObjectValue = Record<string, unknown>;
function object(value: unknown): ObjectValue {
  requireValue(
    value && typeof value === 'object' && !Array.isArray(value),
    400,
    '入力形式を確認してください。',
  );
  return value as ObjectValue;
}
function integer(value: unknown, min: number, max: number): number {
  requireValue(
    typeof value === 'number' &&
      Number.isSafeInteger(value) &&
      value >= min &&
      value <= max,
    400,
    '数値の範囲を確認してください。',
  );
  return value;
}
function mode(value: unknown): 'free' | 'grand-prix' {
  requireValue(
    value === 'free' || value === 'grand-prix',
    400,
    '対戦モードを確認してください。',
  );
  return value;
}
function enter(value: unknown) {
  const b = object(value);
  requireValue(
    typeof b.name === 'string' &&
      b.name.trim().length >= 1 &&
      [...b.name].length <= 16 &&
      !/[\x00-\x1f\x7f]/.test(b.name),
    400,
    '名前は1〜16文字で入力してください。',
  );
  return {
    name: b.name.trim(),
    color: integer(b.color, 0, 3),
    mode: mode(b.mode ?? 'free'),
    course: integer(b.course ?? 0, 0, TRACKS.length - 1),
  };
}
export async function hash(value: string): Promise<string> {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)),
    ),
    (b) => b.toString(16).padStart(2, '0'),
  ).join('');
}
function secret(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
}
function equal(a: string, b: string): boolean {
  let difference = a.length ^ b.length;
  for (let i = 0; i < a.length; i++)
    difference |= a.charCodeAt(i) ^ (b.charCodeAt(i) || 0);
  return difference === 0;
}
export function view(room: StoredRoom, now: number): Room {
  return {
    code: room.code,
    version: room.version,
    hostId: room.hostId,
    mode: room.mode,
    course: room.course,
    phase: room.phase,
    raceId: room.raceId,
    startAt: room.startAt,
    serverTime: now,
    round: room.round,
    standings: structuredClone(room.standings),
    history: structuredClone(room.history),
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      slot: p.slot,
      active: p.active,
      ready: p.ready,
      score: p.score,
      seq: p.seq,
      ticks: p.ticks,
      racer: structuredClone(p.racer),
    })),
  };
}
const POINTS = [15, 12, 10, 8, 6, 5, 4, 3, 2, 1];
function record(room: StoredRoom, p: Player, outcome: Standing['outcome']) {
  if (room.standings.some((s) => s.playerId === p.id)) return;
  const available = Array.from(
    { length: room.roster.length },
    (_, i) => i + 1,
  ).filter((i) => !room.standings.some((s) => s.rank === i));
  const rank = outcome === 'dnf' ? available.at(-1)! : available[0]!;
  room.standings.push({
    playerId: p.id,
    name: p.name,
    rank,
    points: outcome === 'dnf' ? 0 : POINTS[rank - 1]!,
    outcome,
  });
}
function settle(room: StoredRoom) {
  if (room.phase !== 'racing') return;
  const remaining = room.players.filter(
    (p) =>
      room.roster.includes(p.id) &&
      !room.standings.some((s) => s.playerId === p.id),
  );
  if (remaining.length > 1) return;
  if (remaining[0]) record(room, remaining[0], 'last');
  room.standings.sort((a, b) => a.rank - b.rank);
  for (const p of room.players)
    p.score += room.standings.find((s) => s.playerId === p.id)?.points ?? 0;
  room.history.push(structuredClone(room.standings));
  room.history = room.history.slice(
    room.mode === 'grand-prix' ? -TRACKS.length : -1,
  );
  room.phase =
    room.mode === 'grand-prix' && room.round === TRACKS.length
      ? 'complete'
      : 'results';
}
function reap(room: StoredRoom, now: number) {
  for (const p of room.players) {
    if (p.active && now - p.lastSeen > 30000) {
      p.active = false;
      if (room.phase === 'racing' && room.roster.includes(p.id))
        record(room, p, 'dnf');
    }
  }
  if (!room.players.some((p) => p.active && p.id === room.hostId))
    room.hostId = room.players.find((p) => p.active)?.id ?? '';
  if (
    room.phase === 'racing' &&
    now - room.startAt > (TRACKS[room.course]!.timeLimit ?? 180) * 1000
  ) {
    for (const p of [...room.players].sort(
      (a, b) => (a.racer?.progress ?? 0) - (b.racer?.progress ?? 0),
    )) {
      if (room.roster.includes(p.id)) record(room, p, 'dnf');
    }
  }
  settle(room);
}
export class Rooms {
  constructor(
    private store: Store,
    private now: () => number = Date.now,
  ) {}
  private async member(
    b: ReturnType<typeof enter>,
    code: string,
    slot: number,
  ): Promise<[Player, Credentials]> {
    const token = secret(),
      id = crypto.randomUUID();
    return [
      {
        id,
        name: b.name,
        color: b.color,
        slot,
        tokenHash: await hash(token),
        lastSeen: this.now(),
        ready: false,
        active: true,
        score: 0,
        seq: 0,
        ticks: 0,
        racer: null,
      },
      { code, playerId: id, token },
    ];
  }
  async create(value: unknown) {
    const b = enter(value);
    for (let i = 0; i < 10; i++) {
      const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const code = Array.from(
        crypto.getRandomValues(new Uint8Array(6)),
        (n) => alphabet[n % alphabet.length],
      ).join('');
      const [p, credentials] = await this.member(b, code, 0);
      const room: StoredRoom = {
        code,
        version: 0,
        hostId: p.id,
        mode: b.mode,
        course: b.mode === 'grand-prix' ? 0 : b.course,
        phase: 'lobby',
        players: [p],
        raceId: '',
        startAt: 0,
        serverTime: this.now(),
        round: 0,
        standings: [],
        history: [],
        roster: [],
        requests: [],
        ttl: this.now() + 14400000,
      };
      if (await this.store.put(room, null))
        return { room: view(room, this.now()), credentials };
    }
    throw new RoomError(503, 'ルームを作成できませんでした。');
  }
  private async get(code: string): Promise<StoredRoom> {
    requireValue(
      /^[A-Z2-9]{6}$/.test(code),
      400,
      '6文字のルームコードを確認してください。',
    );
    const room = await this.store.get(code);
    requireValue(room, 404, 'ルームが見つかりません。');
    requireValue(room.ttl > this.now(), 410, 'ルームの有効期限が切れました。');
    return room;
  }
  private auth(room: StoredRoom, hashed: string): Player {
    const p = room.players.find((p) => p.active && equal(p.tokenHash, hashed));
    requireValue(p, 403, 'このルームの参加権限がありません。');
    return p;
  }
  async read(code: string, token: string) {
    const room = await this.get(code);
    this.auth(room, await hash(token));
    return { room: view(room, this.now()), credentials: null };
  }
  private async mutate(code: string, apply: (room: StoredRoom) => void) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const room = await this.get(code),
        previous = room.version;
      apply(room);
      room.version++;
      room.serverTime = this.now();
      if (await this.store.put(room, previous)) return view(room, this.now());
    }
    throw new RoomError(503, '更新が混み合っています。再試行してください。');
  }
  async join(code: string, value: unknown) {
    const b = enter(value),
      [p, credentials] = await this.member(b, code, 0);
    const room = await this.mutate(code, (room) => {
      reap(room, this.now());
      requireValue(
        ['lobby', 'results'].includes(room.phase) &&
          (room.mode === 'free' || room.round === 0),
        409,
        'レース進行中です。',
      );
      const active = room.players.filter((p) => p.active);
      requireValue(active.length < 10, 409, 'このルームは満員です。');
      const player = structuredClone(p);
      player.slot = Array.from({ length: 10 }, (_, i) => i).find(
        (i) => !active.some((p) => p.slot === i),
      )!;
      room.players = [...active, player];
      if (!room.hostId) room.hostId = player.id;
      for (const member of room.players) member.ready = false;
    });
    return { room, credentials };
  }
  async command(code: string, token: string, value: unknown) {
    const b = object(value);
    requireValue(
      typeof b.type === 'string' &&
        [
          'heartbeat',
          'leave',
          'ready',
          'settings',
          'start',
          'next',
          'input',
        ].includes(b.type),
      400,
      '操作を確認してください。',
    );
    requireValue(
      typeof b.requestId === 'string' &&
        /^[a-zA-Z0-9-]{16,64}$/.test(b.requestId),
      400,
      '操作IDを確認してください。',
    );
    const hashed = await hash(token);
    const room = await this.mutate(code, (room) => {
      const p = this.auth(room, hashed),
        key = p.id + ':' + b.requestId;
      if (room.requests.includes(key)) return;
      reap(room, this.now());
      requireValue(
        p.active,
        403,
        '接続が切れました。ルームに再参加してください。',
      );
      p.lastSeen = this.now();
      if (['settings', 'start', 'next'].includes(b.type as string))
        requireValue(p.id === room.hostId, 403, 'ホストのみ操作できます。');
      this.apply(room, p, b);
      if (b.type !== 'input' && b.type !== 'heartbeat')
        room.requests = [...room.requests, key].slice(-100);
    });
    return { room, credentials: null };
  }
  private apply(room: StoredRoom, p: Player, b: ObjectValue) {
    if (b.type === 'heartbeat') return;
    if (b.type === 'leave') {
      p.active = false;
      if (room.phase === 'racing' && room.roster.includes(p.id))
        record(room, p, 'dnf');
      reap(room, this.now());
      return;
    }
    if (['ready', 'settings', 'start'].includes(b.type as string))
      requireValue(
        room.phase === 'lobby',
        409,
        '待機ルームで操作してください。',
      );
    if (b.type === 'ready') {
      requireValue(
        typeof b.ready === 'boolean',
        400,
        '準備状態を確認してください。',
      );
      p.ready = b.ready;
    } else if (b.type === 'settings') {
      requireValue(
        room.mode === 'free' || room.round === 0,
        409,
        'GP途中の設定変更はできません。',
      );
      room.mode = mode(b.mode);
      room.course =
        room.mode === 'grand-prix'
          ? 0
          : integer(b.course, 0, TRACKS.length - 1);
      for (const member of room.players) member.ready = false;
    } else if (b.type === 'start') {
      const active = room.players.filter((p) => p.active);
      requireValue(
        active.length >= 2 && active.every((p) => p.ready),
        409,
        '2人以上が準備完了してください。',
      );
      room.players = active;
      room.roster = active.map((p) => p.id);
      room.raceId = crypto.randomUUID();
      room.startAt = this.now() + 3000;
      room.phase = 'racing';
      room.round++;
      room.standings = [];
      for (const member of active) {
        member.racer = createRacer(
          TRACKS[room.course]!,
          member.slot,
          member.color,
          false,
        );
        member.racer.name = member.name;
        member.seq = member.ticks = 0;
      }
    } else if (b.type === 'next') {
      requireValue(
        ['results', 'complete'].includes(room.phase),
        409,
        '結果確定を待ってください。',
      );
      if (room.mode === 'grand-prix') {
        if (room.phase === 'complete') {
          room.round = room.course = 0;
          room.history = [];
          for (const member of room.players) member.score = 0;
        } else room.course = room.round;
      }
      room.phase = 'lobby';
      for (const member of room.players) member.ready = false;
    } else if (b.type === 'input') this.input(room, p, b);
  }
  private input(room: StoredRoom, p: Player, b: ObjectValue) {
    requireValue(b.raceId === room.raceId, 409, '前のレースの入力です。');
    const seq = integer(b.seq, 1, Number.MAX_SAFE_INTEGER);
    if (seq <= p.seq) return;
    requireValue(seq === p.seq + 1, 409, '入力の再同期が必要です。');
    requireValue(
      Array.isArray(b.frames) && b.frames.length > 0 && b.frames.length <= 120,
      400,
      '入力は1秒以内で送信してください。',
    );
    const frames: Frame[] = b.frames.map((f: unknown) => {
      const frame = object(f),
        input = object(frame.input),
        steer = input.steer;
      requireValue(
        typeof steer === 'number' &&
          Number.isFinite(steer) &&
          Math.abs(steer) <= 1 &&
          typeof input.push === 'boolean' &&
          typeof input.assist === 'boolean',
        400,
        '操作入力を確認してください。',
      );
      requireValue(
        Object.keys(input).every((k) =>
          ['steer', 'push', 'assist'].includes(k),
        ),
        400,
        '操作入力を確認してください。',
      );
      return {
        ticks: integer(frame.ticks, 1, 120),
        input: { steer, push: input.push, assist: input.assist },
      };
    });
    const count = frames.reduce((n, f) => n + f.ticks, 0);
    requireValue(count <= 120, 400, '入力は1秒以内で送信してください。');
    if (
      room.phase !== 'racing' ||
      room.standings.some((s) => s.playerId === p.id)
    )
      return;
    requireValue(
      p.racer && this.now() >= room.startAt,
      409,
      '開始を待ってください。',
    );
    requireValue(
      (p.ticks + count) * STEP * 1000 <= this.now() - room.startAt + 100,
      429,
      '入力が速すぎます。',
    );
    for (const frame of frames)
      for (let i = 0; i < frame.ticks; i++) {
        p.ticks++;
        tick(TRACKS[room.course]!, p.racer, frame.input, STEP, p.ticks * STEP);
      }
    p.seq = seq;
    if (p.racer.finish !== null) record(room, p, 'finish');
    settle(room);
  }
}
function json(value: unknown, status = 200): Response {
  return Response.json(value, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...(status === 429 ? { 'Retry-After': '2' } : {}),
    },
  });
}
export async function serve(
  request: Request,
  store: Store,
  now: () => number = Date.now,
): Promise<Response> {
  try {
    const url = new URL(request.url),
      path = url.pathname.replace(/\/$/, '');
    if (request.method === 'GET' && path === '/api/config')
      return json({ transport: 'poll', websocketUrl: '', httpHost: url.host });
    if (request.method === 'GET' && path === '/api/health')
      return json({ status: 'ok', courses: TRACKS.length });
    const rooms = new Rooms(store, now),
      match = /^\/api\/rooms\/([A-Z2-9]{6})(?:\/(join|commands))?$/.exec(path);
    const token =
      request.headers.get('Authorization')?.replace(/^Bearer /, '') ?? '';
    if (request.method === 'GET' && match && !match[2])
      return json(await rooms.read(match[1]!, token));
    requireValue(request.method === 'POST', 405, 'この操作は利用できません。');
    const origin = request.headers.get('Origin');
    requireValue(
      !origin || origin === url.origin,
      403,
      'このサイトから操作してください。',
    );
    requireValue(
      path === '/api/rooms' || (match && match[2]),
      404,
      '操作が見つかりません。',
    );
    requireValue(
      request.headers.get('Content-Type')?.includes('application/json'),
      415,
      'JSONで送信してください。',
    );
    const text = await request.text();
    requireValue(text.length <= 20000, 413, '入力が大きすぎます。');
    let b: unknown;
    try {
      b = JSON.parse(text);
    } catch {
      throw new RoomError(400, '入力形式を確認してください。');
    }
    if (path === '/api/rooms' || match?.[2] === 'join') {
      const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
      const key = await hash(ip);
      requireValue(
        await store.rate(key, Math.floor(now() / 60000), 30),
        429,
        '参加操作が多いため、少し待ってください。',
      );
    }
    if (path === '/api/rooms') return json(await rooms.create(b), 201);
    requireValue(match, 404, 'ルームが見つかりません。');
    if (match[2] === 'join') return json(await rooms.join(match[1]!, b));
    return json(await rooms.command(match[1]!, token, b));
  } catch (error) {
    if (error instanceof RoomError)
      return json({ detail: error.message }, error.status);
    return json(
      { detail: '通信エラーです。少し待って再試行してください。' },
      503,
    );
  }
}
