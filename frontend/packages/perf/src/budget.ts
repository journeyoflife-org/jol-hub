/**
 * Lighthouse budget file parsing/validation — STEP 13.
 *
 * Defensive parser: `budget.json` is a CI contract, so malformed input
 * fails LOUDLY (a silently ignored budget protects nothing).
 */
import type {
  BudgetResourceType,
  BudgetTimingMetric,
  LighthouseBudget,
  ResourceSizeBudget,
  TimingBudget,
} from './types';

const RESOURCE_TYPES: readonly string[] = [
  'script',
  'stylesheet',
  'image',
  'font',
  'third-party',
  'document',
  'total',
];

const TIMING_METRICS: readonly string[] = [
  'interactive',
  'first-contentful-paint',
  'largest-contentful-paint',
  'cumulative-layout-shift',
  'total-blocking-time',
];

/** Parse + validate a Lighthouse-format budget file payload. */
export function parseLighthouseBudgets(raw: unknown): LighthouseBudget[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error('budget.json must be a non-empty array of budget objects');
  }

  return raw.map((entry, index) => {
    if (typeof entry !== 'object' || entry === null) {
      throw new Error(`budget[${index}] must be an object`);
    }
    const item = entry as Record<string, unknown>;
    if (typeof item.path !== 'string' || item.path.length === 0) {
      throw new Error(`budget[${index}].path must be a non-empty string`);
    }
    if (!Array.isArray(item.resourceSizes)) {
      throw new Error(`budget[${index}].resourceSizes must be an array`);
    }

    const resourceSizes: ResourceSizeBudget[] = item.resourceSizes.map((size, sizeIndex) => {
      const s = size as Record<string, unknown>;
      if (typeof s.resourceType !== 'string' || !RESOURCE_TYPES.includes(s.resourceType)) {
        throw new Error(`budget[${index}].resourceSizes[${sizeIndex}].resourceType invalid`);
      }
      if (typeof s.budget !== 'number' || s.budget <= 0) {
        throw new Error(`budget[${index}].resourceSizes[${sizeIndex}].budget must be > 0`);
      }
      return { resourceType: s.resourceType as BudgetResourceType, budget: s.budget };
    });

    const timings: TimingBudget[] | undefined = Array.isArray(item.timings)
      ? item.timings.map((timing, timingIndex) => {
          const t = timing as Record<string, unknown>;
          if (typeof t.metric !== 'string' || !TIMING_METRICS.includes(t.metric)) {
            throw new Error(`budget[${index}].timings[${timingIndex}].metric invalid`);
          }
          if (typeof t.budget !== 'number' || t.budget <= 0) {
            throw new Error(`budget[${index}].timings[${timingIndex}].budget must be > 0`);
          }
          return { metric: t.metric as BudgetTimingMetric, budget: t.budget };
        })
      : undefined;

    return { path: item.path, resourceSizes, timings };
  });
}

/** Extract one resource budget (KiB) from a parsed budget set. */
export function resourceBudgetKiB(
  budgets: LighthouseBudget[],
  resourceType: BudgetResourceType,
): number | undefined {
  for (const budget of budgets) {
    const entry = budget.resourceSizes.find((size) => size.resourceType === resourceType);
    if (entry) return entry.budget;
  }
  return undefined;
}

/** Extract one timing budget from a parsed budget set. */
export function timingBudget(
  budgets: LighthouseBudget[],
  metric: BudgetTimingMetric,
): number | undefined {
  for (const budget of budgets) {
    const entry = budget.timings?.find((timing) => timing.metric === metric);
    if (entry) return entry.budget;
  }
  return undefined;
}
