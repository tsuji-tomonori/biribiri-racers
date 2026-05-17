import { expect, test } from "@playwright/test";
import { PNG } from "pngjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const screens = ["menu", "room", "map", "ready", "game", "result"] as const;
const testDir = path.dirname(fileURLToPath(import.meta.url));
const referenceDir = path.resolve(testDir, "../../public/assets/reference");

test.describe("canonical reference inventory", () => {
  for (const screen of screens) {
    test(`${screen} reference is 1672x941`, () => {
      const image = PNG.sync.read(fs.readFileSync(path.join(referenceDir, `${screen}.png`)));
      expect(image.width).toBe(1672);
      expect(image.height).toBe(941);
    });
  }
});

test.describe.skip("canonical reference visual regression: enable after six-screen artboard rewrite", () => {
  for (const screen of screens) {
    test(`${screen} matches canonical screenshot`, async ({ page }) => {
      await page.setViewportSize({ width: 1672, height: 941 });
      await page.goto(`/?screen=${screen}`);
      await expect(page).toHaveScreenshot(`${screen}.png`, {
        maxDiffPixelRatio: 0.05,
      });
    });
  }
});
