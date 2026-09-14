/**
 * @jol-hub/perf — Core Web Vitals budget core (STEP 13).
 *
 * Lighthouse-format budget parsing, gzipped transfer-size measurement of
 * Next.js build output, and the CI gate report. Consumed by
 * `apps/template-renderer/scripts/check-perf-budget.ts` (offline gate) and
 * documented for Lighthouse CI (`lighthouserc.js`).
 *
 * Hardware context: on-prem Proxmox on Dell R640 — no cloud CDN; transfer
 * size and server response time dominate, hence HARD byte budgets.
 */
export * from './types';
export { parseLighthouseBudgets, resourceBudgetKiB, timingBudget } from './budget';
export {
  bytesToKiB,
  computeRouteFootprints,
  formatKiB,
  gzipSize,
  type AppBuildManifest,
  type AssetReader,
} from './measure';
export {
  evaluateFootprints,
  formatGateReport,
  polyfillBytesFrom,
} from './report';
