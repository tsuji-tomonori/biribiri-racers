import { compile } from './geometry';
import type { Gimmick, Track, TrackDefinition, Vec } from './types';

// Rounded, non-intersecting loops. Both walls and artwork use these offsets.
function rounded(corners: readonly Vec[], radius: number): Vec[] {
  const result: Vec[] = [];
  for (let i = 0; i < corners.length; i++) {
    const a = corners[(i + corners.length - 1) % corners.length]!,
      b = corners[i]!,
      c = corners[(i + 1) % corners.length]!;
    const ab = Math.hypot(a[0] - b[0], a[1] - b[1]),
      bc = Math.hypot(c[0] - b[0], c[1] - b[1]);
    const r = Math.min(radius, ab / 3, bc / 3);
    const start: Vec = [
      b[0] + ((a[0] - b[0]) / ab) * r,
      b[1] + ((a[1] - b[1]) / ab) * r,
    ];
    const end: Vec = [
      b[0] + ((c[0] - b[0]) / bc) * r,
      b[1] + ((c[1] - b[1]) / bc) * r,
    ];
    for (let j = 0; j <= 12; j++) {
      const u = j / 12;
      result.push([
        (1 - u) ** 2 * start[0] + 2 * u * (1 - u) * b[0] + u * u * end[0],
        (1 - u) ** 2 * start[1] + 2 * u * (1 - u) * b[1] + u * u * end[1],
      ]);
    }
  }
  return result;
}
function make(
  id: number,
  name: string,
  level: string,
  theme: NonNullable<TrackDefinition['theme']>,
  size: number,
  corners: readonly Vec[],
  width: number,
  gimmicks: readonly Gimmick[],
  tip: string,
): Track {
  const ring = rounded(corners, 190);
  // Start on the straight left edge; the loop is clockwise in screen coordinates.
  const anchors: Vec[] = [[300, 1000], ...ring, [300, 1000], [300, 760]];
  // Uniform spacing avoids Catmull–Rom overshoot where a long straight meets a short arc.
  const points: Vec[] = [];
  anchors.slice(0, -1).forEach((a, i) => {
    const b = anchors[i + 1]!,
      count = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 20);
    for (let j = 0; j < count; j++)
      points.push([
        a[0] + ((b[0] - a[0]) * j) / count,
        a[1] + ((b[1] - a[1]) * j) / count,
      ]);
  });
  points.push(anchors.at(-1)!);
  const offset = (side: number): Vec[] =>
    ring.map((p, i) => {
      const prev = ring[(i + ring.length - 1) % ring.length]!,
        next = ring[(i + 1) % ring.length]!;
      const angle = Math.atan2(next[1] - prev[1], next[0] - prev[0]);
      return [
        p[0] - ((Math.sin(angle) * width) / 2) * side,
        p[1] + ((Math.cos(angle) * width) / 2) * side,
      ];
    });
  const checkpoints = [0.08, 0.22, 0.36, 0.5, 0.64, 0.78, 0.92].map((f) => {
    const index = Math.floor((ring.length - 1) * f),
      p = ring[index]!,
      q = ring[index + 1]!;
    return {
      x: p[0],
      y: p[1],
      angle: Math.atan2(q[1] - p[1], q[0] - p[0]),
      width: width / 2,
    };
  });
  return compile(
    {
      name,
      level,
      theme,
      worldSize: size,
      timeLimit: 300,
      tint: { sky: '#49cfff', jungle: '#60d871', factory: '#b98aff' }[theme],
      speed: 195,
      grip: 8,
      wallRise: 0,
      lapAnchor: [550, 1200],
      points,
      outer: offset(-1),
      holes: [offset(1)],
      checkpoints,
      finish: {
        a: [300 - width / 2, 850],
        b: [300 + width / 2, 850],
        normal: [0, -1],
      },
      gimmicks,
      tip,
    },
    id,
  );
}
export const ADVANCED_TRACKS: Track[] = [
  make(
    5,
    'スカイストーム',
    '中級 · 向かい風とロングヘアピン',
    'sky',
    2800,
    [
      [300, 300],
      [2400, 300],
      [2400, 800],
      [1000, 800],
      [1000, 1300],
      [2200, 1300],
      [2200, 2450],
      [300, 2450],
    ],
    240,
    [
      { kind: 'wind', x: 1300, y: 300, angle: Math.PI, radius: 95 },
      { kind: 'wind', x: 1850, y: 800, angle: 0, radius: 95 },
      { kind: 'wind', x: 1550, y: 1300, angle: Math.PI, radius: 95 },
      { kind: 'dash', x: 1700, y: 2450, angle: Math.PI, radius: 65 },
    ],
    '水色の矢印は風向き。向かい風では減速しすぎず、折り返しの手前でPUSH。',
  ),
  make(
    6,
    'バナナジャングル',
    '上級 · 連続つづら折りとスピン',
    'jungle',
    3200,
    [
      [300, 300],
      [2800, 300],
      [2800, 850],
      [1000, 850],
      [1000, 1400],
      [2600, 1400],
      [2600, 1950],
      [1000, 1950],
      [1000, 2500],
      [2800, 2500],
      [2800, 2900],
      [300, 2900],
    ],
    220,
    [
      { kind: 'spin', x: 1450, y: 300, angle: 0, radius: 35 },
      { kind: 'spin', x: 1900, y: 850, angle: Math.PI, radius: 35 },
      { kind: 'spin', x: 1450, y: 1400, angle: 0, radius: 35 },
      { kind: 'spin', x: 1750, y: 1950, angle: Math.PI, radius: 35 },
      { kind: 'dash', x: 2000, y: 2900, angle: Math.PI, radius: 60 },
    ],
    '黄色いバナナで一回転して失速。直線で横によけ、狭い連続カーブは早めにPUSH。',
  ),
  make(
    7,
    'ボルトファクトリー',
    '上級 · 加速床と複合ギミック',
    'factory',
    3200,
    [
      [300, 300],
      [1550, 300],
      [1550, 750],
      [2800, 750],
      [2800, 1350],
      [1050, 1350],
      [1050, 1950],
      [2800, 1950],
      [2800, 2850],
      [1850, 2850],
      [1850, 2450],
      [1050, 2450],
      [1050, 2850],
      [300, 2850],
    ],
    230,
    [
      { kind: 'dash', x: 850, y: 300, angle: 0, radius: 65 },
      { kind: 'wind', x: 2100, y: 750, angle: Math.PI, radius: 95 },
      { kind: 'spin', x: 2100, y: 1350, angle: Math.PI, radius: 35 },
      { kind: 'dash', x: 1550, y: 1950, angle: 0, radius: 65 },
      { kind: 'wind', x: 2800, y: 2350, angle: -Math.PI / 2, radius: 95 },
      { kind: 'spin', x: 1450, y: 2450, angle: Math.PI, radius: 35 },
    ],
    '緑の床で加速！ PUSHで加速を解除できる。風・バナナの先のカーブを見て進もう。',
  ),
];
