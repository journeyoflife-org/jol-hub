/**
 * Alt-text checker — STEP 12 (WCAG 1.1.1).
 *
 * Rules:
 *   - every `<img>` carries an `alt` attribute (build fails otherwise);
 *   - decorative images use `alt=""` (optionally + aria-hidden);
 *   - elements with `role="img"` need an accessible name (aria-label).
 *
 * Pure string scan — attribute presence, not value semantics (axe covers
 * meaningful-alt heuristics separately).
 */
import type { A11yFinding } from '../types';

const IMG_RE = /<img\b[^>]*>/gi;
const ROLE_IMG_RE = /<[a-z][a-z0-9-]*\b[^>]*\brole="img"[^>]*>/gi;

export function checkAltText(html: string): A11yFinding[] {
  const findings: A11yFinding[] = [];

  for (const match of html.matchAll(IMG_RE)) {
    const tag = match[0];
    if (!/\balt\s*=/i.test(tag)) {
      findings.push({
        rule: 'alt-text',
        wcag: '1.1.1',
        severity: 'fail',
        message: 'Image missing alt attribute (use alt="" for decorative images).',
        snippet: tag.slice(0, 140),
      });
    }
  }

  for (const match of html.matchAll(ROLE_IMG_RE)) {
    const tag = match[0];
    if (!/\baria-label(ledby)?\s*=/i.test(tag)) {
      findings.push({
        rule: 'alt-text',
        wcag: '1.1.1',
        severity: 'fail',
        message: 'Element with role="img" lacks aria-label/aria-labelledby.',
        snippet: tag.slice(0, 140),
      });
    }
  }

  return findings;
}
