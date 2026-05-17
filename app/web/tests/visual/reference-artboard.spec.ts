import { expect, test } from "@playwright/test";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { courses } from "../../src/data/courses";

const screens = ["menu", "room", "map", "ready", "game", "result"] as const;
const testDir = path.dirname(fileURLToPath(import.meta.url));
const referenceDir = path.resolve(testDir, "../../public/assets/reference");
const publicDir = path.resolve(testDir, "../../public");
const enablePixelTests = process.env.ENABLE_REFERENCE_PIXEL_TESTS === "1";
const maxDiffPixelRatio = 0.05;

test.describe("canonical reference inventory", () => {
  for (const screen of screens) {
    test(`${screen} reference is 1672x941`, () => {
      const image = PNG.sync.read(fs.readFileSync(path.join(referenceDir, `${screen}.png`)));
      expect(image.width).toBe(1672);
      expect(image.height).toBe(941);
    });
  }

  test("every course has a concrete board asset file", () => {
    for (const course of courses) {
      expect(course.boardAsset, `${course.id} ${course.name}`).toBeTruthy();
      expect(fs.existsSync(publicAssetPath(course.boardAsset)), course.boardAsset).toBe(true);
    }
  });
});

test.describe("canonical reference visual regression", () => {
  test.skip(!enablePixelTests, "Set ENABLE_REFERENCE_PIXEL_TESTS=1 after the six-screen artboard rewrite is ready for pixel comparison.");

  for (const screen of screens) {
    test(`${screen} matches canonical screenshot`, async ({ page }) => {
      await page.setViewportSize({ width: 1672, height: 941 });
      await page.goto(`/?screen=${screen}`);
      const actual = PNG.sync.read(await page.screenshot({ fullPage: false }));
      const expected = PNG.sync.read(fs.readFileSync(path.join(referenceDir, `${screen}.png`)));
      expect(actual.width).toBe(expected.width);
      expect(actual.height).toBe(expected.height);

      const diffPixels = pixelmatch(actual.data, expected.data, null, expected.width, expected.height, { threshold: 0.1 });
      expect(diffPixels / (expected.width * expected.height)).toBeLessThanOrEqual(maxDiffPixelRatio);
    });
  }
});

function publicAssetPath(asset: string | undefined): string {
  if (!asset) return "";
  const relativePath = asset.replace(/^\//, "");
  return path.join(publicDir, relativePath.replace(/^assets\//, "assets/"));
}
