import { defineConfig, devices } from '@playwright/test';

/**
 * 🎭 Playwright Industrial Configuration — ABDLogs
 * SmartNavbar E2E tests for public mode.
 *
 * Dev server must be running on port 3600 (pnpm dev).
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: 'list',
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:3600',
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
