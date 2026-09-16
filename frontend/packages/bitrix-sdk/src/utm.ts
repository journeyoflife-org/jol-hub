/**
 * UTM capture + sanitization — STEP 9.
 *
 * Contact-form leads carry attribution (utm_source/medium/campaign/term/
 * content) from the submitting page URL. UTM values are attacker-controllable
 * query strings, so they are SANITIZED before leaving the browser
 * (injection defence) and again the rendered UI escapes them (React).
 *
 * Sanitization rules:
 *   - strip control characters (U+0000–U+001F, U+007F);
 *   - strip HTML tag delimiters (`<`, `>`) to defeat stored-markup injection
 *     in downstream CRMs;
 *   - trim outer whitespace;
 *   - cap length (200 chars — no legitimate UTM exceeds this);
 *   - empty results are dropped (undefined), never sent as ''.
 *
 * Pure functions — fully unit-testable.
 */
import type { UtmParams } from './crm-types';

/** Maximum sanitized length of a single UTM value. */
export const UTM_MAX_LENGTH = 200;

/** The query parameters we capture, mapped to UtmParams fields. */
const UTM_FIELDS = [
  ['utm_source', 'source'],
  ['utm_medium', 'medium'],
  ['utm_campaign', 'campaign'],
  ['utm_term', 'term'],
  ['utm_content', 'content'],
] as const;

/** Sanitize a single raw UTM value. Returns undefined when nothing remains. */
export function sanitizeUtmValue(raw: string | null | undefined): string | undefined {
  if (raw == null) return undefined;
  // eslint-disable-next-line no-control-regex
  const cleaned = raw.replace(/[\u0000-\u001f\u007f]/g, '').replace(/[<>]/g, '').trim();
  if (cleaned.length === 0) return undefined;
  return cleaned.slice(0, UTM_MAX_LENGTH);
}

/**
 * Extract sanitized UTM params from a URLSearchParams (or a full query string).
 * Only fields with a non-empty sanitized value are included.
 */
export function captureUtm(input: URLSearchParams | string): UtmParams {
  const params = typeof input === 'string' ? new URLSearchParams(input) : input;
  const utm: UtmParams = {};
  for (const [param, field] of UTM_FIELDS) {
    const value = sanitizeUtmValue(params.get(param));
    if (value !== undefined) utm[field] = value;
  }
  return utm;
}
