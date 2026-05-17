import type { Course } from "../../types";
import { loadedImage, type ImageCache } from "../imageCache";
import type { ChipTrackSpec } from "./chipTrack";
import { chipTrackForCourse } from "./chipTrack";

interface ChipRenderOptions {
  preview: boolean;
  assets: ImageCache;
}

const CHIP_COLORS = ["#ff5aa8", "#25d0bf", "#2c8fff", "#ffd143", "#9b7cff", "#7df4ff"];

const PALETTE_COLORS: Record<string, string> = {
  pink: "#ff5aa8",
  mint: "#25d0bf",
  sky_blue: "#2c8fff",
  yellow: "#ffd143",
  pastel_purple: "#9b7cff",
  neon_blue: "#2c8fff",
  neon_pink: "#ff43ba",
  cyan: "#45efff",
  purple: "#9b7cff",
  lavender: "#b49cff",
  cream_yellow: "#ffe47b",
  green: "#20c987",
  teal: "#25d0bf",
  flower_pink: "#ff80c4",
  ice_blue: "#9feaff",
  white: "#ffffff",
  deep_blue: "#2774ff",
};

export function drawChipTrack(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  course: Course,
  options: ChipRenderOptions,
): void {
  const track = chipTrackForCourse(course.id);
  ctx.clearRect(0, 0, width, height);
  withTrackScale(ctx, width, height, track, () => {
    drawFloor(ctx, track, course, options.assets, options.preview);
    drawBackgroundDecor(ctx, track, course, options.preview);
    drawRoad(ctx, track);
    drawWallChips(ctx, track, course, options.assets, options.preview);
    drawElectricLines(ctx, track);
    drawRoadHighlights(ctx, track);
    drawStartGoal(ctx, track);
  });
}

export function drawChipMiniMap(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  course: Course,
  assets: ImageCache,
): void {
  const track = chipTrackForCourse(course.id);
  ctx.clearRect(0, 0, width, height);
  withTrackScale(ctx, width, height, track, () => {
    drawFloor(ctx, track, course, assets, true);
    drawRoad(ctx, track);
    drawWallChips(ctx, track, course, assets, true, 0.54);
    drawStartGoal(ctx, track, 0.72);
  });
}

export function isPointOnChipRoad(ctx: CanvasRenderingContext2D, course: Course, x: number, y: number): boolean {
  const track = chipTrackForCourse(course.id);
  ctx.save();
  ctx.lineWidth = track.roadWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const result = ctx.isPointInStroke(track.path, x, y);
  ctx.restore();
  return result;
}

function withTrackScale(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  track: ChipTrackSpec,
  draw: () => void,
): void {
  ctx.save();
  ctx.scale(width / track.designWidth, height / track.designHeight);
  draw();
  ctx.restore();
}

function drawFloor(
  ctx: CanvasRenderingContext2D,
  track: ChipTrackSpec,
  course: Course,
  assets: ImageCache,
  preview: boolean,
): void {
  const floor = course.themeAssets?.floor ? loadedImage(assets, course.themeAssets.floor) : null;
  const pattern = floor ? ctx.createPattern(floor, "repeat") : null;

  if (pattern) {
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, track.designWidth, track.designHeight);
    ctx.fillStyle = preview ? "rgba(255,255,255,0.34)" : "rgba(255,255,255,0.18)";
    ctx.fillRect(0, 0, track.designWidth, track.designHeight);
  } else {
    const gradient = ctx.createLinearGradient(0, 0, track.designWidth, track.designHeight);
    gradient.addColorStop(0, preview ? "#f1fbff" : "#d7f4ff");
    gradient.addColorStop(0.52, preview ? "#e8f6ff" : "#cfefff");
    gradient.addColorStop(1, preview ? "#f8fbff" : "#f7ecff");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, track.designWidth, track.designHeight);

    ctx.save();
    ctx.globalAlpha = preview ? 0.32 : 0.24;
    for (let x = 0; x < track.designWidth; x += 44) {
      for (let y = 0; y < track.designHeight; y += 44) {
        ctx.fillStyle = (x / 44 + y / 44) % 2 === 0 ? "#ffffff" : "#9feaff";
        roundRect(ctx, x + 4, y + 4, 28, 28, 7);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}

function drawRoad(ctx: CanvasRenderingContext2D, track: ChipTrackSpec): void {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.shadowBlur = 34;
  ctx.shadowColor = "#7ff5ff";
  ctx.strokeStyle = "rgba(255,255,255,0.96)";
  ctx.lineWidth = track.roadWidth + 86;
  ctx.stroke(track.path);

  ctx.shadowBlur = 22;
  ctx.shadowColor = "#79dfff";
  ctx.strokeStyle = "#9deeff";
  ctx.lineWidth = track.roadWidth + 58;
  ctx.stroke(track.path);

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = track.roadWidth + 24;
  ctx.stroke(track.path);

  const roadGradient = ctx.createLinearGradient(120, 120, 880, 620);
  roadGradient.addColorStop(0, "#f8fbff");
  roadGradient.addColorStop(0.45, "#dfe6ef");
  roadGradient.addColorStop(1, "#f4f7fb");
  ctx.strokeStyle = roadGradient;
  ctx.lineWidth = track.roadWidth;
  ctx.stroke(track.path);
  ctx.restore();
}

function drawRoadHighlights(ctx: CanvasRenderingContext2D, track: ChipTrackSpec): void {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(255,255,255,0.72)";
  ctx.lineWidth = 8;
  ctx.setLineDash([34, 30]);
  ctx.stroke(track.path);
  ctx.setLineDash([]);

  ctx.globalAlpha = 0.34;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 34]);
  ctx.stroke(track.path);
  ctx.restore();
}

