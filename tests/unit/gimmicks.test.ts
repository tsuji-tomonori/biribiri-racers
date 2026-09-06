import { describe, expect, it } from 'vitest';
import { TRACKS } from '../../src/game/tracks';
import {
  createRacer,
  cpuInput,
  reset,
  STEP,
  tick,
} from '../../src/game/physics';
import {
  applyGimmicks,
  FLOOR_BOOST_SECONDS,
  SPIN_SECONDS,
} from '../../src/game/gimmicks';
import { onRoad } from '../../src/game/geometry';
import { Session } from '../../src/game/session';
import type { Gimmick } from '../../src/game/types';
const input = { steer: 0, push: false, assist: false };
function setup(kind: Gimmick['kind'], cpu = false) {
  const t = TRACKS.find((t) => t.gimmicks?.some((g) => g.kind === kind))!;
  const g = t.gimmicks!.find((g) => g.kind === kind)!;
  const r = createRacer(t, 0, 0, cpu);
  Object.assign(r, { x: g.x, y: g.y, heading: 0, speed: 195, vx: 195 });
  return { t, g, r };
}
it.each([false, true])(
  'CPU=%s もバナナで一回転分停止し、入力を持ち越さず復帰する',
  (cpu) => {
    const { t, r, g } = setup('spin', cpu);
    expect(tick(t, r, input, STEP, 1)).toMatchObject({
      type: 'gimmick',
      kind: 'spin',
    });
    expect(r.spin).toBe(SPIN_SECONDS);
    for (let i = 0; i < 96; i++)
      tick(t, r, { steer: 1, push: true, assist: true }, STEP, 1 + i * STEP);
    expect(r.x).toBe(g.x);
    expect(r.y).toBe(g.y);
    expect(r.heading).toBe(0);
    expect(r.charge).toBe(0);
    for (let i = 0; i < 3; i++) tick(t, r, input, STEP, 2 + i * STEP);
    expect(r.spin).toBe(0);
    expect(r.x).toBeGreaterThan(g.x);
    expect(r.dashCount).toBe(0);
    expect(r.hits).toBe(0);
  },
);
it('床は滞在中に再発火せず、一度出てから再進入すると発火する', () => {
  const { t, r, g } = setup('spin');
  expect(applyGimmicks(t, r)).not.toBeNull();
  r.spin = 0;
  expect(applyGimmicks(t, r)).toBeNull();
  expect(r.spin).toBe(0);
  r.x = g.x + g.radius + 1;
  applyGimmicks(t, r);
  r.x = g.x;
  expect(applyGimmicks(t, r)).toMatchObject({ kind: 'spin' });
});
it('バナナの横を安全に通り抜けられる', () => {
  const { t, r, g } = setup('spin');
  r.y += 50;
  expect(onRoad(t, r.x, r.y)).toBe(true);
  expect(applyGimmicks(t, r)).toBeNull();
  expect(r.spin).toBe(0);
  expect(g.radius).toBeLessThan(50);
});
it('風は表示方向へ押し、減速中は実際に押し戻し、範囲外では消える', () => {
  const { t, r, g } = setup('wind');
  r.speed = 52;
  r.vx = 52;
  expect(tick(t, r, { ...input, push: true }, STEP, 1)).toMatchObject({
    kind: 'wind',
  });
  expect(r.x).toBeLessThan(g.x);
  expect(r.wind).toBe(true);
  r.x = g.x + g.radius + 2;
  tick(t, r, input, STEP, 2);
  expect(r.wind).toBe(false);
});
it('加速床は実速度を上げ、時間切れまたはPUSHで解除する', () => {
  const { t, r, g } = setup('dash');
  r.heading = g.angle;
  r.vx = -195;
  expect(applyGimmicks(t, r)).toMatchObject({ kind: 'dash' });
  expect(r.floorBoost).toBe(FLOOR_BOOST_SECONDS);
  for (let i = 0; i < 60; i++) tick(t, r, input, STEP, 1 + i * STEP);
  expect(r.speed).toBeGreaterThan(240);
  tick(t, r, { ...input, push: true }, STEP, 2);
  expect(r.floorBoost).toBe(0);
  r.floorBoost = 0.01;
  for (let i = 0; i < 3; i++) tick(t, r, input, STEP, 3 + i * STEP);
  expect(r.floorBoost).toBe(0);
});
it.each(['spin', 'dash', 'wind'] as const)(
  '%s は手動復帰・壁衝突・再開始で残らない',
  (kind) => {
    const { t, r } = setup(kind);
    applyGimmicks(t, r);
    reset(t, r);
    expect(r).toMatchObject({
      spin: 0,
      floorBoost: 0,
      wind: false,
      activeGimmicks: [],
    });
    Object.assign(r, {
      respawn: 0,
      x: 0,
      y: 0,
      spin: 0,
      floorBoost: 1,
      wind: true,
    });
    expect(tick(t, r, input, STEP, 1)?.type).toBe('collision');
    expect(r).toMatchObject({
      spin: 0,
      floorBoost: 0,
      wind: false,
      activeGimmicks: [],
    });
  },
);
it('停止中はギミックの残り時間が変わらない', () => {
  const s = new Session(TRACKS[6]!, {
    mode: 'practice',
    color: 0,
    assist: true,
    difficulty: 'easy',
  });
  s.start();
  s.phase = 'racing';
  s.racers[0]!.spin = 0.5;
  s.racers[0]!.floorBoost = 0.7;
  s.pause();
  s.update(0.2, input);
  expect(s.racers[0]!.spin).toBe(0.5);
  expect(s.racers[0]!.floorBoost).toBe(0.7);
  s.start();
  expect(s.racers[0]!.spin).toBe(0);
});
describe.each(TRACKS.slice(5))('%sの長距離設計', (t) => {
  it('既存最長の1.6倍以上で、床の中心も安全な路面内にある', () => {
    expect(t.length).toBeGreaterThan(
      Math.max(...TRACKS.slice(0, 5).map((t) => t.length)) * 1.6,
    );
    for (const g of t.gimmicks!) expect(onRoad(t, g.x, g.y)).toBe(true);
  });
  it('やさしいCPUの全機体が制限時間内にギミック込みで完走する', () => {
    const racers = [0, 1, 2, 3].map((i) => createRacer(t, i, i, true));
    for (
      let time = 0;
      time < (t.timeLimit ?? 180) && racers.some((r) => r.finish === null);
      time += STEP
    )
      racers.forEach((r) => tick(t, r, cpuInput(t, r, 'easy'), STEP, time));
    for (const r of racers) {
      expect(r.finish).not.toBeNull();
      expect(r.hits).toBe(0);
    }
  }, 120000);
});
