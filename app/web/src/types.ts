import type { RefObject } from "react";

export type ScreenName = "menu" | "room" | "join" | "map" | "ready" | "game" | "result";

export type Visibility = "public" | "private";

export interface ThemeAssets {
  badge: string;
  panorama: string;
  floor: string;
  border: string;
}

export interface CourseRecord {
  bestTimeMs?: number;
  bestPlayerName?: string;
}

export interface Course {
  id: string;
  key: string;
  name: string;
  aliases: string[];
  theme: string;
  difficultyStars: number;
  recommendedLaps: number;
  expectedTimeSec?: number;
  description: string;
  detail: string;
  tags: string[];
  palette: string[];
  previewAsset: string;
  mapAsset: string;
  boardAsset?: string;
  themeAssets: ThemeAssets | null;
  partAssets: string[];
  implementationStatus?: "thumbnail_only";
  records: CourseRecord;
}

export interface RaceResult {
  courseId: string;
  time: number;
  crashes: number;
  playerName: string;
  courseName: string;
}

export interface AppState {
  screen: ScreenName;
  playerName: string;
  roomName: string;
  maxPlayers: number;
  visibility: Visibility;
  laps: number;
  boostEnabled: boolean;
  courseId: string;
  lastResult: RaceResult | null;
}

export interface RaceState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  running: boolean;
  startedAt: number;
  lastFrame: number;
  lap: number;
  completedLaps: number;
  crashes: number;
  progress: number;
  lastProgress: number;
  invulnerableUntil: number;
  boostCooldownUntil: number;
  boostPulseUntil: number;
  toastUntil: number;
  toastMessage: string;
}

export interface RaceHud {
  time: string;
  lap: string;
  crashes: string;
  boostStatus: string;
  rankScore: string;
  toastMessage: string;
  toastVisible: boolean;
}

export interface RaceRefs {
  readyCanvasRef: RefObject<HTMLCanvasElement | null>;
  gameCanvasRef: RefObject<HTMLCanvasElement | null>;
  minimapCanvasRef: RefObject<HTMLCanvasElement | null>;
}
