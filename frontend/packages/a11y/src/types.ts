/**
 * Shared a11y finding types — STEP 12.
 *
 * Structural checkers emit {@link A11yFinding}s; the axe runner maps
 * axe-core violations onto the same shape so every gate can consume ONE
 * report format.
 */

export type A11ySeverity = 'fail' | 'warn';

export interface A11yFinding {
  /** Checker rule id, e.g. `heading-hierarchy` or an axe rule id. */
  rule: string;
  /** WCAG success criterion reference, e.g. `1.3.1`. */
  wcag: string;
  severity: A11ySeverity;
  message: string;
  /** Offending markup (truncated by checkers). */
  snippet?: string;
}

/** Result of one page/document audit (axe + structural checkers). */
export interface A11yReport {
  /** URL or label of the audited surface. */
  target: string;
  violations: A11yFinding[];
  warnings: A11yFinding[];
  /** Number of axe rules that passed (informational). */
  axePasses: number;
  /** axe "needs review" items (jsdom limitations — human-reviewed). */
  axeIncomplete: number;
}

export function hasFailures(report: A11yReport): boolean {
  return report.violations.length > 0;
}
