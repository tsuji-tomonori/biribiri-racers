import { describe, expect, it } from 'vitest';
import { TRACKS } from '../../src/game/tracks';
import {
  advance,
  cpuInput,
  createRacer,
  reset,
  STEP,
  tick,
} from '../../src/game/physics';
import { compile, onRoad } from '../../src/game/geometry';
import { keyboardInput } from '../../src/game/input';
import { Session } from '../../src/game/session';
const track = TRACKS[0]!;
const options = {
  mode: 'race' as const,
  color: 0,
  assist: true,
  difficulty: 'easy' as const,
};
for (const t of TRACKS)
  describe(t.name, () => {
    it('4台のCPUが同じ物理と衝突判定で順路を完走する', () => {
      const racers = [0, 1, 2, 3].map((i) => createRacer(t, i, i, true));
      for (let time = 0; time < 70; time += STEP) {
        racers.forEach((r) => tick(t, r, cpuInput(t, r, 'normal'), STEP, time));
        if (racers.every((r) => r.finish !== null)) break;
      }
      for (const r of racers) {
        expect(r.finish).not.toBeNull();
        expect(r.hits).toBe(0);
        expect(r.gate).toBe(t.gates.length);
        expect(r.progress).toBe(1);
      }
    });
    it.each([0, 1, 2, 3])(
      '機体 %i はプレイヤー速度でも順路を完走できる',
      (color) => {
        const r = createRacer(t, 0, color, false);
        for (let time = 0; time < 70; time += STEP) {
          tick(
            t,
            r,
            { ...cpuInput(t, r, 'normal'), throttle: 1, assist: true },
            STEP,
            time,
          );
          if (r.finish !== null) break;
        }
        expect(r.finish).not.toBeNull();
        expect(r.hits).toBe(0);
      },
    );
    it('ゴールだけ100往復しても勝利しない', () => {
      const r = createRacer(t, 0, 0, false),
        f = t.finish,
        x = (f.a[0] + f.b[0]) / 2,
        y = (f.a[1] + f.b[1]) / 2;
      for (let i = 0; i < 100; i++) {
        r.x = x + f.normal[0] * 5;
        r.y = y + f.normal[1] * 5;
        expect(
          advance(t, r, { x: x - f.normal[0] * 5, y: y - f.normal[1] * 5 }),
        ).toBeNull();
      }
    });
    it('順路の全区間にマシンの車幅を確保する', () => {
      for (const p of t.path.filter((p) => p.s < t.length))
        expect(onRoad(t, p.x, p.y)).toBe(true);
    });
  });
it('壁への接触は速度・チャージ・チェックポイントをすべてリセットする', () => {
  const r = createRacer(track, 0, 0, false);
  Object.assign(r, {
    gate: 8,
    progress: 0.7,
    charge: 1,
    boost: 1,
    speed: 220,
    x: 0,
    y: 0,
  });
  expect(
    tick(track, r, { steer: 0, push: false, assist: false }, STEP, 10)?.type,
  ).toBe('collision');
  expect(r).toMatchObject({
    hits: 1,
    gate: 0,
    progress: 0,
    charge: 0,
    boost: 0,
    vx: 0,
    vy: 0,
  });
  const position = [r.x, r.y];
  tick(track, r, { steer: 1, push: true, assist: true }, STEP, 11);
  expect([r.x, r.y]).toEqual(position);
});
it('逆向き・順路省略・ゲートの外側ではゴールできない', () => {
  const r = createRacer(track, 0, 0, false);
  r.gate = track.gates.length;
  r.travel = track.length;
  r.x = 193;
  r.y = 635;
  expect(advance(track, r, { x: 193, y: 625 })).toBeNull();
  r.gate--;
  r.y = 625;
  expect(advance(track, r, { x: 193, y: 635 })).toBeNull();
  r.gate++;
  r.x = 900;
  expect(advance(track, r, { x: 900, y: 635 })).toBeNull();
});
it('押して減速とチャージ、離して1回だけダッシュする', () => {
  const r = createRacer(track, 0, 0, false);
  r.speed = 180;
  for (let i = 0; i < 110; i++)
    tick(track, r, { steer: 0, push: true, assist: false }, STEP, i * STEP);
  expect(r.speed).toBeLessThan(60);
  expect(r.charge).toBe(1);
  expect(
    tick(track, r, { steer: 0, push: false, assist: false }, STEP, 1)?.type,
  ).toBe('boost');
  tick(track, r, { steer: 0, push: false, assist: false }, STEP, 1.01);
  expect(r.dashCount).toBe(1);
});
it('反対方向の同時入力は打ち消し、キーを放すと停止する', () => {
  expect(keyboardInput(new Set(['KeyA', 'ArrowRight', 'Space']), true)).toEqual(
    { steer: 0, push: true, assist: true },
  );
  expect(keyboardInput(new Set(), false)).toEqual({
    steer: 0,
    push: false,
    assist: false,
  });
});
it('ポーズ中は時間・位置・カウントダウンが進まない', () => {
  const s = new Session(track, options);
  s.start();
  s.pause();
  s.update(1, { steer: 1, push: false, assist: true });
  expect(s.countdown).toBe(3);
  expect(s.time).toBe(0);
  s.resume();
  for (let i = 0; i < 250; i++)
    s.update(1 / 60, { steer: 0, push: true, assist: true });
  s.pause();
  const time = s.time,
    x = s.racers[0]!.x;
  for (let i = 0; i < 200; i++)
    s.update(1 / 60, { steer: 1, push: false, assist: true });
  expect(s.time).toBe(time);
  expect(s.racers[0]!.x).toBe(x);
  s.resume();
  expect(s.phase).toBe('racing');
});
it('描画30/60/144Hzで同じ時間・走行状態になる', () => {
  const snapshots = [30, 60, 144].map((fps) => {
    const s = new Session(track, { ...options, mode: 'practice' });
    s.start();
    for (let i = 0; i < fps * 8; i++)
      s.update(1 / fps, { steer: 0, push: true, assist: true });
    return [s.time, s.racers[0]!.x, s.racers[0]!.y];
  });
  snapshots
    .slice(1)
    .forEach((p) =>
      p.forEach((v, i) => expect(v).toBeCloseTo(snapshots[0]![i]!, 6)),
    );
});
it('CPUが勝利するとレースが終わり、再開始で前レースの状態を消す', () => {
  const s = new Session(track, options);
  s.start();
  for (let i = 0; i < 60 * 70 && s.phase !== 'finished'; i++)
    s.update(1 / 60, { steer: 0, push: true, assist: true });
  expect(s.phase).toBe('finished');
  expect(s.order()[0]!.cpu).toBe(true);
  s.start();
  expect(s.racers.every((r) => r.finish === null && r.hits === 0)).toBe(true);
  expect(s.time).toBe(0);
  expect(s.phase).toBe('countdown');
});
it('練習モードは1台だけで、手動復帰も進行度をリセットする', () => {
  const s = new Session(track, { ...options, mode: 'practice' });
  s.start();
  expect(s.racers).toHaveLength(1);
  s.returnToStart();
  expect(s.racers[0]!.hits).toBe(0);
  s.phase = 'racing';
  s.returnToStart();
  expect(s.racers[0]!.hits).toBe(1);
  reset(track, s.racers[0]!);
  expect(s.racers[0]!.progress).toBe(0);
});
it('無効なコース定義をビルド時に拒否する', () => {
  expect(() => compile({ ...track, points: [] }, 9)).toThrow();
  expect(() =>
    compile(
      {
        ...track,
        points: [
          [0, 0],
          [10, 10],
        ],
      },
      9,
    ),
  ).toThrow();
});
