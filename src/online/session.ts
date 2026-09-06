import { Session } from '../game/session';
import { STEP, tick } from '../game/physics';
import type { Input, RaceEvent, Racer } from '../game/types';
import { TRACKS } from '../game/tracks';
import type { Client } from './client';
import type { Frame, Room } from './protocol';
export class OnlineSession extends Session {
  private queued: Frame[] = [];
  private inFlight: { seq: number; frames: Frame[] } | null = null;
  private elapsed = 0;
  private sendElapsed = 0;
  private offset = 0;
  private sending = false;
  private self: string;
  room: Room;
  constructor(
    private client: Client,
    room: Room,
  ) {
    super(TRACKS[room.course]!, {
      mode: 'race',
      color: 0,
      assist: true,
      difficulty: 'normal',
    });
    this.self = client.credentials!.playerId;
    this.room = room;
    this.accept(room);
  }
  accept(room: Room): void {
    if (room.raceId !== this.room.raceId) return;
    this.room = room;
    this.offset = room.serverTime - Date.now();
    const mine = room.players.find((p) => p.id === this.self);
    if (!mine) return;
    this.options.color = mine.color;
    const members = [mine, ...room.players.filter((p) => p.id !== this.self)];
    this.racers = members.flatMap((p) =>
      p.racer ? [structuredClone(p.racer)] : [],
    );
    const r = this.racers[0];
    let ticks = mine.ticks;
    const replay = [
      ...(this.inFlight && this.inFlight.seq > mine.seq
        ? this.inFlight.frames
        : []),
      ...this.queued,
    ];
    if (r)
      for (const f of replay)
        for (let i = 0; i < f.ticks; i++)
          tick(this.track, r, f.input, STEP, ++ticks * STEP);
    this.phase =
      room.phase === 'racing'
        ? Date.now() + this.offset < room.startAt
          ? 'countdown'
          : 'racing'
        : 'finished';
  }
  override pause(): void {}
  override returnToStart(): void {}
  override update(delta: number, input: Input): RaceEvent[] {
    if (this.phase === 'finished') return [];
    this.countdown = Math.max(
      0,
      (this.room.startAt - Date.now() - this.offset) / 1000,
    );
    if (this.countdown > 0) {
      this.phase = 'countdown';
      return [];
    }
    this.phase = 'racing';
    this.time = Math.max(
      0,
      (Date.now() + this.offset - this.room.startAt) / 1000,
    );
    const r = this.racers[0];
    if (!r) return [];
    const events: RaceEvent[] = [];
    this.elapsed += Math.min(delta, 0.25);
    this.sendElapsed += delta;
    const member = this.room.players.find((p) => p.id === this.self)!;
    let count =
      this.queued.reduce((n, f) => n + f.ticks, 0) +
      (this.inFlight && this.inFlight.seq > member.seq
        ? this.inFlight.frames.reduce((n, f) => n + f.ticks, 0)
        : 0);
    while (
      this.elapsed >= STEP &&
      count < 120 &&
      r.finish === null &&
      !this.room.standings.some((s) => s.playerId === this.self)
    ) {
      this.elapsed -= STEP;
      count++;
      const value = {
        steer: input.steer,
        push: input.push,
        assist: input.assist,
      };
      const last = this.queued.at(-1);
      if (
        last &&
        last.input.steer === value.steer &&
        last.input.push === value.push &&
        last.input.assist === value.assist
      )
        last.ticks++;
      else this.queued.push({ input: value, ticks: 1 });
      const e = tick(this.track, r, value, STEP, (member.ticks + count) * STEP);
      if (e) events.push(e);
    }
    if (count >= 120) this.elapsed = 0;
    if (
      this.sendElapsed >= 0.2 &&
      !this.sending &&
      (this.inFlight || this.queued.length)
    ) {
      this.sendElapsed = 0;
      this.sending = true;
      if (!this.inFlight) {
        this.inFlight = { seq: member.seq + 1, frames: this.queued };
        this.queued = [];
      }
      const packet = this.inFlight;
      void this.client
        .command({ type: 'input', raceId: this.room.raceId, ...packet })
        .then(() => {
          if (this.inFlight === packet) this.inFlight = null;
        })
        .catch((e) => this.client.status(String(e)))
        .finally(() => {
          this.sending = false;
        });
    }
    return events;
  }
  override order(): Racer[] {
    return [...this.racers].sort((a, b) => {
      const pa = this.room.players.find((p) => p.slot === a.id),
        pb = this.room.players.find((p) => p.slot === b.id);
      const ra = this.room.standings.find((s) => s.playerId === pa?.id)?.rank,
        rb = this.room.standings.find((s) => s.playerId === pb?.id)?.rank;
      return (
        (ra ??
          0.5 +
            this.room.standings.filter((s) => s.outcome === 'finish').length) -
          (rb ??
            0.5 +
              this.room.standings.filter((s) => s.outcome === 'finish')
                .length) || b.progress - a.progress
      );
    });
  }
}
