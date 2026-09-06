import type { Racer, Input } from '../game/types';
export interface Member {
  id: string;
  name: string;
  color: number;
  slot: number;
  active: boolean;
  ready: boolean;
  score: number;
  seq: number;
  ticks: number;
  racer: Racer | null;
}
export interface Standing {
  playerId: string;
  name: string;
  rank: number;
  points: number;
  outcome: 'finish' | 'last' | 'dnf';
}
export interface Room {
  code: string;
  version: number;
  hostId: string;
  mode: 'free' | 'grand-prix';
  course: number;
  phase: 'lobby' | 'racing' | 'results' | 'complete';
  players: Member[];
  raceId: string;
  startAt: number;
  serverTime: number;
  round: number;
  standings: Standing[];
  history: Standing[][];
}
export interface Credentials {
  code: string;
  playerId: string;
  token: string;
}
export interface Response {
  room: Room;
  credentials: Credentials | null;
}
export interface Frame {
  input: Pick<Input, 'steer' | 'push' | 'assist'>;
  ticks: number;
}
