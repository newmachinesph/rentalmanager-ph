import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for RentalManager PH.
 *
 * Tests run SEQUENTIALLY (single worker) because later specs depend on
 * data created by earlier specs via UI interactions.
 *
 * File ordering: 01-auth → 02-navigation → 03-settings → 04-properties →
 * 05-tenants → 06-leases → 07-income → 08-expenses → 09-maintenance →
 * 10-utilities → 11-contracts → 12-organization → 13-dashboard →
 * 14-account → 15-reports
 */
export default defineConfig({
  testDir: './e2e',

  /* Sequential execution — tests depend on prior data */
  fullyParallel: false,

  forbidOnly: !!process.env.CI,

  /* Retry once on failure */
  retries: 1,

  /* Single worker — tests must run in order */
  workers: 1,

  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    navigationTimeout: 30_000,
    actionTimeout: 10_000,
    /* Run headed (visible browser) with: HEADED=1 npx playwright test */
    headless: !process.env.HEADED,
  },

  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },

  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      timeout: 60_000,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.ts/,
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
