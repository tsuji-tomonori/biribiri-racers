import type { Course, RaceState } from "../types";
import { kartSprites, type KartSpriteKey } from "../data/assets";
import { loadedImage, type ImageCache } from "./imageCache";
import { buildTrackPath, trackPoints, trackSamples } from "./track";

const trackPath = buildTrackPath(trackPoints);

export interface DrawingCaches {
  courseImages: ImageCache;
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
  const image = loadedImage(caches.courseImages, course.id);

  if (image) {
    drawCourseImageBackground(ctx, width, height, image);
    drawReferenceCourseOverlay(ctx, width, height);
    if (race) {
      drawCar(ctx, caches.kartImages, race.x, race.y, race.angle, performance.now() < race.invulnerableUntil, performance.now() < race.boostPulseUntil);
    } else {
      drawCar(ctx, caches.kartImages, width * 0.18, height * 0.72, -Math.PI / 2, false, false);
      drawCar(ctx, caches.kartImages, width * 0.42, height * 0.42, -0.5, false, true, "#ff3f8e");
      drawCar(ctx, caches.kartImages, width * 0.66, height * 0.55, -0.3, false, true, "#20c987");
    }
    return;
  }

  drawBackground(ctx, width, height, preview);
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  drawMapDecor(ctx, width, height, preview);
  ctx.shadowBlur = 30;
  ctx.shadowColor = "#6af7ff";
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 192;
  ctx.stroke(trackPath);
  ctx.shadowBlur = 16;
  ctx.strokeStyle = "#7dc7ff";
  ctx.lineWidth = 178;
  ctx.stroke(trackPath);
  drawBoundaryBlocks(ctx);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#d7dde8";
  ctx.lineWidth = 138;
  ctx.stroke(trackPath);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.62)";
  ctx.lineWidth = 8;
  ctx.setLineDash([32, 28]);
  ctx.stroke(trackPath);
  ctx.setLineDash([]);
  drawRoadTexture(ctx);
  drawFinishLine(ctx);
  drawObstacles(ctx);
  drawElectricity(ctx);
  drawArrowMarks(ctx);

  if (race) {
    drawCar(ctx, caches.kartImages, race.x, race.y, race.angle, performance.now() < race.invulnerableUntil, performance.now() < race.boostPulseUntil);
  } else {
    drawCar(ctx, caches.kartImages, 170, 555, -Math.PI / 2, false, false);
    drawCar(ctx, caches.kartImages, 330, 510, -0.5, false, true, "#ff3f8e");
    drawCar(ctx, caches.kartImages, 660, 370, -0.3, false, true, "#20c987");
  }

  ctx.restore();
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
  ctx.clearRect(0, 0, width, height);
  const image = loadedImage(caches.courseImages, course.id);

  if (image) {
    drawCourseImageBackground(ctx, width, height, image);
    ctx.fillStyle = "rgba(255,255,255,0.24)";
    ctx.fillRect(0, 0, width, height);
    drawMiniMapMarker(ctx, width / sourceWidth, height / sourceHeight, race);
    return;
  }

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#f7fdff");
  gradient.addColorStop(1, "#e4f4ff");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.scale(width / sourceWidth, height / sourceHeight);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 148;
  ctx.stroke(trackPath);
  ctx.strokeStyle = "#85c9ff";
  ctx.lineWidth = 126;
  ctx.stroke(trackPath);
  ctx.strokeStyle = "#d7dde8";
  ctx.lineWidth = 92;
  ctx.stroke(trackPath);
  ctx.strokeStyle = "#3b9cff";
  ctx.lineWidth = 16;
  ctx.setLineDash([78, 42]);
  ctx.stroke(trackPath);
  ctx.setLineDash([]);
  ctx.restore();
  drawMiniMapMarker(ctx, width / sourceWidth, height / sourceHeight, race);
}

