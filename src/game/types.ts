export type Vec = readonly [number, number];
export interface Point {
  x: number;
  y: number;
}
export interface PathPoint extends Point {
  s: number;
  width?: number;
  angle: number;
}
export interface Finish {
  a: Vec;
  b: Vec;
  normal: Vec;
}
export interface TrackDefinition {
  worldSize?: number;
  timeLimit?: number;
  theme?: 'sky' | 'jungle' | 'factory';
  tip?: string;
  gimmicks?: readonly Gimmick[];
  name: string;
  level: string;
  tint: string;
  speed: number;
  grip: number;
  wallRise: number;
  lapAnchor: Vec;
  points: readonly Vec[];
  outer: readonly Vec[];
  holes: readonly (readonly Vec[])[];
  finish: Finish;
  checkpoints: readonly Omit<PathPoint, 's'>[];
}
export interface Gimmick extends Point {
  kind: 'wind' | 'spin' | 'dash';
  angle: number;
  radius: number;
}
export interface Track extends TrackDefinition {
  id: number;
  path: readonly PathPoint[];
  length: number;
  gates: readonly PathPoint[];
}
export interface Racer extends Point {
  spin: number;
  floorBoost: number;
  wind: boolean;
  activeGimmicks: number[];
  id: number;
  color: number;
  cpu: boolean;
  name: string;
  heading: number;
  vx: number;
  vy: number;
  speed: number;
  charge: number;
  boost: number;
  pushing: boolean;
  gate: number;
  progress: number;
  hits: number;
  respawn: number;
  shock: number;
  finish: number | null;
  dashCount: number;
  travel: number;
  winding: number;
}
export interface Input {
  steer: number;
  push: boolean;
  assist: boolean;
  throttle?: number;
}
export type RaceEvent =
  | { type: 'gimmick'; kind: Gimmick['kind']; racer: number }
  | { type: 'collision'; racer: number; x: number; y: number }
  | { type: 'boost' | 'finish'; racer: number };
export type Phase =
  'menu' | 'countdown' | 'racing' | 'paused' | 'finishing' | 'finished';
export type Mode = 'race' | 'practice';
export interface Options {
  mode: Mode;
  color: number;
  assist: boolean;
  difficulty: 'easy' | 'normal';
}
