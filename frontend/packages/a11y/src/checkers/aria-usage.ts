/**
 * ARIA usage + link-text checker — STEP 12 (WCAG 4.1.2, 2.4.4).
 *
 * RULES:
 *   - native HTML over ARIA: `role="button"` / `role="link"` on plain
 *     elements is a WARN (prefer <button>/<a>);
 *   - icon-only buttons MUST have an accessible name (aria-label /
 *     aria-labelledby / title / alt-bearing image) — FAIL otherwise;
 *   - focusable elements inside `aria-hidden="true"` are invisible to AT
 *     but reachable by keyboard — FAIL (4.1.2);
 *   - link text must be descriptive: "click here" / "read more" style
 *     placeholders FAIL (2.4.4 — context-independent text).
 *
 * DOM-based: pass a jsdom (or browser) `Document`.
 */
import type { A11yFinding } from '../types';

/** Non-descriptive link/CTA text (exact match, case-insensitive). */
const BANNED_LINK_TEXT = new Set([
  'click here',
  'here',
  'read more',
  'more',
  'link',
  'this link',
  'learn more',
  'details',
  'spaustele čia',
  'čia',
  'skaityti daugiau',
  'daugiau',
  'nuoroda',
  'нажмите здесь',
  'здесь',
  'читать далее',
  'далее',
  'ссылка',
]);

export function checkAriaUsage(document: Document): A11yFinding[] {
  const findings: A11yFinding[] = [];

  // 1. Div/span with interactive roles — native elements preferred.
  document.querySelectorAll('div[role="button"], span[role="button"], div[role="link"], span[role="link"]').forEach((el) => {
    findings.push({
      rule: 'aria-usage',
      wcag: '4.1.2',
      severity: 'warn',
      message: `role="${el.getAttribute('role')}" on <${el.tagName.toLowerCase()}> — prefer a native <button>/<a>.`,
      snippet: el.outerHTML.slice(0, 120),
    });
  });

  // 2. Icon-only buttons without an accessible name.
  document.querySelectorAll('button, a[role="button"]').forEach((node) => {
    const el = node as HTMLElement;
    const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
    if (text.length > 0) return; // has visible text
    const named =
      Boolean(el.getAttribute('aria-label')) ||
      Boolean(el.getAttribute('aria-labelledby')) ||
      Boolean(el.getAttribute('title')) ||
      el.querySelector('img[alt]:not([alt=""])') !== null ||
      el.querySelector('svg[aria-label], svg title') !== null;
    if (!named) {
      findings.push({
        rule: 'aria-usage',
        wcag: '4.1.2',
        severity: 'fail',
        message: 'Icon-only interactive element has no accessible name (add aria-label).',
        snippet: el.outerHTML.slice(0, 120),
      });
    }
  });

  // 3. Focusable content hidden from assistive tech.
  document.querySelectorAll('[aria-hidden="true"] a[href], [aria-hidden="true"] button, [aria-hidden="true"] input, [aria-hidden="true"] select, [aria-hidden="true"] textarea, [aria-hidden="true"] [tabindex="0"]').forEach((node) => {
    const el = node as HTMLElement;
    // tabindex="-1" removes the element from the tab order (e.g. honeypot
    // anti-spam fields): keyboard users cannot reach it, so it is NOT a
    // violation (matches axe's aria-hidden-focus behavior).
    if (el.getAttribute('tabindex') === '-1') return;
    findings.push({
      rule: 'aria-usage',
      wcag: '4.1.2',
      severity: 'fail',
      message: 'Focusable element inside aria-hidden="true" — keyboard users reach what screen readers cannot see.',
      snippet: el.outerHTML.slice(0, 120),
    });
  });

  // 4. Non-descriptive link text (2.4.4).
  document.querySelectorAll('a').forEach((node) => {
    const el = node as HTMLElement;
    const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
    if (text && BANNED_LINK_TEXT.has(text)) {
      findings.push({
        rule: 'link-text',
        wcag: '2.4.4',
        severity: 'fail',
        message: `Non-descriptive link text "${text}" — describe the destination.`,
        snippet: el.outerHTML.slice(0, 120),
      });
    }
  });

  return findings;
}