function drawWallChips(
  ctx: CanvasRenderingContext2D,
  track: ChipTrackSpec,
  course: Course,
  assets: ImageCache,
  preview: boolean,
  scale = 1,
): void {
  const step = Math.max(5, Math.round(track.chipSpacing / Math.max(1, track.samples.total / track.samples.length)));
  const colors = colorsForCourse(course);
  const halfRoad = track.roadWidth / 2;

  ctx.save();
  for (let i = 0; i < track.samples.length - step; i += step) {
    const sample = track.samples[i];
    const next = track.samples[i + step];
    const angle = Math.atan2(next.y - sample.y, next.x - sample.x);
    const normal = angle + Math.PI / 2;

    [-1, 1].forEach((side, sideIndex) => {
      const colorIndex = Math.floor(i / step + sideIndex * 2 + track.decorSeed) % colors.length;
      const chip = {
        x: sample.x + Math.cos(normal) * (halfRoad + track.chipSize * 0.56) * side,
        y: sample.y + Math.sin(normal) * (halfRoad + track.chipSize * 0.56) * side,
        angle,
        color: colors[colorIndex],
        part: course.partAssets[(Math.floor(i / step) + sideIndex) % Math.max(1, course.partAssets.length)],
      };
      drawSingleChip(ctx, chip, assets, track.chipSize * scale, preview);
    });
  }
  ctx.restore();
}

function drawSingleChip(
  ctx: CanvasRenderingContext2D,
  chip: { x: number; y: number; angle: number; color: string; part: string | undefined },
  assets: ImageCache,
  size: number,
  preview: boolean,
): void {
  const image = chip.part ? loadedImage(assets, chip.part) : null;
  ctx.save();
  ctx.translate(chip.x, chip.y);
  ctx.rotate(chip.angle);
  ctx.shadowBlur = preview ? 10 : 16;
  ctx.shadowColor = chip.color === "#ffffff" ? "#7ff5ff" : chip.color;

  const width = size * 1.18;
  const height = size * 0.64;
  const gradient = ctx.createLinearGradient(-width / 2, -height / 2, width / 2, height / 2);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.24, chip.color);
  gradient.addColorStop(1, chip.color);
  ctx.fillStyle = gradient;
  roundRect(ctx, -width / 2, -height / 2, width, height, Math.max(8, size * 0.18));
  ctx.fill();

  if (image) {
    ctx.save();
    ctx.globalAlpha = 0.94;
    const imageSize = size * 0.88;
    ctx.drawImage(image, -imageSize / 2, -imageSize / 2, imageSize, imageSize);
    ctx.restore();
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.42)";
    roundRect(ctx, -width * 0.28, -height * 0.18, width * 0.56, height * 0.22, 5);
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(255,255,255,0.86)";
  ctx.lineWidth = Math.max(2, size * 0.07);
  roundRect(ctx, -width / 2, -height / 2, width, height, Math.max(8, size * 0.18));
  ctx.stroke();
  ctx.restore();
}

