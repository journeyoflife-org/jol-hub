/**
 * Budget evaluation + CI report — STEP 13.
 *
 * The build FAILS when any route's gzipped first-load JS or CSS exceeds the
 * budget (spec: JS < 200KB, CSS < 50KB initial). Polyfills shipped via
 * `noModule` (legacy browsers only) are excluded — modern evergreen browsers
 * are the measured baseline (documented in PERFORMANCE.md).
 */
import { bytesToKiB, formatKiB } from './measure';
import type { BudgetGateResult, RouteFootprint } from './types';

/** Legacy-browser-only chunks (Next emits them with `noModule`). */
const POLYFILL_RE = /polyfills/;

/**
 * Evaluate footprints against the KiB budgets. `polyfillGzipBytes` is
 * subtracted from each route's JS (legacy-only payload).
 */
export function evaluateFootprints(
  footprints: RouteFootprint[],
  jsBudgetKiB: number,
  cssBudgetKiB: number,
  polyfillGzipBytes = 0,
): BudgetGateResult {
  const failures: string[] = [];
  let worst: RouteFootprint | null = null;

  for (const footprint of footprints) {
    const adjusted: RouteFootprint = {
      ...footprint,
      jsGzipBytes: Math.max(0, footprint.jsGzipBytes - polyfillGzipBytes),
    };
    if (!worst || adjusted.jsGzipBytes > worst.jsGzipBytes) worst = adjusted;

    const jsKiB = bytesToKiB(adjusted.jsGzipBytes);
    const cssKiB = bytesToKiB(adjusted.cssGzipBytes);
    if (jsKiB > jsBudgetKiB) {
      failures.push(
        `${footprint.route}: initial JS ${jsKiB.toFixed(1)} KiB exceeds budget ${jsBudgetKiB} KiB`,
      );
    }
    if (cssKiB > cssBudgetKiB) {
      failures.push(
        `${footprint.route}: initial CSS ${cssKiB.toFixed(1)} KiB exceeds budget ${cssBudgetKiB} KiB`,
      );
    }
  }

  return { passed: failures.length === 0, jsBudgetKiB, cssBudgetKiB, worst, failures };
}

/** Human-readable gate report (CI log). */
export function formatGateReport(
  result: BudgetGateResult,
  footprints: RouteFootprint[],
  polyfillGzipBytes = 0,
): string {
  const lines: string[] = [];
  lines.push('performance budget gate (gzipped first-load transfer sizes)');
  lines.push('='.repeat(78));
  lines.push(`budgets: JS < ${result.jsBudgetKiB} KiB   CSS < ${result.cssBudgetKiB} KiB`);
  if (polyfillGzipBytes > 0) {
    lines.push(`legacy polyfills excluded (noModule): ${formatKiB(polyfillGzipBytes)}`);
  }
  lines.push('-'.repeat(78));

  const top = footprints.slice(0, 5);
  for (const footprint of top) {
    const js = footprint.jsGzipBytes - polyfillGzipBytes;
    lines.push(
      `${footprint.route.padEnd(44)} JS ${formatKiB(Math.max(0, js)).padStart(10)}   CSS ${formatKiB(footprint.cssGzipBytes).padStart(9)}`,
    );
  }
  if (footprints.length > top.length) {
    lines.push(`… and ${footprints.length - top.length} more route(s)`);
  }
  lines.push('-'.repeat(78));

  if (result.passed) {
    const worst = result.worst;
    lines.push(
      `PASS — worst route ${worst ? worst.route : '-'} at ${worst ? formatKiB(worst.jsGzipBytes) : '-' } JS / ${worst ? formatKiB(worst.cssGzipBytes) : '-'} CSS`,
    );
  } else {
    for (const failure of result.failures) lines.push(`[FAIL] ${failure}`);
  }
  return lines.join('\n');
}

/** Find the polyfill chunk size from a file map (name → gzipped bytes). */
export function polyfillBytesFrom(files: Record<string, number>): number {
  for (const [name, size] of Object.entries(files)) {
    if (POLYFILL_RE.test(name)) return size;
  }
  return 0;
}
