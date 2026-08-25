/**
 * axe-core configuration — STEP 12.
 *
 * Single source of truth for the WCAG 2.2 AA rule set used by every audit
 * surface (ui showcase gate, renderer page gate, future E2E harness).
 *
 * RULE OVERRIDES — documented exceptions (rollback-strategy requirement):
 *   - `color-contrast` is DISABLED under jsdom: jsdom has no layout engine
 *     so computed colors cannot be resolved. Contrast compliance is enforced
 *     at the design-token level by `packages/ui/scripts/check-contrast.ts`
 *     (every documented foreground/background pair vs WCAG AA ratios). In a
 *     real-browser harness (Playwright) this rule MUST be re-enabled.
 *   - `landmark-one-main` is left ENABLED: every tenant page renders exactly
 *     one `<main>` (layout shell).
 */

/** axe tags covering WCAG 2.0–2.2 levels A + AA. */
export const AXE_WCAG_22_AA_TAGS: readonly string[] = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22aa',
];

/** axe rule overrides shared by all jsdom-based audits. */
export const AXE_JSDOM_RULE_OVERRIDES: Record<string, { enabled: boolean }> = {
  // jsdom cannot compute rendered colors — see header comment.
  'color-contrast': { enabled: false },
};

export interface AxeRunOptions {
  runOnly: { type: 'tag'; values: readonly string[] };
  rules: Record<string, { enabled: boolean }>;
}

/**
 * Build the axe.run() options. `browserHarness=true` re-enables rules that
 * jsdom cannot evaluate (use from Playwright-based E2E).
 */
export function buildAxeOptions(options?: { browserHarness?: boolean }): AxeRunOptions {
  return {
    runOnly: { type: 'tag', values: AXE_WCAG_22_AA_TAGS },
    rules: options?.browserHarness ? {} : { ...AXE_JSDOM_RULE_OVERRIDES },
  };
}
