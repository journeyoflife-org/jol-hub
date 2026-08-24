/**
 * i18n helpers for the template renderer (STEP 4).
 */
import type { LocalizedText } from '@jol-hub/seed-data';
import { LOCALE_HREFLANG, SUPPORTED_LOCALES } from '@jol-hub/i18n';
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

/**
 * hreflang alternates for a tenant page. One entry per supported locale
 * (BCP-47 regional tags) + x-default → lt.
 *
 * SECURITY: alternates only ever reference the SAME tenant across locales —
 * no cross-tenant enumeration (GDPR Art. 9 / SOC 2 CC6.1).
 */
export function buildAlternates(
  tenantSlug: string,
  route: string,
): { canonical: string; languages: Record<string, string> } {
  const path = route === '/' ? '' : route;
  const languages: Record<string, string> = {};
  for (const locale of SUPPORTED_LOCALES) {
    languages[LOCALE_HREFLANG[locale]] = `/${locale}/${tenantSlug}${path}`;
  }
  languages['x-default'] = `/lt/${tenantSlug}${path}`;
  return { canonical: `/lt/${tenantSlug}${path}`, languages };
}
