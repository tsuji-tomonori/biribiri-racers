import { defineConfig, devices } from '@playwright/test';
const remote = process.env['PLAYWRIGHT_BASE_URL'];
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  timeout: 90000,
  expect: { timeout: 10000 },
  workers: 2,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: remote ?? 'http://127.0.0.1:4321/biribiri-racers/',
    trace: {
      mode: 'retain-on-failure',
      screenshots: false,
      snapshots: true,
      sources: true,
    },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], viewport: { width: 375, height: 812 } },
    },
    {
      name: 'tablet',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 },
      },
    },
  ],
  ...(remote
    ? {}
    : {
        webServer: {
          command: 'npm run preview -- --port 4321',
          url: 'http://127.0.0.1:4321/biribiri-racers/',
          reuseExistingServer: !process.env['CI'],
          timeout: 30000,
        },
      }),
});
