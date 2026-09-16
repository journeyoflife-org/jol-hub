/**
 * i18n helpers for the template renderer (STEP 4).
 *
 * STEP 11: the relative `buildAlternates` lived here; it was replaced by the
 * ABSOLUTE canonical/hreflang builders in `lib/seo.tsx` (`@jol-hub/seo`)
 * and removed so relative alternates cannot regress back into metadata.
 */
import type { LocalizedText } from '@jol-hub/seed-data';
import type { SupportedLocale } from '@jol-hub/i18n';

/**
 * Pick the best available fixture translation. Fixtures are LT-first
 * ({ lt, en? }); missing translations fall back to Lithuanian rather than
 * hiding content (right to information — GDPR Art. 12).
 */
export function pickLocalized(text: LocalizedText, locale: SupportedLocale): string {
  if (locale === 'en' && text.en) return text.en;
  return text.lt;
}
