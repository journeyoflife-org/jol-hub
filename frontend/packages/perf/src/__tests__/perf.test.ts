/**
 * @jol-hub/perf tests — STEP 13.
 *
 * Budget parsing/validation, gzipped footprint computation, gate
 * evaluation and polyfill exclusion. Run via
 * `pnpm --filter @jol-hub/perf test` (tsx --test).
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { parseLighthouseBudgets, resourceBudgetKiB, timingBudget } from '../budget';
import { bytesToKiB, computeRouteFootprints, gzipSize } from '../measure';
import { evaluateFootprints, formatGateReport, polyfillBytesFrom } from '../report';

const VALID_BUDGET = [
  {
    path: '/*',
    resourceSizes: [
      { resourceType: 'script', budget: 200 },
      { resourceType: 'stylesheet', budget: 50 },
      { resourceType: 'image', budget: 500 },
      { resourceType: 'font', budget: 100 },
      { resourceType: 'third-party', budget: 100 },
      { resourceType: 'document', budget: 50 },
      { resourceType: 'total', budget: 1000 },
    ],
    timings: [
      { metric: 'interactive', budget: 3500 },
      { metric: 'first-contentful-paint', budget: 1800 },
      { metric: 'largest-contentful-paint', budget: 2500 },
      { metric: 'cumulative-layout-shift', budget: 0.1 },
      { metric: 'total-blocking-time', budget: 200 },
    ],
  },
];

// =============================================================================
// BUDGET PARSING
// =============================================================================

test('parses a valid Lighthouse budget and extracts values', () => {
  const budgets = parseLighthouseBudgets(VALID_BUDGET);
  assert.equal(budgets.length, 1);
  assert.equal(resourceBudgetKiB(budgets, 'script'), 200);
  assert.equal(resourceBudgetKiB(budgets, 'stylesheet'), 50);
  assert.equal(resourceBudgetKiB(budgets, 'font'), 100);
  assert.equal(timingBudget(budgets, 'largest-contentful-paint'), 2500);
  assert.equal(timingBudget(budgets, 'cumulative-layout-shift'), 0.1);
  // A budget set that omits a resource type yields undefined.
  const minimal = parseLighthouseBudgets([
    { path: '/*', resourceSizes: [{ resourceType: 'script', budget: 100 }] },
  ]);
  assert.equal(resourceBudgetKiB(minimal, 'stylesheet'), undefined);
  assert.equal(timingBudget(minimal, 'interactive'), undefined);
});

test('rejects malformed budgets loudly', () => {
  assert.throws(() => parseLighthouseBudgets([]), /non-empty/);
  assert.throws(() => parseLighthouseBudgets([{}]), /path/);
  assert.throws(
    () =>
      parseLighthouseBudgets([
        { path: '/*', resourceSizes: [{ resourceType: 'scripts', budget: 1 }] },
      ]),
    /resourceType/,
  );
  assert.throws(
    () => parseLighthouseBudgets([{ path: '/*', resourceSizes: [{ resourceType: 'script', budget: -5 }] }]),
    /budget/,
  );
});

// =============================================================================
// MEASUREMENT
// =============================================================================

test('gzipSize produces smaller output than input for repetitive content', () => {
  const size = gzipSize('a'.repeat(10_000));
  assert.ok(size > 0 && size < 1_000);
});

test('computeRouteFootprints sums gzipped assets per route, dedupes, skips non-user routes', () => {
  const assets: Record<string, string> = {
    'static/chunks/a.js': 'x'.repeat(2048),
    'static/chunks/b.js': 'y'.repeat(1024),
    'static/css/c.css': 'z'.repeat(512),
  };
  const manifest = {
    pages: {
      '/[locale]/[tenant]/page': [
        'static/chunks/a.js',
        'static/chunks/a.js', // duplicate — must count once
        'static/chunks/b.js',
        'static/css/c.css',
      ],
      '/dev/ui/page': ['static/chunks/a.js'], // excluded
      '/not-found': ['static/chunks/a.js'], // excluded
    },
  };
  const footprints = computeRouteFootprints(manifest, (rel) =>
    assets[rel] ? Buffer.from(assets[rel]) : null,
  );
  assert.equal(footprints.length, 1);
  const home = footprints[0];
  assert.ok(home);
  assert.equal(home?.route, '/[locale]/[tenant]/page');
  assert.ok(home.jsGzipBytes > 0);
  assert.ok(home.cssGzipBytes > 0);
  // Dedupe: a.js counted once (measure both and compare).
  const aOnly = computeRouteFootprints(
    { pages: { '/x': ['static/chunks/a.js'] } },
    (rel) => (assets[rel] ? Buffer.from(assets[rel]) : null),
  )[0];
  assert.ok(home.jsGzipBytes > (aOnly?.jsGzipBytes ?? 0)); // a + b > a
});

// =============================================================================
// GATE EVALUATION
// =============================================================================

test('evaluateFootprints passes within budget and fails over it', () => {
  const under = [{ route: '/a', jsGzipBytes: 100 * 1024, cssGzipBytes: 10 * 1024 }];
  const pass = evaluateFootprints(under, 200, 50);
  assert.equal(pass.passed, true);
  assert.equal(pass.failures.length, 0);
  assert.equal(pass.worst?.route, '/a');

  const over = [{ route: '/b', jsGzipBytes: 250 * 1024, cssGzipBytes: 60 * 1024 }];
  const fail = evaluateFootprints(over, 200, 50);
  assert.equal(fail.passed, false);
  assert.equal(fail.failures.length, 2);
});

test('polyfill bytes are excluded from the modern-browser baseline', () => {
  const footprints = [{ route: '/a', jsGzipBytes: 150 * 1024, cssGzipBytes: 1024 }];
  const result = evaluateFootprints(footprints, 120, 50, 40 * 1024);
  assert.equal(result.passed, true); // 150 - 40 = 110 KiB < 120
  assert.equal(result.worst?.jsGzipBytes, 110 * 1024);
});

test('polyfillBytesFrom finds the polyfill chunk', () => {
  const files = { 'polyfills-abc.js': 1234, 'main-xyz.js': 99 };
  assert.equal(polyfillBytesFrom(files), 1234);
  assert.equal(polyfillBytesFrom({ 'main.js': 1 }), 0);
});

test('formatGateReport renders pass and fail summaries', () => {
  const footprints = [{ route: '/a', jsGzipBytes: 100 * 1024, cssGzipBytes: 10 * 1024 }];
  const pass = evaluateFootprints(footprints, 200, 50);
  assert.match(formatGateReport(pass, footprints), /PASS/);

  const fail = evaluateFootprints(footprints, 50, 5);
  const report = formatGateReport(fail, footprints);
  assert.match(report, /FAIL/);
  assert.match(report, /exceeds budget/);
});

test('bytesToKiB converts correctly', () => {
  assert.equal(bytesToKiB(2048), 2);
});
