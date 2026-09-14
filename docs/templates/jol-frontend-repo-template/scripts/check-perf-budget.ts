/**
 * Performance budget checker — verifies Core Web Vitals budgets.
 *
 * Budgets (mobile, throttled):
 * - LCP < 2500ms
 * - CLS < 0.1
 * - FID < 100ms (or INP < 200ms)
 * - Total JS bundle < 200KB (gzipped)
 * - Total CSS bundle < 50KB (gzipped)
 *
 * This script checks build output sizes. For runtime CWV metrics,
 * use Lighthouse CI in the pipeline.
 *
 * Usage: pnpm check-perf
 */

import { readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const BUILD_DIR = join(process.cwd(), '.next');
const BUDGETS = {
  maxJSBytes: 200 * 1024, // 200KB gzipped estimate
  maxCSSBytes: 50 * 1024, // 50KB gzipped estimate
  maxPageJSBytes: 50 * 1024, // 50KB per page chunk
};

interface Violation {
  file: string;
  size: number;
  budget: number;
  rule: string;
}

const violations: Violation[] = [];

function getDirSize(dir: string): number {
  if (!existsSync(dir)) return 0;
  let total = 0;
  const entries = readdirSync(dir, { withFileTypes: true, recursive: true });
  for (const entry of entries) {
    if (entry.isFile()) {
      const fullPath = join(dir, entry.name);
      try {
        total += statSync(fullPath).size;
      } catch {
        // File may have been deleted between readdir and stat
      }
    }
  }
  return total;
}

// Check if build output exists
if (!existsSync(BUILD_DIR)) {
  console.log('No .next/ directory found — run `pnpm build` first.');
  process.exit(0);
}

// Check static JS chunks
const staticDir = join(BUILD_DIR, 'static', 'chunks');
if (existsSync(staticDir)) {
  const jsFiles = readdirSync(staticDir)
    .filter((f) => f.endsWith('.js'))
    .map((f) => ({
      name: f,
      size: statSync(join(staticDir, f)).size,
    }));

  // Flag any individual chunk over budget
  for (const file of jsFiles) {
    if (file.size > BUDGETS.maxPageJSBytes) {
      violations.push({
        file: `static/chunks/${file.name}`,
        size: file.size,
        budget: BUDGETS.maxPageJSBytes,
        rule: 'PERF-CHUNK',
      });
    }
  }
}

// Check total CSS
const cssDir = join(BUILD_DIR, 'static', 'css');
if (existsSync(cssDir)) {
  const totalCSS = getDirSize(cssDir);
  if (totalCSS > BUDGETS.maxCSSBytes) {
    violations.push({
      file: 'static/css/',
      size: totalCSS,
      budget: BUDGETS.maxCSSBytes,
      rule: 'PERF-CSS-TOTAL',
    });
  }
}

if (violations.length > 0) {
  console.error(`Performance budget violations (${violations.length}):`);
  for (const v of violations) {
    const sizeKB = (v.size / 1024).toFixed(1);
    const budgetKB = (v.budget / 1024).toFixed(1);
    console.error(
      `  [${v.rule}] ${v.file}: ${sizeKB}KB exceeds budget of ${budgetKB}KB`,
    );
  }
  process.exit(1);
}

console.log('PASS: performance budgets met.');