export function isOnRoad(ctx: CanvasRenderingContext2D, x: number, y: number): boolean {
  ctx.save();
  ctx.lineWidth = 146;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const result = ctx.isPointInStroke(trackPath, x, y);
  ctx.restore();
  return result;
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

function drawCourseImageBackground(ctx: CanvasRenderingContext2D, width: number, height: number, image: HTMLImageElement): void {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const x = (width - drawWidth) / 2;
  const y = (height - drawHeight) / 2;
  ctx.drawImage(image, x, y, drawWidth, drawHeight);
}

function drawReferenceCourseOverlay(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.save();
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "rgba(255,255,255,0.18)");
  gradient.addColorStop(0.5, "rgba(255,255,255,0)");
  gradient.addColorStop(1, "rgba(35,164,255,0.18)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 10;
  roundRect(ctx, 8, 8, width - 16, height - 16, 28);
  ctx.stroke();
  ctx.restore();
}

function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number, preview: boolean): void {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, preview ? "#eaf7ff" : "#bfe8ff");
  gradient.addColorStop(0.45, preview ? "#d8efff" : "#8ad2ff");
  gradient.addColorStop(1, preview ? "#eef9ff" : "#39a9ff");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "rgba(255,255,255,0.18)";

  for (let x = 0; x < width; x += 46) {
    for (let y = 0; y < height; y += 46) {
      ctx.fillRect(x, y, 26, 26);
    }
  }

  for (let i = 0; i < 28; i += 1) {
    const x = (i * 149) % width;
    const y = (i * 83) % height;
    drawStar(ctx, x, y, 6 + (i % 3) * 3, i % 2 ? "#ffd143" : "#ffffff");
  }
}

function drawMapDecor(ctx: CanvasRenderingContext2D, width: number, height: number, preview: boolean): void {
  ctx.save();
  ctx.globalAlpha = preview ? 0.62 : 0.78;
  [
    [74, 94, "#ffffff", 0.3],
    [875, 105, "#ffcf35", -0.25],
    [112, 620, "#ffffff", -0.1],
    [905, 585, "#ff62aa", 0.18],
  ].forEach(([x, y, color, rotate]) => {
    drawBolt(ctx, Number(x), Number(y), 36, String(color), Number(rotate));
  });

  const confetti = ["#ff4f9d", "#25d0bf", "#ffd143", "#2c8fff", "#ffffff"];
  for (let i = 0; i < 48; i += 1) {
    const x = (i * 101 + 37) % width;
    const y = (i * 67 + 29) % height;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((i % 7) * 0.38);
    ctx.fillStyle = confetti[i % confetti.length];
    roundRect(ctx, -4, -2, 8 + (i % 3) * 4, 5, 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawBoundaryBlocks(ctx: CanvasRenderingContext2D): void {
  const colors = ["#ff5aa8", "#26cfc3", "#2798ff", "#ffd04a", "#9b7cff"];
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let i = 0; i < trackSamples.length - 3; i += 8) {
    const sample = trackSamples[i];
    const next = trackSamples[i + 3];
    const angle = Math.atan2(next.y - sample.y, next.x - sample.x);
    const normal = angle + Math.PI / 2;
    [-1, 1].forEach((side, sideIndex) => {
      const x = sample.x + Math.cos(normal) * 91 * side;
      const y = sample.y + Math.sin(normal) * 91 * side;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.shadowBlur = 13;
      ctx.shadowColor = sideIndex ? "#5ff6ff" : "#ff7ed2";
      const gradient = ctx.createLinearGradient(-24, -14, 24, 14);
      const color = colors[(i / 8 + sideIndex * 2) % colors.length | 0];
      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(0.16, color);
      gradient.addColorStop(1, color);
      ctx.fillStyle = gradient;
      roundRect(ctx, -27, -14, 54, 28, 9);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.72)";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      roundRect(ctx, -14, -5, 28, 5, 3);
      ctx.fill();
      if ((i + sideIndex) % 4 === 0) {
        drawBolt(ctx, 0, 0, 10, "#ffffff", -0.2);
      }
      ctx.restore();
    });
  }
  ctx.restore();
}

function drawRoadTexture(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.globalAlpha = 0.26;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.setLineDash([18, 38]);
  ctx.stroke(trackPath);
  ctx.setLineDash([]);
  ctx.restore();
}

function drawFinishLine(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.translate(165, 545);
  ctx.rotate(Math.PI / 2);
  const tile = 18;
  for (let row = -2; row <= 2; row += 1) {
    for (let col = -4; col <= 4; col += 1) {
      ctx.fillStyle = (row + col) % 2 === 0 ? "#ffffff" : "#1c2c4d";
      ctx.fillRect(col * tile, row * tile, tile, tile);
    }
  }
  ctx.fillStyle = "#fff";
  ctx.font = "900 31px sans-serif";
  ctx.textAlign = "center";
  ctx.strokeStyle = "#126cf4";
  ctx.lineWidth = 8;
  ctx.strokeText("START", 0, 82);
  ctx.fillText("START", 0, 82);
  ctx.restore();
  ctx.save();
  ctx.translate(770, 545);
  ctx.rotate(-0.02);
  ctx.fillStyle = "#ff4f9d";
  roundRect(ctx, -72, -32, 144, 64, 20);
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = "900 30px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ゴール!", 0, 8);
  ctx.fillStyle = "#1d2c4d";
  for (let col = -3; col <= 3; col += 1) {
    ctx.fillRect(col * 18, 30, 18, 18);
  }
  ctx.restore();
}

