import { test, expect, type Browser, type Page } from '@playwright/test';
async function enter(page: Page, name: string, code?: string) {
  await page.goto('/biribiri-racers/');
  await page.locator('#online-open').click();
  await page.locator('#online-name').fill(name);
  if (code) {
    await page.locator('#join-code').fill(code);
    await page.locator('#join-room button').click();
  } else {
    await page.locator('#create-mode').selectOption('free');
    await page.locator('#create-room button').click();
  }
  await expect(page.locator('#room-code')).toHaveText(/[A-Z2-9]{6}/);
  await expect(page.locator('#online-status')).toHaveText('リアルタイム接続中');
}
async function join(browser: Browser, code: string, n: number) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await enter(page, `レーサー${n}`, code);
  return { context, page };
}
test('作成・参加・実入力同期・切断・結果・次コース', async ({
  page,
  browser,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await enter(page, 'ホスト');
  const code = (await page.locator('#room-code').textContent())!;
  const guest = await join(browser, code, 2);
  try {
    await expect(page.locator('#room-members li')).toHaveCount(2);
    await page.screenshot({
      path: `test-results/online-${info.project.name}-room.png`,
    });
    await page.locator('#room-ready').click();
    await guest.page.locator('#room-ready').click();
    await page.locator('#room-start').click();
    await expect(page.locator('#race')).toBeVisible();
    await expect(guest.page.locator('#race')).toBeVisible();
    await expect(page.locator('#countdown')).not.toBeVisible({
      timeout: 10000,
    });
    await page.keyboard.down('ArrowRight');
    await expect(page.locator('#hits')).not.toHaveText('壁への接触 0 回', {
      timeout: 12000,
    });
    await page.keyboard.up('ArrowRight');
    await page.screenshot({
      path: `test-results/online-${info.project.name}-race.png`,
    });
    await guest.page.locator('#online-exit').click();
    await expect(page.locator('#results')).toBeVisible();
    await expect(page.locator('#result-list .result-row')).toHaveCount(2);
    await page.locator('#retry').click();
    await expect(page.locator('#room-panel')).toBeVisible();
    await page.locator('#room-next').click();
    await page.locator('#room-course').selectOption('7');
    await page.locator('#room-save').click();
    await expect(page.locator('#room-mode')).toContainText(
      'ボルトファクトリー',
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
    await page.locator('#room-leave').click();
  } finally {
    await guest.context.close();
  }
});
test('10ブラウザの入室と11人目拒否', async ({ page, browser }, info) => {
  test.skip(info.project.name !== 'desktop');
  await enter(page, '10人ホスト');
  const code = (await page.locator('#room-code').textContent())!;
  const guests = [];
  try {
    for (let i = 1; i < 10; i++) guests.push(await join(browser, code, i));
    await expect(page.locator('#room-members li')).toHaveCount(10);
    const extra = await browser.newPage();
    try {
      await extra.goto('/biribiri-racers/');
      await extra.locator('#online-open').click();
      await extra.locator('#join-code').fill(code);
      await extra.locator('#join-room button').click();
      await expect(extra.locator('#online-error')).toHaveText(
        'このルームは満員です。',
      );
    } finally {
      await extra.close();
    }
    await page.locator('#room-ready').click();
    for (const g of guests) await g.page.locator('#room-ready').click();
    await page.locator('#room-start').click();
    await expect(page.locator('#racers .racer-row')).toHaveCount(10);
    await page.screenshot({ path: 'test-results/online-ten-racers.png' });
    for (const g of guests) await g.page.locator('#online-exit').click();
    await expect(page.locator('#result-list .result-row')).toHaveCount(10);
  } finally {
    for (const g of guests) await g.context.close();
  }
});
