export interface ChipPoint {
  x: number;
  y: number;
}

export interface ChipTrackSample extends ChipPoint {
  distance: number;
}

export type ChipTrackSamples = ChipTrackSample[] & { total: number };

export interface ChipStartPose extends ChipPoint {
  angle: number;
}

export interface ChipTrackSpec {
  courseId: string;
  designWidth: number;
  designHeight: number;
  roadWidth: number;
  chipSize: number;
  chipSpacing: number;
  points: ChipPoint[];
  samples: ChipTrackSamples;
  path: Path2D;
  start: ChipStartPose;
  decorSeed: number;
}

const DESIGN_WIDTH = 980;
const DESIGN_HEIGHT = 680;

const COURSE_POINTS: Record<string, ChipPoint[]> = {
  "01": [
    { x: 168, y: 548 },
    { x: 160, y: 252 },
    { x: 262, y: 132 },
    { x: 592, y: 142 },
    { x: 832, y: 174 },
    { x: 878, y: 292 },
    { x: 812, y: 436 },
    { x: 684, y: 478 },
    { x: 558, y: 406 },
    { x: 462, y: 300 },
    { x: 348, y: 388 },
    { x: 382, y: 548 },
    { x: 570, y: 588 },
    { x: 804, y: 538 },
    { x: 870, y: 410 },
    { x: 816, y: 264 },
    { x: 666, y: 220 },
    { x: 530, y: 260 },
    { x: 460, y: 418 },
    { x: 534, y: 548 },
    { x: 318, y: 596 },
    { x: 168, y: 548 },
  ],
  "02": [
    { x: 142, y: 548 },
    { x: 142, y: 168 },
    { x: 286, y: 112 },
    { x: 624, y: 112 },
    { x: 846, y: 190 },
    { x: 846, y: 322 },
    { x: 690, y: 356 },
    { x: 520, y: 286 },
    { x: 354, y: 330 },
    { x: 344, y: 476 },
    { x: 486, y: 536 },
    { x: 770, y: 492 },
    { x: 868, y: 578 },
    { x: 676, y: 628 },
    { x: 360, y: 596 },
    { x: 142, y: 548 },
  ],
  "03": [
    { x: 180, y: 540 },
    { x: 238, y: 284 },
    { x: 374, y: 146 },
    { x: 606, y: 134 },
    { x: 766, y: 226 },
    { x: 742, y: 384 },
    { x: 570, y: 430 },
    { x: 402, y: 354 },
    { x: 278, y: 420 },
    { x: 326, y: 570 },
    { x: 548, y: 606 },
    { x: 806, y: 552 },
    { x: 870, y: 404 },
    { x: 806, y: 272 },
    { x: 638, y: 238 },
    { x: 468, y: 306 },
    { x: 354, y: 486 },
    { x: 180, y: 540 },
  ],
  "04": [
    { x: 158, y: 530 },
    { x: 214, y: 244 },
    { x: 364, y: 120 },
    { x: 540, y: 174 },
    { x: 612, y: 320 },
    { x: 514, y: 450 },
    { x: 360, y: 422 },
    { x: 316, y: 562 },
    { x: 512, y: 612 },
    { x: 744, y: 566 },
    { x: 858, y: 422 },
    { x: 808, y: 220 },
    { x: 668, y: 128 },
    { x: 494, y: 178 },
    { x: 426, y: 342 },
    { x: 546, y: 492 },
    { x: 754, y: 504 },
    { x: 862, y: 612 },
    { x: 584, y: 638 },
    { x: 158, y: 530 },
  ],
  "05": [
    { x: 150, y: 552 },
    { x: 154, y: 210 },
    { x: 284, y: 118 },
    { x: 510, y: 118 },
    { x: 632, y: 216 },
    { x: 578, y: 348 },
    { x: 404, y: 356 },
    { x: 350, y: 492 },
    { x: 492, y: 586 },
    { x: 724, y: 588 },
    { x: 860, y: 480 },
    { x: 838, y: 300 },
    { x: 714, y: 234 },
    { x: 594, y: 314 },
    { x: 608, y: 480 },
    { x: 790, y: 520 },
    { x: 838, y: 638 },
    { x: 516, y: 638 },
    { x: 150, y: 552 },
  ],
  "06": [
    { x: 166, y: 542 },
    { x: 222, y: 250 },
    { x: 430, y: 128 },
    { x: 720, y: 156 },
    { x: 850, y: 306 },
    { x: 770, y: 492 },
    { x: 552, y: 544 },
    { x: 430, y: 414 },
    { x: 540, y: 286 },
    { x: 694, y: 346 },
    { x: 616, y: 470 },
    { x: 360, y: 604 },
    { x: 166, y: 542 },
  ],
};

const ROAD_WIDTHS: Record<string, number> = {
  "01": 138,
  "02": 128,
  "03": 150,
  "04": 146,
  "05": 126,
  "06": 140,
};

const CHIP_SIZES: Record<string, number> = {
  "01": 48,
  "02": 44,
  "03": 52,
  "04": 50,
  "05": 46,
  "06": 48,
};

const tracks = new Map<string, ChipTrackSpec>();

export function chipTrackForCourse(courseId: string): ChipTrackSpec {
  const normalizedId = COURSE_POINTS[courseId] ? courseId : "01";
  const cached = tracks.get(normalizedId);
  if (cached) return cached;

  const points = COURSE_POINTS[normalizedId];
  const samples = buildSamples(points, 18);
  const path = buildPath(points);
  const first = points[0];
  const second = points[1];
  const track: ChipTrackSpec = {
    courseId: normalizedId,
    designWidth: DESIGN_WIDTH,
    designHeight: DESIGN_HEIGHT,
    roadWidth: ROAD_WIDTHS[normalizedId],
    chipSize: CHIP_SIZES[normalizedId],
    chipSpacing: CHIP_SIZES[normalizedId] * 1.65,
    points,
    samples,
    path,
    start: {
      x: first.x,
      y: first.y,
      angle: Math.atan2(second.y - first.y, second.x - first.x),
    },
    decorSeed: Number(normalizedId),
  };
  tracks.set(normalizedId, track);
  return track;
}

export function nearestChipProgress(track: ChipTrackSpec, x: number, y: number): number {
  let bestIndex = 0;
  let bestDistance = Infinity;

  for (let i = 0; i < track.samples.length; i += 1) {
    const sample = track.samples[i];
    const distance = (sample.x - x) ** 2 + (sample.y - y) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }

  return track.samples[bestIndex].distance / track.samples.total;
}

export function chipRespawnPose(track: ChipTrackSpec): ChipStartPose {
  return track.start;
}

export function buildPath(points: ChipPoint[]): Path2D {
  const path = new Path2D();
  path.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => path.lineTo(point.x, point.y));
  return path;
}

function buildSamples(points: ChipPoint[], stepsPerSegment: number): ChipTrackSamples {
  const result = Object.assign([] as ChipTrackSample[], { total: 0 });
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