function drawObstacles(ctx: CanvasRenderingContext2D): void {
  [
    [455, 250, 118, 76, "#2c8fff"],
    [690, 355, 118, 62, "#ffffff"],
    [520, 474, 82, 102, "#25d0bf"],
    [330, 300, 92, 54, "#ffffff"],
  ].forEach(([x, y, w, h, color], index) => {
    ctx.save();
    ctx.fillStyle = String(color);
    ctx.strokeStyle = "#87c8ff";
    ctx.lineWidth = 10;
    ctx.shadowBlur = 18;
    ctx.shadowColor = "#4ce8ff";
    roundRect(ctx, Number(x) - Number(w) / 2, Number(y) - Number(h) / 2, Number(w), Number(h), 18);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = index % 2 ? "#ff5aa8" : "#ffffff";
    roundRect(ctx, Number(x) - 20, Number(y) - 12, 40, 24, 8);
    ctx.fill();
    ctx.restore();
  });

  [
    [715, 160],
    [855, 530],
    [145, 625],
  ].forEach(([x, y]) => {
    ctx.save();
    ctx.fillStyle = "#ff6cae";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 5;
    ctx.shadowBlur = 16;
    ctx.shadowColor = "#ff8bd0";
    roundRect(ctx, x - 22, y - 28, 44, 56, 14);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });
}

function drawElectricity(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.92)";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowBlur = 14;
  ctx.shadowColor = "#55f4ff";
  for (let i = 0; i < trackSamples.length - 4; i += 18) {
    const sample = trackSamples[i];
    const next = trackSamples[i + 4];
    const angle = Math.atan2(next.y - sample.y, next.x - sample.x);
    const normal = angle + Math.PI / 2;
    const side = i % 36 === 0 ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(sample.x + Math.cos(normal) * 80 * side, sample.y + Math.sin(normal) * 80 * side);
    ctx.lineTo((sample.x + next.x) / 2 + Math.cos(normal) * 98 * side, (sample.y + next.y) / 2 + Math.sin(normal) * 98 * side);
    ctx.lineTo(next.x + Math.cos(normal) * 80 * side, next.y + Math.sin(normal) * 80 * side);
    ctx.stroke();
  }
  ctx.restore();
}

function drawArrowMarks(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.fillStyle = "rgba(255, 209, 67, 0.86)";
  [[330, 150, 0], [785, 315, 1.2], [335, 548, -0.2], [690, 500, -0.7]].forEach(([x, y, rotate]) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotate);
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * 24, 0);
      ctx.lineTo(i * 24 + 24, 18);
      ctx.lineTo(i * 24, 36);
      ctx.lineTo(i * 24 + 8, 18);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  });
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

function drawBolt(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, rotate = 0): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotate);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-size * 0.16, -size * 0.55);
  ctx.lineTo(size * 0.28, -size * 0.55);
  ctx.lineTo(size * 0.08, -size * 0.08);
  ctx.lineTo(size * 0.42, -size * 0.08);
  ctx.lineTo(-size * 0.18, size * 0.58);
  ctx.lineTo(-size * 0.02, size * 0.1);
  ctx.lineTo(-size * 0.36, size * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.72)";
  ctx.lineWidth = Math.max(2, size * 0.08);
  ctx.stroke();
  ctx.restore();
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 === 0 ? radius : radius * 0.45;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
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

export { kartSprites, trackSamples };
