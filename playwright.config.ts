import { defineConfig, devices } from '@playwright/test';

/**
 * Deliberately avoids depending on live feed data succeeding — feed
 * fetches go through public CORS proxies (see src/store.ts), which are
 * unreliable enough in practice (confirmed directly while building this
 * app: proxies both fail and simply hang) that gating CI on one actually
 * returning real articles would make this suite flaky by design. Specs
 * here cover UI behavior that doesn't require a feed to have loaded.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
