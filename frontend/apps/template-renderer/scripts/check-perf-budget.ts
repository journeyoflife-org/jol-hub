/**
 * Offline performance budget gate — STEP 13.
 *
 * Enforces the `budget.json` byte budgets WITHOUT a browser (the offline
 * development workspace has no Chrome; Lighthouse CI covers timing metrics
 * in environments that do — see `lighthouserc.js`).
 *
 * Measures the REAL gzipped first-load payload of every user-facing route
 * from `.next/` output:
 *   - per-route file sets from `.next/app-build-manifest.json`;
 *   - gzip level 9 sizes (conservative; brotli in nginx will do better);
 *   - legacy `noModule` polyfills excluded (modern-browser baseline).
 *
 * Exits non-zero when any route exceeds the JS/CSS budget — wire into CI
 * after `next build` (SOC 2 CC7.2 automated quality control).
 *
 * Run: `pnpm --filter template-renderer check-perf`
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  computeRouteFootprints,
  evaluateFootprints,
  formatGateReport,
  formatKiB,
  gzipSize,
  parseLighthouseBudgets,
  polyfillBytesFrom,
  resourceBudgetKiB,
  type AppBuildManifest,
} from '@jol-hub/perf';

const APP_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const NEXT_DIR = join(APP_DIR, '.next');

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

// 1. Budget contract -----------------------------------------------------------
const budgetPath = join(APP_DIR, 'budget.json');
if (!existsSync(budgetPath)) fail(`budget.json not found at ${budgetPath}`);

let budgets;
try {
  budgets = parseLighthouseBudgets(JSON.parse(readFileSync(budgetPath, 'utf-8')));
} catch (error) {
  fail(`budget.json is invalid: ${(error as Error).message}`);
}

const jsBudgetKiB = resourceBudgetKiB(budgets, 'script');
const cssBudgetKiB = resourceBudgetKiB(budgets, 'stylesheet');
if (!jsBudgetKiB || !cssBudgetKiB) {
  fail('budget.json must define `script` and `stylesheet` resource budgets');
}

// 2. Build output ---------------------------------------------------------------
const manifestPath = join(NEXT_DIR, 'app-build-manifest.json');
if (!existsSync(manifestPath)) {
  fail('`.next/app-build-manifest.json` missing — run `next build` first.');
}
const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as AppBuildManifest;

const readAsset = (relPath: string): Buffer | null => {
  const absolute = join(NEXT_DIR, relPath);
  return existsSync(absolute) ? readFileSync(absolute) : null;
};

// 3. Measure + evaluate ----------------------------------------------------------
const footprints = computeRouteFootprints(manifest, readAsset);
if (footprints.length === 0) fail('No user-facing routes found in the build manifest.');

// Legacy polyfills ship via `noModule` — excluded from the modern baseline.
const polyfillSizes: Record<string, number> = {};
for (const files of Object.values(manifest.pages)) {
  for (const file of files) {
    if (/polyfills/.test(file) && !(file in polyfillSizes)) {
      const content = readAsset(file);
      polyfillSizes[file] = content ? gzipSize(content) : 0;
    }
  }
}
const polyfillBytes = polyfillBytesFrom(polyfillSizes);

const result = evaluateFootprints(footprints, jsBudgetKiB, cssBudgetKiB, polyfillBytes);
console.log(formatGateReport(result, footprints, polyfillBytes));
console.log(`routes measured: ${footprints.length}   polyfill exclusion: ${formatKiB(polyfillBytes)}`);

process.exit(result.passed ? 0 : 1);
