import { distance } from './geometry';
import type { RaceEvent, Racer, Track } from './types';
export const SPIN_SECONDS = 0.8;
export const FLOOR_BOOST_SECONDS = 1.1;

export function clearGimmicks(r: Racer): void {
  r.spin = 0;
  r.floorBoost = 0;
  r.wind = false;
  r.activeGimmicks = [];
}
// Edge-triggered per racer: a pad re-arms only once that racer has left it.
export function applyGimmicks(t: Track, r: Racer): RaceEvent | null {
  const active: number[] = [];
  let event: RaceEvent | null = null;
  r.wind = false;
  for (const [i, g] of (t.gimmicks ?? []).entries()) {
    if (distance(r, g) > g.radius) continue;
    active.push(i);
    if (g.kind === 'wind') r.wind = true;
    if (r.activeGimmicks.includes(i)) continue;
    event = { type: 'gimmick', kind: g.kind, racer: r.id };
    if (g.kind === 'spin') {
      r.spin = SPIN_SECONDS;
      r.speed = 0;
      r.vx = 0;
      r.vy = 0;
      r.boost = 0;
      r.floorBoost = 0;
      r.charge = 0;
      r.pushing = false;
    }
    if (g.kind === 'dash') r.floorBoost = FLOOR_BOOST_SECONDS;
  }
  r.activeGimmicks = active;
  return event;
}
