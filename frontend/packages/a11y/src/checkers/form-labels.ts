/**
 * Form-label checker — STEP 12 (WCAG 1.3.1, 3.3.2, 4.1.2).
 *
 * Every text-input control must have a programmatically associated label:
 *   - `<label for="id">` matching the control id, OR
 *   - a wrapping `<label>`, OR
 *   - `aria-label` / `aria-labelledby`.
 *
 * Honeypot fields (anti-spam, `tabindex="-1"` + aria-hidden) are EXEMPT —
 * they must stay invisible to assistive tech, which is exactly what the
 * aria-hidden + tabIndex=-1 pattern achieves (the accessible alternative
 * to visual CAPTCHAs, WCAG 3.3.8).
 *
 * DOM-based: pass a jsdom (or browser) `Document`.
 */
import type { A11yFinding } from '../types';

const LABELED_SELECTOR =
  'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]), select, textarea';

export function checkFormLabels(document: Document): A11yFinding[] {
  const findings: A11yFinding[] = [];
  const controls = document.querySelectorAll(LABELED_SELECTOR);

  controls.forEach((control) => {
    const element = control as HTMLElement & { id?: string; name?: string };

    // Honeypot exemption — intentionally unreachable + hidden from AT.
    const hidden =
      element.getAttribute('aria-hidden') === 'true' ||
      element.tabIndex === -1 ||
      Boolean(element.closest('[aria-hidden="true"]'));
    if (hidden) return;

    const hasExplicitLabel =
      Boolean(element.id) && document.querySelector(`label[for="${CSS_id(element.id!)}"]`) !== null;
    const hasWrappedLabel = element.closest('label') !== null;
    const hasAriaName =
      Boolean(element.getAttribute('aria-label')) ||
      Boolean(element.getAttribute('aria-labelledby'));
    const hasTitle = Boolean(element.getAttribute('title'));

    if (hasExplicitLabel || hasWrappedLabel || hasAriaName) {
      return; // Programmatically labeled — compliant.
    }

    if (hasTitle) {
      findings.push({
        rule: 'form-labels',
        wcag: '3.3.2',
        severity: 'warn',
        message: 'Form control labeled only via title attribute — prefer a visible <label>.',
      });
    } else {
      findings.push({
        rule: 'form-labels',
        wcag: '3.3.2',
        severity: 'fail',
        message: `Form control <${element.tagName.toLowerCase()}${element.name ? ` name="${element.name}"` : ''}> has no associated label.`,
        snippet: element.outerHTML.slice(0, 140),
      });
    }
  });

  return findings;
}

/** Escape an id for use in a CSS attribute selector. */
function CSS_id(id: string): string {
  return id.replace(/["\\]/g, '\\$&');
}
