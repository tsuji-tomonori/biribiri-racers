export class Sound {
  enabled = true;
  private context: AudioContext | null = null;
  private engine: OscillatorNode | null = null;
  private gain: GainNode | null = null;
  unlock(): void {
    if (!this.enabled) return;
    try {
      if (!this.context) {
        const a = new AudioContext(),
          o = a.createOscillator(),
          g = a.createGain(),
          f = a.createBiquadFilter();
        o.type = 'sawtooth';
        f.type = 'lowpass';
        f.frequency.value = 220;
        g.gain.value = 0;
        o.connect(f).connect(g).connect(a.destination);
        o.start();
        this.context = a;
        this.engine = o;
        this.gain = g;
      }
      void this.context.resume().catch(() => undefined);
    } catch {
      this.enabled = false;
    }
  }
  update(speed: number, active: boolean): void {
    if (!this.context || !this.engine || !this.gain) return;
    this.gain.gain.setTargetAtTime(
      active && this.enabled ? 0.024 : 0,
      this.context.currentTime,
      0.1,
    );
    this.engine.frequency.setTargetAtTime(
      44 + speed * 0.27,
      this.context.currentTime,
      0.1,
    );
  }
  effect(kind: 'boost' | 'collision' | 'finish'): void {
    const a = this.context;
    if (!a || !this.enabled) return;
    const freqs =
      kind === 'finish' ? [261.63, 329.63, 392] : [kind === 'boost' ? 160 : 75];
    for (const freq of freqs) {
      const o = a.createOscillator(),
        g = a.createGain();
      o.type = 'triangle';
      o.frequency.value = freq;
      o.frequency.exponentialRampToValueAtTime(
        kind === 'boost' ? freq * 2 : freq,
        a.currentTime + 0.25,
      );
      g.gain.setValueAtTime(0.025, a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.6);
      o.connect(g).connect(a.destination);
      o.start();
      o.stop(a.currentTime + 0.65);
    }
  }
}
