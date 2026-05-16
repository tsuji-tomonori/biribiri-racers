export interface TrackPoint {
  x: number;
  y: number;
}

export interface TrackSample extends TrackPoint {
  distance: number;
}

export type TrackSamples = TrackSample[] & { total: number };

export const trackPoints: TrackPoint[] = [
  { x: 165, y: 545 },
  { x: 165, y: 230 },
  { x: 255, y: 145 },
  { x: 575, y: 150 },
  { x: 815, y: 165 },
  { x: 875, y: 265 },
  { x: 840, y: 420 },
  { x: 715, y: 475 },
  { x: 565, y: 430 },
  { x: 475, y: 325 },
  { x: 365, y: 395 },
  { x: 380, y: 535 },
  { x: 545, y: 575 },
  { x: 770, y: 545 },
  { x: 845, y: 455 },
  { x: 835, y: 285 },
  { x: 715, y: 220 },
  { x: 535, y: 245 },
  { x: 455, y: 405 },
  { x: 530, y: 520 },
  { x: 315, y: 585 },
  { x: 165, y: 545 },
];

export function buildTrackPath(points: TrackPoint[]): Path2D {
  const path = new Path2D();
  path.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => path.lineTo(point.x, point.y));
  return path;
}

export function buildSamples(points: TrackPoint[], stepsPerSegment: number): TrackSamples {
  const result = Object.assign([] as TrackSample[], { total: 0 });
  let distance = 0;

  for (let i = 0; i < points.length - 1; i += 1) {
    const start = points[i];
    const end = points[i + 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const segment = Math.hypot(dx, dy);

    for (let step = 0; step < stepsPerSegment; step += 1) {
      const t = step / stepsPerSegment;
      result.push({ x: start.x + dx * t, y: start.y + dy * t, distance });
      distance += segment / stepsPerSegment;
    }
  }

  result.total = distance;
  return result;
}

export const trackSamples = buildSamples(trackPoints, 20);

export function nearestProgress(samples: TrackSamples, x: number, y: number): number {
  let bestIndex = 0;
  let bestDistance = Infinity;

  for (let i = 0; i < samples.length; i += 1) {
    const sample = samples[i];
    const distance = (sample.x - x) ** 2 + (sample.y - y) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }

  return samples[bestIndex].distance / samples.total;
}
