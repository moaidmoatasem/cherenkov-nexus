import { defineConfig, devices } from '@playwright/test';

/**
 * `@live` marks the specs that reach real third-party hosts
 * (boards.greenhouse.io, github.com). They are worth keeping — they catch real
 * integration drift — but they fail on any network hiccup, so CI runs
 * `--grep-invert @live` rather than gating a pull request on someone else's
 * uptime. A local `npm run test` still runs everything.
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  timeout: 45000,
  expect: {
    timeout: 10000
  },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    viewport: { width: 1440, height: 900 }
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000/api/health',
    reuseExistingServer: true,
    timeout: 120000
  }
});
