import { test, expect } from '@playwright/test';
import { TRACKS } from '../../src/game/tracks';
import { createRacer, cpuInput, STEP, tick } from '../../src/game/physics';

test.beforeEach(async ({ page }, info) => {
  const manualClock = /チャージ|CPUが完走|キー操作だけ/.test(info.title);
  if (manualClock)
    await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.goto('./');
  await expect(
    page.getByRole('button', { name: 'レース スタート！' }),
  ).toBeEnabled();
  if (manualClock) await page.clock.pauseAt(new Date('2026-01-01T00:01:00Z'));
});

test('読み込み・開始・停止・再開・リトライ @smoke', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await expect(
    page.getByRole('heading', { name: 'さあ、走ろう。' }),
  ).toBeVisible();
  await expect(page.locator('[data-course]')).toHaveCount(5);
  await page.getByRole('button', { name: 'レース スタート！' }).click();
  await expect(page.locator('#race')).toHaveAttribute('data-phase', 'racing');
  await expect(page.locator('#speed')).not.toHaveText('0');
  await page.getByRole('button', { name: '一時停止', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'ひとやすみ' })).toBeVisible();
  const time = await page.locator('#time').innerText();
  await page.waitForTimeout(350);
  await expect(page.locator('#time')).toHaveText(time);
  await page.getByRole('button', { name: 'レースにもどる' }).click();
  await expect(page.locator('#race')).toHaveAttribute('data-phase', 'racing');
  await page.getByRole('button', { name: '一時停止', exact: true }).click();
  await page.getByRole('button', { name: '最初からやりなおす' }).click();
  await expect(page.locator('#race')).toHaveAttribute(
    'data-phase',
    'countdown',
  );
  await expect(page.locator('#time')).toHaveText('00:00.00');
  await page.getByRole('button', { name: '一時停止', exact: true }).click();
  await page.getByRole('button', { name: 'コースを選びなおす' }).click();
  await expect(page.locator('#menu')).toBeVisible();
  expect(errors).toEqual([]);
});

