import { MACHINES } from './machines';
import {
  angle,
  at,
  clamp,
  crossedGate,
  distance,
  finishSide,
  nearest,
  onRoad,
  withinFinish,
} from './geometry';
import type { Input, Point, RaceEvent, Racer, Track } from './types';
export const STEP = 1 / 120;
export const COLORS = ['#078bff', '#ff3a89', '#06a37b', '#ec9b05'] as const;
const NAMES = ['ビリリ', 'さくら', 'みどり', 'ひかる'] as const;

export function spawn(t: Track, r: Racer): void {
  const p = t.path[0]!,
    lateral = [-25, 25, -25, 25][r.id] ?? 0,
    back = r.id >= 2 ? 48 : 0;
  r.x = p.x - Math.sin(p.angle) * lateral - Math.cos(p.angle) * back;
  r.y = p.y + Math.cos(p.angle) * lateral - Math.sin(p.angle) * back;
  if (!onRoad(t, r.x, r.y)) {
    r.x = p.x;
    r.y = p.y;
  }
  r.heading = p.angle;
  r.vx = 0;
  r.vy = 0;
  r.speed = 0;
  r.charge = 0;
  r.boost = 0;
  r.pushing = false;
  r.gate = 0;
  r.progress = 0;
  r.travel = 0;
  r.winding = 0;
}

export function createRacer(
  t: Track,
  id: number,
  color: number,
  cpu: boolean,
): Racer {
  const r: Racer = {
    id,
    color,
    cpu,
    name: cpu ? NAMES[color]! : 'あなた',
    x: 0,
    y: 0,
    heading: 0,
    vx: 0,
    vy: 0,
    speed: 0,
    charge: 0,
    boost: 0,
    pushing: false,
    gate: 0,
    progress: 0,
    hits: 0,
    respawn: 0,
    shock: 0,
    finish: null,
    dashCount: 0,
    travel: 0,
    winding: 0,
  };
  spawn(t, r);
  return r;
}

export function reset(t: Track, r: Racer): void {
  r.shock = 0;
  r.hits++;
  spawn(t, r);
  r.respawn = 1.05;
}

export function advance(t: Track, r: Racer, old: Point): number | null {
  const gate = t.gates[r.gate];
  if (gate && crossedGate(old, r, gate)) r.gate++;
  const n = nearest(t, r),
    maxS = t.gates[r.gate]?.s ?? t.length;
  r.progress = clamp(Math.min(n.s, maxS) / t.length, 0, 1);
  r.travel += distance(old, r);
  // Signed winding rejects collecting sectors by backtracking. Anchors lie in
  // an impassable inner island shared by every supported branch.
  const [ax, ay] = t.lapAnchor;
  r.winding += angle(
    Math.atan2(r.y - ay, r.x - ax) - Math.atan2(old.y - ay, old.x - ax),
  );
  const before = finishSide(t, old),
    after = finishSide(t, r);
  // Every ordered gate, legal travel, and the forward crossing are required together.
  if (
    r.gate !== t.gates.length ||
    r.winding < Math.PI * 2 ||
    r.travel <= t.length * 0.48 ||
    before >= 0 ||
    after < 0 ||
    !withinFinish(t, r)
  )
    return null;
  return -before / (after - before);
}

export function cpuInput(
  t: Track,
  r: Racer,
  difficulty: 'easy' | 'normal',
): Input {
  const n = nearest(t, r),
    target = at(t, n.s + 68),
    err = angle(Math.atan2(target.y - r.y, target.x - r.x) - r.heading);
  const bend = Math.abs(angle(at(t, n.s + 125).angle - n.angle));
  return {
    steer: clamp(err * 2.6, -1, 1),
    push: (Math.abs(err) > 0.36 || bend > 0.55) && r.speed > 70,
    throttle: (difficulty === 'easy' ? 0.5 : 0.67) + 0.035 * r.id,
    assist: false,
  };
}

export function tick(
  t: Track,
  r: Racer,
  input: Input,
  dt: number,
  time: number,
): RaceEvent | null {
  if (r.finish !== null) return null;
  if (r.shock > 0) {
    r.shock = Math.max(0, r.shock - dt);
    if (r.shock === 0) {
      spawn(t, r);
      r.respawn = 0.75;
    }
    return null;
  }
  if (r.respawn > 0) {
    r.respawn = Math.max(0, r.respawn - dt);
    return null;
  }
  const machine = MACHINES[r.color]!;
  const old = { x: r.x, y: r.y },
    steer = clamp(input.steer, -1, 1);
  let event: RaceEvent | null = null;
  if (!input.push && r.pushing) {
    if (r.charge > 0.12) {
      r.boost = (0.35 + 1.15 * r.charge) * machine.duration;
      r.dashCount++;
      event = { type: 'boost', racer: r.id };
    }
    r.charge = 0;
  }
  r.pushing = input.push;
  r.boost = Math.max(0, r.boost - dt);
  if (input.push) {
    r.charge = clamp(r.charge + dt / machine.charge, 0, 1);
    r.boost = 0;
  }
  const target = input.push
    ? 52
    : t.speed *
      machine.speed *
      (input.throttle ?? 1) *
      (r.boost > 0 ? machine.boost : 1);
  r.speed += (target - r.speed) * (1 - Math.exp(-(input.push ? 7 : 1.6) * dt));
  let turn =
    steer *
    machine.turn *
    (input.push ? 3.45 : 2.55) *
    (0.55 + 0.45 * clamp(r.speed / 85, 0, 1));
  if (input.assist) {
    const n = nearest(t, r),
      q = at(t, n.s + 80),
      error = angle(Math.atan2(q.y - r.y, q.x - r.x) - r.heading);
    if (Math.abs(error) < 1.2)
      turn += clamp(error * 1.2, -0.82, 0.82) * (1 - Math.abs(steer) * 0.65);
  }
  r.heading = angle(r.heading + turn * dt);
  const traction =
    1 - Math.exp(-(input.push ? 10 : t.grip * machine.grip) * dt);
  r.vx += (Math.cos(r.heading) * r.speed - r.vx) * traction;
  r.vy += (Math.sin(r.heading) * r.speed - r.vy) * traction;
  r.x += r.vx * dt;
  r.y += r.vy * dt;
  if (!onRoad(t, r.x, r.y)) {
    const hit = { x: r.x, y: r.y };
    r.hits++;
    r.x = old.x;
    r.y = old.y;
    r.speed = 0;
    r.vx = 0;
    r.vy = 0;
    r.charge = 0;
    r.boost = 0;
    r.pushing = false;
    r.gate = 0;
    r.progress = 0;
    r.travel = 0;
    r.winding = 0;
    r.shock = 0.3;
    return { type: 'collision', racer: r.id, ...hit };
  }
  const crossing = advance(t, r, old);
  if (crossing !== null) {
    r.finish = time - dt + crossing * dt;
    r.progress = 1;
    r.speed = 0;
    r.vx = 0;
    r.vy = 0;
    return { type: 'finish', racer: r.id };
  }
  return event;
}
