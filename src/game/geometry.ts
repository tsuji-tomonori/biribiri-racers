import type { PathPoint, Point, Track, TrackDefinition, Vec } from './types';
export const clamp = (v: number, a: number, b: number): number =>
  Math.max(a, Math.min(b, v));
export const angle = (v: number): number =>
  Math.atan2(Math.sin(v), Math.cos(v));
export const distance = (a: Point, b: Point): number =>
  Math.hypot(a.x - b.x, a.y - b.y);
export const RADIUS = 30;

export function inside(p: Point, poly: readonly Vec[]): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!,
      b = poly[j]!;
    if (
      a[1] > p.y !== b[1] > p.y &&
      p.x < ((b[0] - a[0]) * (p.y - a[1])) / (b[1] - a[1]) + a[0]
    )
      hit = !hit;
  }
  return hit;
}

export function onRoad(
  t: Track,
  x: number,
  y: number,
  radius = RADIUS,
): boolean {
  const p = { x, y };
  const clearance = (poly: readonly Vec[], rise = 0): number =>
    Math.min(
      ...poly.map((a, i) => {
        const b = poly[(i + 1) % poly.length]!;
        const dx = b[0] - a[0],
          dy = b[1] - a[1];
        const u = clamp(
          ((x - a[0]) * dx + (y + rise - a[1]) * dy) / (dx * dx + dy * dy || 1),
          0,
          1,
        );
        return Math.hypot(x - a[0] - u * dx, y + rise - a[1] - u * dy);
      }),
    );
  return (
    inside(p, t.outer) &&
    clearance(t.outer) >= radius &&
    t.holes.every(
      (h) => !inside(p, h) && clearance(h, t.wallRise) >= radius + 18,
    )
  );
}

export function finishSide(t: TrackDefinition, p: Point): number {
  const f = t.finish;
  return (
    (p.x - (f.a[0] + f.b[0]) / 2) * f.normal[0] +
    (p.y - (f.a[1] + f.b[1]) / 2) * f.normal[1]
  );
}

export function withinFinish(t: TrackDefinition, p: Point): boolean {
  const f = t.finish,
    dx = f.b[0] - f.a[0],
    dy = f.b[1] - f.a[1];
  const dot = (p.x - f.a[0]) * dx + (p.y - f.a[1]) * dy;
  return dot >= 0 && dot <= dx * dx + dy * dy;
}

export function compile(def: TrackDefinition, id: number): Track {
  const points = def.points,
    raw: Point[] = [];
  if (points.length < 2)
    throw new Error('A track requires at least two points');
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[Math.max(0, i - 1)]!,
      b = points[i]!,
      c = points[i + 1]!,
      d = points[Math.min(points.length - 1, i + 2)]!;
    const count = Math.ceil(Math.hypot(c[0] - b[0], c[1] - b[1]) / 5);
    for (let j = 0; j < count; j++) {
      const u = j / count,
        u2 = u * u,
        u3 = u2 * u;
      const coordinate = (k: 0 | 1): number =>
        0.5 *
        (2 * b[k] +
          (-a[k] + c[k]) * u +
          (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * u2 +
          (-a[k] + 3 * b[k] - 3 * c[k] + d[k]) * u3);
      raw.push({ x: coordinate(0), y: coordinate(1) });
    }
  }
  const end = points.at(-1)!;
  raw.push({ x: end[0], y: end[1] });
  let total = 0;
  const path: PathPoint[] = raw.map((p, i) => {
    const prev = raw[Math.max(0, i - 1)]!,
      next = raw[Math.min(raw.length - 1, i + 1)]!;
    total += distance(prev, p);
    return {
      ...p,
      s: total,
      angle: Math.atan2(next.y - prev.y, next.x - prev.x),
    };
  });
  let length = 0;
  for (let i = 1; i < path.length; i++) {
    if (
      finishSide(def, path[i - 1]!) < 0 &&
      finishSide(def, path[i]!) >= 0 &&
      withinFinish(def, path[i]!)
    )
      length = path[i]!.s;
  }
  if (!length) throw new Error(`${def.name}: route does not cross its finish`);
  // Three ordered course sectors accept every legal branch, without tying laps
  // to the CPU's centreline. The start-line crossing only counts after all three.
  const gates = def.checkpoints.map((p, index) => ({
    ...p,
    s: (length * (index + 1)) / (def.checkpoints.length + 1),
  }));
  return { ...def, id, path, length, gates };
}

export function nearest(t: Track, p: Point & { gate?: number }): PathPoint {
  let best = t.path[0]!,
    bestD = Infinity;
  for (const q of t.path) {
    if (p.gate === 0 && q.s > t.length * 0.85) continue;
    if (p.gate === t.gates.length && q.s < t.length * 0.15) continue;
    const d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
    if (d < bestD) {
      best = q;
      bestD = d;
    }
  }
  return best;
}

export function at(t: Track, s: number): PathPoint {
  let low = 0,
    high = t.path.length - 1;
  while (low < high) {
    const m = (low + high) >> 1;
    if (t.path[m]!.s < s) low = m + 1;
    else high = m;
  }
  return t.path[low]!;
}

export function crossedGate(old: Point, next: Point, gate: PathPoint): boolean {
  const tx = Math.cos(gate.angle),
    ty = Math.sin(gate.angle);
  return (
    (old.x - gate.x) * tx + (old.y - gate.y) * ty < 0 &&
    (next.x - gate.x) * tx + (next.y - gate.y) * ty >= 0 &&
    distance(next, gate) < (gate.width ?? 115)
  );
}
