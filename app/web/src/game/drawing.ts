import type { Course, RaceState } from "../types";
import { kartSprites, type KartSpriteKey } from "../data/assets";
import { loadedImage, type ImageCache } from "./imageCache";
import { drawChipMiniMap, drawChipTrack, isPointOnChipRoad } from "./chips/chipRenderer";
import { chipRespawnPose, chipTrackForCourse } from "./chips/chipTrack";

export interface DrawingCaches {
  trackImages: ImageCache;
  kartImages: ImageCache;
}

export function drawTrack(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  course: Course,
  caches: DrawingCaches,
  race: RaceState | null,
  preview: boolean,
): void {
  ctx.clearRect(0, 0, width, height);
  const board = course.boardAsset ? loadedImage(caches.trackImages, course.boardAsset) : null;

  if (board) {
    drawImageContain(ctx, board, width, height);
  } else {
    drawChipTrack(ctx, width, height, course, { preview, assets: caches.trackImages });
  }

  if (race) {
    drawCar(ctx, caches.kartImages, race.x, race.y, race.angle, performance.now() < race.invulnerableUntil, performance.now() < race.boostPulseUntil);
    return;
  }

  const track = chipTrackForCourse(course.id);
  const start = chipRespawnPose(track);
  drawCar(ctx, caches.kartImages, start.x, start.y, start.angle, false, false);
  const sampleA = track.samples[Math.floor(track.samples.length * 0.32)];
  const sampleB = track.samples[Math.floor(track.samples.length * 0.64)];
  drawCar(ctx, caches.kartImages, sampleA.x, sampleA.y, start.angle + 0.7, false, true, "#ff3f8e");
  drawCar(ctx, caches.kartImages, sampleB.x, sampleB.y, start.angle - 0.4, false, true, "#20c987");
}

export function drawMiniMap(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  sourceWidth: number,
  sourceHeight: number,
  course: Course,
  caches: DrawingCaches,
  race: RaceState,
): void {
  drawChipMiniMap(ctx, width, height, course, caches.trackImages);
  drawMiniMapMarker(ctx, width / sourceWidth, height / sourceHeight, race);
}

export function isOnRoad(ctx: CanvasRenderingContext2D, course: Course, x: number, y: number): boolean {
  return isPointOnChipRoad(ctx, course, x, y);
}

function drawImageContain(ctx: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number): void {
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const x = (width - drawWidth) / 2;
  const y = (height - drawHeight) / 2;
  ctx.drawImage(image, x, y, drawWidth, drawHeight);
}

function drawMiniMapMarker(ctx: CanvasRenderingContext2D, scaleX: number, scaleY: number, race: RaceState): void {
  ctx.save();
  ctx.scale(scaleX, scaleY);
  ctx.fillStyle = "#ff3f8e";
  ctx.beginPath();
  ctx.arc(race.x, race.y, 25, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 7;
  ctx.stroke();
  ctx.restore();
}

function drawCar(
  ctx: CanvasRenderingContext2D,
  kartImages: ImageCache,
  x: number,
  y: number,
  angle: number,
  ghost: boolean,
  boost: boolean,
  color = "#168bff",
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + Math.PI / 2);
  ctx.globalAlpha = ghost ? 0.55 : 1;
  const sprite = loadedImage(kartImages, spriteKeyForColor(color, boost, ghost));

  if (sprite) {
    const size = boost ? 92 : 78;
    if (boost) {
      const trail = loadedImage(kartImages, "blueBoost");
      if (trail && sprite.src !== trail.src) {
        ctx.save();
        ctx.globalAlpha = 0.38;
        ctx.drawImage(trail, -size * 0.55, -size * 0.26, size * 1.1, size * 1.1);
        ctx.restore();
      }
    }
    ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
    ctx.restore();
    return;
  }

  if (boost) {
    ctx.fillStyle = "rgba(255, 209, 67, 0.55)";
    ctx.beginPath();
    ctx.moveTo(0, 35);
    ctx.lineTo(-22, 82);
    ctx.lineTo(0, 64);
    ctx.lineTo(22, 82);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = "#22375f";
  roundRect(ctx, -34, -28, 68, 70, 24);
  ctx.fill();
  ctx.fillStyle = color;
  roundRect(ctx, -28, -34, 56, 66, 24);
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.fillStyle = "#dff8ff";
  roundRect(ctx, -17, -24, 34, 26, 14);
  ctx.fill();
  ctx.fillStyle = "#ffe55c";
  ctx.beginPath();
  ctx.arc(-16, -34, 5, 0, Math.PI * 2);
  ctx.arc(16, -34, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function spriteKeyForColor(color: string, boost: boolean, ghost: boolean): KartSpriteKey {
  if (ghost) return "blueDamage";
  if (color === "#ff3f8e") return boost ? "pinkBoost" : "pink";
  if (color === "#20c987") return boost ? "greenBoost" : "green";
  if (color === "#ffbf22") return boost ? "yellowBoost" : "yellow";
  return boost ? "blueBoost" : "blue";
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

export { kartSprites };
