import { defineConfig, devices } from '@playwright/test';

/**
 * 🎭 Playwright Industrial Configuration — ABDLogs
 * SmartNavbar E2E tests for public mode.
 *
 * Dev server must be running on port 3600 (pnpm dev).
 */
export default defineConfig({
  testDir: './tests',
  globalSetup: './tests/global-setup',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: 'list',
  timeout: 60000,

  // ── Sin webServer ──
  // cmd.exe está roto en este sistema. Playwright usa cmd.exe internamente
  // para el webServer (shell: true en Windows). Arrancamos el server
  // manualmente desde scripts/run-e2e.sh antes de los tests.
  //
  // Para ejecutar: bash scripts/run-e2e.sh

  use: {
    baseURL: 'http://localhost:5003',
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