function drawElectricLines(ctx: CanvasRenderingContext2D, track: ChipTrackSpec): void {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(255,255,255,0.94)";
  ctx.lineWidth = 4;
  ctx.shadowBlur = 15;
  ctx.shadowColor = "#5df7ff";

  for (let i = 0; i < track.samples.length - 7; i += 17) {
    const sample = track.samples[i];
    const next = track.samples[i + 7];
    const angle = Math.atan2(next.y - sample.y, next.x - sample.x);
    const normal = angle + Math.PI / 2;
    const side = i % 34 === 0 ? 1 : -1;
    const inner = track.roadWidth / 2 + 12;
    const outer = track.roadWidth / 2 + 34;
    ctx.beginPath();
    ctx.moveTo(sample.x + Math.cos(normal) * inner * side, sample.y + Math.sin(normal) * inner * side);
    ctx.lineTo(
      midpoint(sample.x, next.x) + Math.cos(normal) * outer * side,
      midpoint(sample.y, next.y) + Math.sin(normal) * outer * side,
    );
    ctx.lineTo(next.x + Math.cos(normal) * inner * side, next.y + Math.sin(normal) * inner * side);
    ctx.stroke();
  }
  ctx.restore();
}

function drawStartGoal(ctx: CanvasRenderingContext2D, track: ChipTrackSpec, scale = 1): void {
  const start = track.start;
  ctx.save();
  ctx.translate(start.x, start.y);
  ctx.rotate(start.angle + Math.PI / 2);
  const tile = 16 * scale;
  for (let row = -3; row <= 3; row += 1) {
    for (let col = -4; col <= 4; col += 1) {
      ctx.fillStyle = (row + col) % 2 === 0 ? "#ffffff" : "#22375f";
      ctx.fillRect(col * tile, row * tile, tile, tile);
    }
  }
  drawLabel(ctx, "START", 0, 92 * scale, 30 * scale, "#2c8fff");
  drawLabel(ctx, "GOAL", 0, -92 * scale, 30 * scale, "#ff4f9d");
  ctx.restore();
}

function drawLabel(ctx: CanvasRenderingContext2D, label: string, x: number, y: number, size: number, color: string): void {
  ctx.save();
  ctx.font = `900 ${size}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = Math.max(5, size * 0.22);
  ctx.strokeStyle = color;
  ctx.fillStyle = "#ffffff";
  ctx.shadowBlur = 12;
  ctx.shadowColor = color;
  ctx.strokeText(label, x, y);
  ctx.fillText(label, x, y);
  ctx.restore();
}

function drawBackgroundDecor(ctx: CanvasRenderingContext2D, track: ChipTrackSpec, course: Course, preview: boolean): void {
  ctx.save();
  ctx.globalAlpha = preview ? 0.54 : 0.72;
  const colors = colorsForCourse(course);

  for (let i = 0; i < 38; i += 1) {
    const x = seeded(track.decorSeed, i, 137, track.designWidth);
    const y = seeded(track.decorSeed + 3, i, 89, track.designHeight);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(((i + track.decorSeed) % 9) * 0.24);
    ctx.fillStyle = colors[i % colors.length];
    if (i % 5 === 0) {
      drawBolt(ctx, 0, 0, 16 + (i % 4) * 4, "#ffffff", 0);
    } else if (i % 3 === 0) {
      drawStar(ctx, 0, 0, 6 + (i % 4), i % 2 === 0 ? "#ffffff" : "#ffd143");
    } else {
      roundRect(ctx, -5, -3, 10 + (i % 4) * 4, 6, 3);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
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
  ctx.strokeStyle = "rgba(65,166,255,0.5)";
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

function colorsForCourse(course: Course): string[] {
  const colors = course.palette.map((color) => PALETTE_COLORS[color]).filter(Boolean);
  return colors.length >= 3 ? colors : CHIP_COLORS;
}

function seeded(seed: number, index: number, multiplier: number, max: number): number {
  return (seed * 73 + index * multiplier + (index % 7) * 31) % max;
}

function midpoint(a: number, b: number): number {
  return (a + b) / 2;
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