test('コース・モード・カラー・遊び方を実際に切り替える', async ({
  page,
}, info) => {
  await page
    .getByRole('button', { name: '3 キャンディループ', exact: true })
    .click();
  await expect(page.locator('#course-name')).toHaveText('キャンディループ');
  await expect(page.locator('#course-preview')).toHaveAttribute(
    'src',
    /course-2.webp/,
  );
  await page.getByRole('radio', { name: /フリー走行/ }).check();
  await expect(page.locator('#difficulty')).toBeDisabled();
  await page.getByRole('button', { name: 'ピンク', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'ピンク', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '遊び方', exact: true }).click();
  await expect(
    page.getByRole('dialog', { name: '曲がる。ためる。飛びだす。' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: '遊び方', exact: true }),
  ).toBeFocused();
  await page.screenshot({
    path: info.outputPath('course-select.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'レース スタート！' }).click();
  await expect(page.locator('[data-racer]')).toHaveCount(1);
  await expect(page.locator('#race-course-name')).toHaveText(
    'キャンディループ',
  );
});

test('画面幅に収まり主要な操作を隠さない', async ({ page }, info) => {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  for (const id of ['#start', '#difficulty', '#course-list'])
    await expect(page.locator(id)).toBeVisible();
  await page.screenshot({ path: info.outputPath('menu.png'), fullPage: true });
  await page.getByRole('button', { name: 'レース スタート！' }).click();
  await page.getByRole('button', { name: '一時停止', exact: true }).click();
  await page.getByRole('button', { name: 'レースにもどる' }).click();
  const bounds = await page.locator('#game').boundingBox();
  expect(bounds?.width).toBe(page.viewportSize()?.width);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  if (info.project.name === 'mobile') {
    for (const label of ['左に曲がる', '右に曲がる']) {
      const button = page.getByRole('button', { name: label });
      await expect(button).toBeVisible();
      const box = await button.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  }
  await page.screenshot({ path: info.outputPath('race.png'), fullPage: true });
});

test('押してチャージ・離して加速・接触後の復帰', async ({ page }) => {
  await page.getByRole('radio', { name: /フリー走行/ }).check();
  await page.getByRole('button', { name: 'レース スタート！' }).click();
  await page.clock.runFor(3100);
  await page.keyboard.down('Space');
  await page.clock.runFor(1000);
  await expect(page.locator('#charge-label')).toHaveText('RELEASE!');
  await page.keyboard.up('Space');
  await page.clock.runFor(150);
  await expect(page.locator('#charge-label')).toHaveText('DASH!');
  await page.keyboard.down('ArrowLeft');
  await page.clock.runFor(1800);
  await page.keyboard.up('ArrowLeft');
  await expect(page.locator('#hits')).not.toHaveText('壁への接触 0 回');
  await page.keyboard.press('KeyR');
  await page.clock.runFor(120);
  await expect(page.locator('#progress')).toHaveText('0%');
});

test('CPUが完走すると結果を表示し、リトライできる', async ({ page }, info) => {
  test.skip(
    info.project.name !== 'chromium',
    'Full result flow is shared; mobile smoke covers controls.',
  );
  await page.locator('#difficulty').selectOption('normal');
  await page.getByRole('button', { name: 'レース スタート！' }).click();
  await page.keyboard.down('Space');
  await page.clock.runFor(35000);
  await page.keyboard.up('Space');
  await expect(page.locator('#results')).toBeVisible();
  await expect(page.locator('#result-title')).toContainText('の勝利');
  await expect(page.locator('.result-row')).toHaveCount(4);
  await page.screenshot({ path: info.outputPath('result.png') });
  await page.getByRole('button', { name: 'もういちど走る' }).click();
  await expect(page.locator('#race')).toHaveAttribute(
    'data-phase',
    'countdown',
  );
});

test('キー操作だけでプレイヤーがゴールできる', async ({ page }, info) => {
  test.skip(
    info.project.name !== 'chromium',
    'Deterministic keyboard replay runs on desktop.',
  );
  // Generate only a sequence of real key presses. No production test hooks,
  // teleportation, finish mutation or mock race results are used by this E2E.
  const track = TRACKS[0]!,
    racer = createRacer(track, 0, 0, false);
  const steps: { key: string | null; push: boolean }[] = [];
  for (let ms = 0; ms < 60000 && racer.finish === null; ms += 50) {
    const ai = cpuInput(track, racer, 'normal'),
      steer = Math.abs(ai.steer) < 0.12 ? 0 : Math.sign(ai.steer);
    steps.push({
      key: steer < 0 ? 'ArrowLeft' : steer > 0 ? 'ArrowRight' : null,
      push: ai.push,
    });
    for (let j = 0; j < 6; j++)
      tick(
        track,
        racer,
        { steer, push: ai.push, throttle: 1, assist: true },
        STEP,
        ms / 1000 + j * STEP,
      );
  }
  expect(racer.finish).not.toBeNull();
  expect(racer.hits).toBe(0);
  await page.getByRole('radio', { name: /フリー走行/ }).check();
  await page.getByRole('button', { name: 'レース スタート！' }).click();
  await page.clock.runFor(3000);
  let held: string | null = null,
    pushing = false;
  for (const step of steps) {
    if (step.key !== held) {
      if (held) await page.keyboard.up(held);
      if (step.key) await page.keyboard.down(step.key);
      held = step.key;
    }
    if (step.push !== pushing) {
      if (step.push) await page.keyboard.down('Space');
      else await page.keyboard.up('Space');
      pushing = step.push;
    }
    await page.clock.runFor(50);
  }
  if (held) await page.keyboard.up(held);
  if (pushing) await page.keyboard.up('Space');
  await page.clock.runFor(1500);
  console.log(
    'Keyboard replay HUD',
    await page.locator('#time').innerText(),
    await page.locator('#progress').innerText(),
    await page.locator('#hits').innerText(),
  );
  await expect(page.locator('#results')).toBeVisible();
  await expect(page.locator('#result-title')).toHaveText('やったね、ゴール！');
  await page.screenshot({ path: info.outputPath('player-finish.png') });
});

test('画像エラーを隠さず再読み込みできる', async ({ page }) => {
  await page.route('**/assets/racers.webp', (route) => route.abort());
  await page.reload();
  await expect(page.getByRole('alert')).toContainText(
    'コース画像を読み込めませんでした',
  );
  await expect(page.locator('#start')).toBeDisabled();
  await page.unroute('**/assets/racers.webp');
  await page.getByRole('button', { name: '画像を再読み込み' }).click();
  await expect(
    page.getByRole('button', { name: 'レース スタート！' }),
  ).toBeEnabled();
});
