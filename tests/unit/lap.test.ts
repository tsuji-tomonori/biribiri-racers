import { expect, it } from 'vitest';
import { TRACKS } from '../../src/game/tracks';
import { compile, onRoad } from '../../src/game/geometry';
import {
  advance,
  createRacer,
  cpuInput,
  STEP,
  tick,
} from '../../src/game/physics';
import type { Vec } from '../../src/game/types';

it.each(TRACKS)(
  '$name: 初回のスタート通過では終了せず一周後に終了する',
  (t) => {
    const r = createRacer(t, 0, 0, false);
    let first = false;
    for (let time = 0; time < (t.worldSize ? 180 : 70); time += STEP) {
      tick(
        t,
        r,
        { ...cpuInput(t, r, 'normal'), assist: true, throttle: 1 },
        STEP,
        time,
      );
      if (r.y < t.finish.a[1] && r.gate === 0) {
        first = true;
        expect(r.finish).toBeNull();
      }
      if (r.finish !== null) break;
    }
    expect(first).toBe(true);
    expect(r.finish).not.toBeNull();
    expect(Math.abs(r.y - t.finish.a[1])).toBeLessThan(3);
  },
  120000,
);
it.each(
  [false, true].flatMap((cpu) => [0, 1, 2, 3].map((color) => ({ cpu, color }))),
)(
  '接触した CPU=$cpu 機体=$color は感電後に同じスタート位置に戻る',
  ({ cpu, color }) => {
    const t = TRACKS[0]!,
      r = createRacer(t, color, color, cpu),
      start = { x: r.x, y: r.y };
    Object.assign(r, {
      x: 1085,
      y: 880,
      heading: 0,
      speed: 230,
      vx: 230,
      gate: 2,
      progress: 0.7,
      charge: 0.9,
    });
    let event;
    for (let i = 0; i < 200; i++) {
      event = tick(
        t,
        r,
        { steer: 0, push: false, assist: false },
        STEP,
        i * STEP,
      );
      if (event?.type === 'collision') break;
    }
    expect(event?.type).toBe('collision');
    expect(r.shock).toBeGreaterThan(0);
    expect(onRoad(t, r.x, r.y)).toBe(true);
    expect(r.x).not.toBe(start.x);
    expect(r.gate).toBe(0);
    expect(r.charge).toBe(0);
    for (let i = 0; i < 40; i++)
      tick(t, r, { steer: 1, push: true, assist: true }, STEP, i * STEP);
    expect(r.x).toBe(start.x);
    expect(r.y).toBe(start.y);
    expect(r.respawn).toBeGreaterThan(0);
    expect(r.hits).toBe(1);
  },
);
it('逆走・ライン外通過・区間省略では一周と認めない', () => {
  const t = TRACKS[0]!,
    r = createRacer(t, 0, 0, false),
    y = t.finish.a[1];
  Object.assign(r, {
    gate: 3,
    travel: t.length,
    winding: Math.PI * 2,
    x: 193,
    y: y + 1,
  });
  expect(advance(t, r, { x: 193, y: y - 1 })).toBeNull();
  Object.assign(r, { gate: 2, y: y - 1 });
  expect(advance(t, r, { x: 193, y: y + 1 })).toBeNull();
  Object.assign(r, { gate: 3, x: 400 });
  expect(advance(t, r, { x: 400, y: y + 1 })).toBeNull();
  Object.assign(r, { x: 193 });
  expect(advance(t, r, { x: 193, y: y + 1 })).not.toBeNull();
});
it('4マシンの速度・旋回・チャージダッシュが実際の運動に反映される', () => {
  const t = TRACKS[0]!;
  const sample = (color: number, steer: number, push: boolean) => {
    const r = createRacer(t, 0, color, false);
    r.speed = 100;
    for (let i = 0; i < 30; i++)
      tick(t, r, { steer, push, assist: false }, STEP, i * STEP);
    return r;
  };
  expect(sample(1, 0, false).speed).toBeGreaterThan(sample(0, 0, false).speed);
  expect(sample(2, 0, false).speed).toBeLessThan(sample(0, 0, false).speed);
  expect(sample(2, 0.2, false).heading).toBeGreaterThan(
    sample(0, 0.2, false).heading,
  );
  expect(sample(1, 0.2, false).heading).toBeLessThan(
    sample(0, 0.2, false).heading,
  );
  const bolt = sample(3, 0, true),
    blue = sample(0, 0, true);
  expect(bolt.charge).toBeGreaterThan(blue.charge);
  for (const r of [bolt, blue])
    tick(t, r, { steer: 0, push: false, assist: false }, STEP, 1);
  expect(bolt.boost).toBeGreaterThan(blue.boost);
});
const garden = TRACKS[4]!;
const branches: readonly Vec[][] = [
  [
    [680, 225],
    [700, 360],
    [700, 445],
    [590, 460],
    [495, 515],
    [476, 620],
    [463, 745],
    [500, 796],
    [620, 826],
    [714, 872],
    [706, 985],
    [685, 1097],
  ],
  [
    [680, 225],
    [720, 345],
    [738, 446],
    [824, 495],
    [899, 536],
    [918, 635],
    [917, 745],
    [948, 818],
    [1034, 842],
    [1125, 916],
    [1130, 1018],
    [1089, 1080],
    [990, 1113],
    [780, 1100],
  ],
];
it.each(branches.map((points, i) => ({ points, i })))(
  'サンダーガーデンの分岐 $i を通っても一周が成立する',
  ({ points }) => {
    const t = compile(
      {
        ...garden,
        points: [
          ...garden.points.slice(0, 6),
          ...points,
          ...garden.points.slice(-9),
        ],
      },
      4,
    );
    const r = createRacer(t, 0, 0, false);
    for (let time = 0; time < 90; time += STEP) {
      const e = tick(t, r, cpuInput(t, r, 'normal'), STEP, time);
      if (e?.type === 'collision') throw new Error(JSON.stringify(e));
      if (r.finish !== null) break;
    }
    expect(r.hits).toBe(0);
    expect(r.finish).not.toBeNull();
    expect(r.gate).toBe(3);
    const actual = createRacer(garden, 0, 0, false);
    let crossing: number | null = null;
    for (const point of t.path) {
      const old = { x: actual.x, y: actual.y };
      actual.x = point.x;
      actual.y = point.y;
      expect(onRoad(garden, point.x, point.y)).toBe(true);
      crossing = advance(garden, actual, old);
      if (crossing !== null) break;
    }
    expect(crossing).not.toBeNull();
  },
);

