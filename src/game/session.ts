import { createRacer, cpuInput, reset, STEP, tick } from './physics';
import type { Input, Options, Phase, Racer, RaceEvent, Track } from './types';
export class Session {
  phase: Phase = 'menu';
  racers: Racer[] = [];
  time = 0;
  countdown = 3;
  remaining = 1.2;
  timeout = false;
  private accumulator = 0;
  private beforePause: 'countdown' | 'racing' = 'countdown';
  constructor(
    public track: Track,
    public options: Options,
  ) {}
  start(): void {
    this.racers = Array.from(
      { length: this.options.mode === 'practice' ? 1 : 4 },
      (_, id) =>
        createRacer(this.track, id, (this.options.color + id) % 4, id > 0),
    );
    this.time = 0;
    this.countdown = 3;
    this.remaining = 1.2;
    this.timeout = false;
    this.accumulator = 0;
    this.phase = 'countdown';
  }
  pause(): void {
    if (this.phase === 'countdown' || this.phase === 'racing') {
      this.beforePause = this.phase;
      this.phase = 'paused';
      this.accumulator = 0;
    }
  }
  resume(): void {
    if (this.phase === 'paused') {
      this.phase = this.beforePause;
      this.accumulator = 0;
    }
  }
  returnToStart(): void {
    if (this.phase === 'racing' && this.racers[0])
      reset(this.track, this.racers[0]);
  }
  update(delta: number, input: Input): RaceEvent[] {
    const events: RaceEvent[] = [];
    if (
      this.phase === 'paused' ||
      this.phase === 'menu' ||
      this.phase === 'finished'
    )
      return events;
    this.accumulator += Math.max(0, Math.min(delta, 0.25));
    while (this.accumulator + 1e-10 >= STEP) {
      this.accumulator -= STEP;
      if (this.phase === 'countdown') {
        this.countdown -= STEP;
        if (this.countdown <= 0) this.phase = 'racing';
        continue;
      }
      if (this.phase === 'finishing') {
        this.remaining -= STEP;
        if (this.remaining <= 0) {
          this.phase = 'finished';
          this.accumulator = 0;
          break;
        }
        continue;
      }
      this.time += STEP;
      let finished = false;
      for (const r of this.racers) {
        const e = tick(
          this.track,
          r,
          r.cpu ? cpuInput(this.track, r, this.options.difficulty) : input,
          STEP,
          this.time,
        );
        if (e) {
          events.push(e);
          if (e.type === 'finish') finished = true;
        }
      }
      if (
        finished ||
        (this.time >= (this.track.timeLimit ?? 180) &&
          this.options.mode === 'race')
      ) {
        this.phase = 'finishing';
        this.timeout = !finished;
      }
    }
    return events;
  }
  order(): Racer[] {
    return [...this.racers].sort((a, b) =>
      a.finish !== null && b.finish !== null
        ? a.finish - b.finish
        : a.finish !== null
          ? -1
          : b.finish !== null
            ? 1
            : b.progress - a.progress || a.id - b.id,
    );
  }
}
