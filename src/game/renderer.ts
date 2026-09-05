import { SPIN_SECONDS } from './gimmicks';
import { at, clamp } from './geometry';
import { COLORS } from './physics';
import type { Assets } from './assets';
import type { RaceEvent, Racer } from './types';
import type { Session } from './session';
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}
interface Trail {
  x: number;
  y: number;
}
export class Renderer {
  overview = false;
  private ctx: CanvasRenderingContext2D;
  private mini: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private cam = { x: 627, y: 627, zoom: 0.6 };
  private particles: Particle[] = [];
  private trails = new Map<number, Trail[]>();
  private reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  constructor(
    private canvas: HTMLCanvasElement,
    minimap: HTMLCanvasElement,
    private assets: Assets,
  ) {
    const ctx = canvas.getContext('2d', { alpha: false }),
      mini = minimap.getContext('2d');
    if (!ctx || !mini)
      throw new Error('このブラウザーはCanvasに対応していません');
    this.ctx = ctx;
    this.mini = mini;
  }
  reset(s: Session): void {
    this.particles = [];
    this.trails.clear();
    this.overview = false;
    this.cam = {
      x: s.racers[0]!.x,
      y: s.racers[0]!.y - 100,
      zoom: Math.min(innerWidth / 1000, innerHeight / 840),
    };
  }
  event(e: RaceEvent, s: Session): void {
    const r = s.racers[e.racer]!;
    if (e.type === 'collision') this.trails.delete(r.id);
    if (this.reduced) return;
    for (let i = 0; i < (e.type === 'finish' ? 60 : 18); i++) {
      const a = Math.random() * Math.PI * 2,
        v = 60 + Math.random() * 180;
      this.particles.push({
        x: e.type === 'collision' ? e.x : r.x,
        y: e.type === 'collision' ? e.y : r.y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 0.7,
        color: e.type === 'finish' ? '#ffe556' : COLORS[r.color]!,
      });
    }
  }
  draw(s: Session, dt: number): void {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    if (rect.width !== this.w || rect.height !== this.h) {
      this.w = rect.width;
      this.h = rect.height;
      this.dpr = Math.min(devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(this.w * this.dpr);
      this.canvas.height = Math.round(this.h * this.dpr);
    }
    const w = this.w,
      h = this.h,
      player = s.racers[0];
    if (!player) return;
    const size = s.track.worldSize ?? 1254,
      center = size / 2;
    let z: number, tx: number, ty: number;
    if (this.overview) {
      z = Math.min(w / (size + 66), h / (size + 176));
      tx = center;
      ty = center + 23;
    } else {
      z = Math.min(w < 650 ? w / 550 : w / 1050, h / 850);
      if (player.boost > 0 && !this.reduced) z *= 0.94;
      const halfW = w / (2 * z),
        halfH = h / (2 * z);
      tx = clamp(
        player.x + Math.cos(player.heading) * 110,
        Math.min(halfW, center),
        Math.max(size - halfW, center),
      );
      ty = clamp(
        player.y + Math.sin(player.heading) * 110,
        Math.min(halfH, center),
        Math.max(size - halfH, center),
      );
    }
    const smooth = 1 - Math.exp(-dt * 6);
    this.cam.x += (tx - this.cam.x) * smooth;
    this.cam.y += (ty - this.cam.y) * smooth;
    this.cam.zoom += (z - this.cam.zoom) * smooth;
    const c = this.ctx,
      t = s.track;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.fillStyle = t.id === 1 ? '#092968' : t.id === 4 ? '#56a244' : '#198eef';
    c.fillRect(0, 0, w, h);
    c.save();
    const jolt =
      !this.reduced && player.shock > 0 ? Math.sin(player.shock * 160) * 4 : 0;
    c.translate(w / 2 + jolt, h / 2);
    c.scale(this.cam.zoom, this.cam.zoom);
    c.translate(-this.cam.x, -this.cam.y);
    c.drawImage(this.assets.courses[t.id]!, 0, 0, size, size);
    c.lineCap = 'round';
    for (let a = 110; a < t.length - 100; a += 150) {
      const p = at(t, a);
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.angle);
      c.strokeStyle = '#ffffffb0';
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(-7, -7);
      c.lineTo(1, 0);
      c.lineTo(-7, 7);
      c.moveTo(2, -7);
      c.lineTo(10, 0);
      c.lineTo(2, 7);
      c.stroke();
      c.restore();
    }
    c.strokeStyle = '#fff7af';
    c.lineWidth = 5;
    c.shadowColor = '#fff';
    c.shadowBlur = 12;
    c.beginPath();
    c.moveTo(...t.finish.a);
    c.lineTo(...t.finish.b);
    c.stroke();
    c.shadowBlur = 0;
    for (const r of s.racers) {
      const trail = this.trails.get(r.id) ?? [];
      if (dt > 0 && s.phase === 'racing' && !r.respawn && !r.shock) {
        trail.push({ x: r.x, y: r.y });
        if (trail.length > 20) trail.shift();
      }
      this.trails.set(r.id, trail);
      if (trail.length > 1) {
        c.beginPath();
        trail.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
        c.strokeStyle = COLORS[r.color]! + (r.boost ? 'b0' : '45');
        c.lineWidth = r.boost ? 9 : 5;
        c.stroke();
      }
    }
    s.racers.forEach((r) => this.racer(r));
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      c.globalAlpha = clamp(p.life / 0.7, 0, 1);
      c.fillStyle = p.color;
      c.fillRect(p.x, p.y, 5, 5);
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    c.globalAlpha = 1;
    c.restore();
    const m = this.mini;
    m.clearRect(0, 0, 180, 180);
    m.drawImage(this.assets.courses[t.id]!, 0, 0, 180, 180);
    m.save();
    m.scale(180 / size, 180 / size);
    m.restore();
    m.strokeStyle = '#e8ff59';
    m.lineWidth = 3;
    m.beginPath();
    m.moveTo((t.finish.a[0] * 180) / size, (t.finish.a[1] * 180) / size);
    m.lineTo((t.finish.b[0] * 180) / size, (t.finish.b[1] * 180) / size);
    m.stroke();
    for (const r of s.racers) {
      m.beginPath();
      m.arc(
        (r.x / size) * 180,
        (r.y / size) * 180,
        r.id === 0 ? 5 : 3.5,
        0,
        Math.PI * 2,
      );
      m.fillStyle = COLORS[r.color]!;
      m.fill();
      m.strokeStyle = 'white';
      m.lineWidth = 2;
      m.stroke();
    }
  }
  private racer(r: Racer): void {
    if (r.respawn > 0 && Math.floor(r.respawn * 12) % 2 === 0) return;
    const c = this.ctx,
      color = COLORS[r.color]!,
      size = this.assets.racers.width / 2;
    c.save();
    c.translate(r.x, r.y);
    c.fillStyle = '#003a7750';
    c.beginPath();
    c.ellipse(0, 10, 18, 11, 0, 0, Math.PI * 2);
    c.fill();
    if (r.shock > 0) {
      c.strokeStyle = '#142c55';
      c.lineWidth = 8;
      c.beginPath();
      for (let i = 0; i <= 24; i++) {
        const a = (i * Math.PI) / 12,
          radius =
            i % 2
              ? 29
              : 43 + (this.reduced ? 0 : Math.sin(r.shock * 90 + i) * 5);
        const x = Math.cos(a) * radius,
          y = Math.sin(a) * radius;
        if (i === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();
      c.strokeStyle = '#f5ff68';
      c.lineWidth = 4;
      c.stroke();
      c.fillStyle = '#ffffffc0';
      c.beginPath();
      c.arc(0, 0, 24, 0, Math.PI * 2);
      c.fill();
    }
    c.rotate(
      r.heading +
        Math.PI / 2 +
        (!this.reduced && r.spin > 0
          ? (1 - r.spin / SPIN_SECONDS) * Math.PI * 2
          : 0),
    );
    if (r.boost > 0 || r.charge > 0.1) {
      c.strokeStyle = r.boost ? color : '#ffe656';
      c.lineWidth = 3;
      c.beginPath();
      c.ellipse(0, 3, 23, 29, 0, 0, Math.PI * 2);
      c.stroke();
    }
    c.drawImage(
      this.assets.racers,
      (r.color % 2) * size,
      Math.floor(r.color / 2) * size,
      size,
      size,
      -22.5,
      -28,
      45,
      56,
    );
    c.restore();
    // CPU names already appear in the standings; avoid overlapping start labels.
    if (r.cpu) return;
    c.save();
    c.translate(r.x, r.y - 46);
    c.scale(1 / this.cam.zoom, 1 / this.cam.zoom);
    c.font = '800 12px system-ui';
    const label =
        r.spin > 0
          ? 'SPIN!'
          : r.wind
            ? 'WIND!'
            : r.floorBoost > 0
              ? 'DASH!'
              : '▼ YOU',
      width = c.measureText(label).width + 16;
    c.fillStyle = r.cpu ? '#fffffff2' : color;
    c.beginPath();
    c.roundRect(-width / 2, -14, width, 23, 7);
    c.fill();
    c.fillStyle = r.cpu ? '#14346a' : 'white';
    c.textAlign = 'center';
    c.fillText(label, 0, 2);
    c.restore();
  }
}