it('車体の円周と壁の可視面を含む境界で接触する', () => {
  const t = {
    ...TRACKS[0]!,
    outer: [
      [0, 0],
      [200, 0],
      [200, 200],
      [0, 200],
    ] as const,
    holes: [],
  };
  expect(onRoad(t, 30, 100)).toBe(true);
  expect(onRoad(t, 29.9, 100)).toBe(false);
  expect(onRoad(t, 170.1, 100)).toBe(false);
  expect(onRoad(t, 100, 29.9)).toBe(false);
  expect(onRoad(TRACKS[0]!, 500, 280)).toBe(false);
  expect(onRoad(TRACKS[0]!, 500, 224)).toBe(true);
});

it('区間を逆走で回収しても、内側を一周していなければ終了しない', () => {
  const t = TRACKS[4]!,
    r = createRacer(t, 0, 0, false);
  Object.assign(r, {
    gate: 3,
    travel: t.length * 2,
    winding: 0,
    x: 190,
    y: 509,
  });
  expect(advance(t, r, { x: 190, y: 512 })).toBeNull();
});

it.each([
  [0, 624, 1180],
  [1, 955, 1080],
  [2, 1015, 1170],
  [3, 603, 1190],
  [4, 914, 1200],
])('コース%i: 閉じた旧出口を走行領域にしない', (id, x, y) => {
  expect(onRoad(TRACKS[id!]!, x!, y!)).toBe(false);
});
