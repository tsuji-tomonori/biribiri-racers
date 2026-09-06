import { defineConfig } from '@playwright/test';
const firefox = process.env['PLAYWRIGHT_FIREFOX_PATH'];
export default defineConfig({
  testDir: './tests/online',
  workers: 1,
  timeout: 90000,
  expect: { timeout: 15000 },
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4321/biribiri-racers/',
    browserName: firefox ? 'firefox' : 'chromium',
    ...(firefox ? { launchOptions: { executablePath: firefox } } : {}),
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { viewport: { width: 375, height: 812 } } },
    { name: 'tablet', use: { viewport: { width: 768, height: 1024 } } },
  ],
  webServer: [
    {
      command:
        'uv run --project backend uvicorn app.local:app --host 127.0.0.1 --port 4322',
      url: 'http://127.0.0.1:4322/api/health',
      timeout: 30000,
    },
    {
      command: 'python scripts/static-preview.py',
      url: 'http://127.0.0.1:4321/biribiri-racers/',
      timeout: 30000,
    },
  ],
});
