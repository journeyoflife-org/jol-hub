/**
 * Focus-order checker — STEP 12 (WCAG 2.4.3).
 *
 * Rules:
 *   - POSITIVE tabindex is forbidden — it creates a focus order that
 *     diverges from the visual/DOM order and is nearly always a bug;
 *   - `tabindex="0"` (natural order) and `tabindex="-1"` (programmatic
 *     focus only) are legitimate.
 *
 * Focus order itself (matching visual order) is verified in the manual
 * audit — a static checker cannot see layout.
 */
import type { A11yFinding } from '../types';

const TABINDEX_RE = /\btabindex\s*=\s*["']?\s*(\d+)/gi;

export function checkFocusOrder(html: string): A11yFinding[] {
  const findings: A11yFinding[] = [];

  for (const match of html.matchAll(TABINDEX_RE)) {
    const value = Number(match[1]);
    if (value > 0) {
      findings.push({
        rule: 'focus-order',
        wcag: '2.4.3',
        severity: 'fail',
        message: `Positive tabindex (${value}) — focus order must follow DOM order; use tabindex="0" or restructure.`,
      });
    }
  }

  return findings;
}
