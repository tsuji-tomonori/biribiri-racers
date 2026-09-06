import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { TRACKS } from '../src/game/tracks';
import { MACHINES } from '../src/game/machines';
const path = 'backend/src/app/data/game.gen.json';
const body = JSON.stringify({ tracks: TRACKS, machines: MACHINES }) + '\n';
if (process.argv.includes('--check')) {
  if (readFileSync(path, 'utf8') !== body) throw new Error('Game data drift');
} else {
  mkdirSync('backend/src/app/data', { recursive: true });
  writeFileSync(path, body);
}
