/**
 * Lighthouse CI configuration — STEP 13 (Core Web Vitals budgets).
 *
 * Runs in CI environments where Chrome is available (GitHub runners /
 * a Chromium-equipped stage box). In the OFFLINE development workspace the
 * byte-budget gate is enforced by `pnpm check-perf` instead
 * (`scripts/check-perf-budget.ts` + `@jol-hub/perf`), which measures the
 * real gzipped `.next/` output without a browser.
 *
 * Budgets come from `budget.json` (standard Lighthouse budget format —
 * single source of truth for both gates).
 *
 * HARDWARE CONTEXT: audits emulate a mid-tier mobile device on 4G against
 * an on-prem Dell R640 server (no cloud CDN). Targets: performance ≥ 0.90,
 * LCP < 2.5s, TBT < 200ms, CLS < 0.1.
 *
 * Run manually: `npx @lhci/cli autorun` (requires Chrome + @lhci/cli).
 */
module.exports = {
  ci: {
    collect: {
      // Serve the production build (build happens in the CI pipeline first).
      startServerCommand: 'npx next start --port 3121',
      startServerReadyPattern: 'Ready',
      startServerReadyTimeout: 60_000,
      numberOfRuns: 3, // modest hardware — keep the run time sane
      url: [
        'http://localhost:3121/lt/parish-st-john-vilnius',
        'http://localhost:3121/lt/parish-st-john-vilnius/about',
        'http://localhost:3121/lt/parish-st-john-vilnius/contact',
        'http://localhost:3121/lt/parish-st-john-vilnius/news',
        'http://localhost:3121/lt/parish-st-john-vilnius/accessibility-statement',
      ],
      settings: {
        // Default emulation is MOBILE (spec: Lighthouse ≥ 90 mobile).
        // Pilot addressing is header-based (subdomains arrive with domains);
        // without these the tenant gate rewrites to the 404 route.
        extraHeaders: JSON.stringify([
          {
            matches: ['http://localhost:3121/*'],
            headers: [
              { name: 'x-tenant', value: 'parish-st-john-vilnius' },
              { name: 'x-forwarded-proto', value: 'https' },
              { name: 'x-forwarded-host', value: 'gyvenimo-kelias.lt' },
            ],
          },
        ]),
        chromeFlags: '--no-sandbox --headless=new',
        skipAudits: ['uses-http2'], // served by `next start`; http2 is nginx's job
      },
    },
    assert: {
      budgetsFile: './budget.json',
      assertions: {
        // Score floors (mobile emulation — the default Lighthouse form factor).
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        // Core Web Vitals floors (defense in depth alongside budgetsFile).
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        interactive: ['error', { maxNumericValue: 3500 }],
      },
    },
    upload: {
      // No external LHCI server in the pilot — keep reports on the runner.
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
};
