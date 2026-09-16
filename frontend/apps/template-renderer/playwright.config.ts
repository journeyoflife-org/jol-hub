/**
 * Playwright configuration — STEP 15 (E2E tier).
 *
 * Spec requirements: Chromium/Firefox/WebKit(mobile) projects, 4 parallel
 * workers, 2 retries in CI (flakes get quarantined, not retried forever),
 * screenshots + video on failure.
 *
 * The suite runs against the built app (`next start`), seeded with the
 * fixture tenant `parish-st-john-vilnius` (registry fixtures — STEP 6).
 * Browser binaries need `npx playwright install` (network) — unavailable
 * on the offline build host, where this tier is config-only by design.
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // < 5 minutes total budget (spec) — each flow is a single focused spec.
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  workers: 4,
  retries: process.env.CI ? 2 : 0,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',

  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Tenant resolution in tests travels the SAME headers production uses.
    extraHTTPHeaders: {
      'x-forwarded-proto': 'https',
    },
  },

  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'desktop-firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'mobile-webkit',
      use: { ...devices['iPhone 13'] },
    },
  ],

  webServer: {
    command: 'pnpm run build && pnpm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
