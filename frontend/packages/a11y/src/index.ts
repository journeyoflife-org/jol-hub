/**
 * @jol-hub/a11y — WCAG 2.2 AA core (STEP 12).
 *
 * axe-core configuration, jsdom audit runner, structural checkers and the
 * WCAG 2.2 AA criteria register. Consumed by the ui showcase gate, the
 * template-renderer page gate (`scripts/check-a11y-pages.ts`) and the
 * future Playwright E2E harness.
 *
 * Legal driver: EU Accessibility Act (EAA) 2025.
 */
export * from './types';
export * from './constants';
export * from './axe-config';
export { auditHtml, assertCleanAudit, formatReport, type AuditOptions } from './test-utils';
export { checkHeadingHierarchy } from './checkers/heading-hierarchy';
export { checkAltText } from './checkers/alt-text';
export { checkFocusOrder } from './checkers/focus-order';
export { checkFormLabels } from './checkers/form-labels';
export { checkAriaUsage } from './checkers/aria-usage';
export {
  AA_LARGE_TEXT,
  AA_NON_TEXT,
  AA_NORMAL_TEXT,
  contrastRatio,
  meetsWcagAA,
  parseHex,
  relativeLuminance,
} from './checkers/color-contrast';
