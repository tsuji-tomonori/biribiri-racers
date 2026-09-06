import { TRACKS } from '../src/game/tracks';
import { createRacer, STEP, tick } from '../src/game/physics';
const cases = TRACKS.flatMap((track) =>
  [0, 9].map((slot) => {
    const racer = createRacer(track, slot, slot % 4, false);
    const input = { steer: 0.1, push: false, assist: true };
    const snapshots = [];
    for (let i = 1; i <= 1200; i++) {
      input.push = i % 180 < 50;
      input.steer = Math.sin(i / 150) * 0.4;
      tick(track, racer, input, STEP, i * STEP);
      if (i % 60 === 0) snapshots.push(structuredClone(racer));
    }
    return { course: track.id, slot, snapshots };
  }),
);
console.log(JSON.stringify(cases));
