/**
 * Performance budget model — STEP 13.
 *
 * JOL runs on modest on-prem hardware (Dell R640, Proxmox — no cloud CDN),
 * so transfer size budgets are enforced HARD in CI. The canonical budget
 * lives in `apps/template-renderer/budget.json` in the STANDARD Lighthouse
 * budget format (resourceSizes in KiB), so one file drives both:
 *   - Lighthouse CI (Chrome environments) via `lighthouserc.js`;
 *   - the offline build gate (`scripts/check-perf-budget.ts`) which
 *     measures real gzipped bytes from `.next/` output.
 *
 * Pure and framework-agnostic; unit-tested.
 */

/** Lighthouse budget resource types (subset we budget). */
export type BudgetResourceType =
  | 'script'
  | 'stylesheet'
  | 'image'
  | 'font'
  | 'third-party'
  | 'document'
  | 'total';

/** Lighthouse timing metrics we budget (values in ms; CLS is unitless). */
export type BudgetTimingMetric =
  | 'interactive'
  | 'first-contentful-paint'
  | 'largest-contentful-paint'
  | 'cumulative-layout-shift'
  | 'total-blocking-time';

export interface ResourceSizeBudget {
  resourceType: BudgetResourceType;
  /** Kilobytes (Lighthouse convention — KiB in practice). */
  budget: number;
}

export interface TimingBudget {
  metric: BudgetTimingMetric;
  budget: number;
}

export interface LighthouseBudget {
  path: string;
  resourceSizes: ResourceSizeBudget[];
  timings?: TimingBudget[];
}

/** Per-route first-load footprint measured from build output. */
export interface RouteFootprint {
  route: string;
  /** Gzipped bytes of all JS loaded for this route's first paint. */
  jsGzipBytes: number;
  /** Gzipped bytes of CSS loaded for this route's first paint. */
  cssGzipBytes: number;
}

/** Result of evaluating footprints against the budget. */
export interface BudgetGateResult {
  passed: boolean;
  /** Kilobytes allowed for initial JS (gzipped). */
  jsBudgetKiB: number;
  /** Kilobytes allowed for initial CSS (gzipped). */
  cssBudgetKiB: number;
  /** Worst (largest) route footprint — the one that gates the build. */
  worst: RouteFootprint | null;
  failures: string[];
}
