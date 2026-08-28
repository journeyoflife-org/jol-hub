/**
 * hreflang alternates — STEP 11.
 *
 * Pilot matrix: lt-LT, en-LT, ru-LT with `x-default` → Lithuanian (primary).
 * Future: full 27-locale EU matrix (per-country hreflang codes).
 *
 * RECIPROCITY (hard rule): every localized page emits the SAME complete set
 * of alternates, so if A links B then B links A by construction. The
 * {@link verifyHreflangReciprocity} helper audits arbitrary page sets.
 */
import { absoluteCanonical, normalizeRoute } from './canonical';
import type { HreflangLocale } from './types';

/** The locale that x-default points to (primary market). */
export const X_DEFAULT_LOCALE = 'lt';

/** Pilot locale → hreflang matrix. */
export const PILOT_HREFLANG: readonly HreflangLocale[] = [
  { locale: 'lt', hreflang: 'lt-LT' },
  { locale: 'en', hreflang: 'en-LT' },
  { locale: 'ru', hreflang: 'ru-LT' },
];

export interface HreflangSet {
  /** Absolute canonical for the current locale. */
  canonical: string;
  /** hreflang code → absolute URL (includes x-default). */
  languages: Record<string, string>;
}

/**
 * Build the complete ABSOLUTE hreflang set for one tenant page. All URLs are
 * canonical-shaped (no query params, normalized slashes).
 */
export function buildHreflangSet(
  origin: string,
  tenantSlug: string,
  route: string,
  currentLocale: string,
  locales: readonly HreflangLocale[] = PILOT_HREFLANG,
  xDefaultLocale: string = X_DEFAULT_LOCALE,
): HreflangSet {
  const path = normalizeRoute(route);
  const tenantPath = (locale: string): string =>
    path === '/' ? `/${locale}/${tenantSlug}` : `/${locale}/${tenantSlug}${path}`;

  const languages: Record<string, string> = {};
  for (const entry of locales) {
    languages[entry.hreflang] = absoluteCanonical(origin, tenantPath(entry.locale));
  }
  const xDefault = locales.find((entry) => entry.locale === xDefaultLocale);
  if (xDefault) {
    languages['x-default'] = absoluteCanonical(origin, tenantPath(xDefault.locale));
  }

  const known = locales.some((entry) => entry.locale === currentLocale);
  const canonicalLocale = known ? currentLocale : xDefaultLocale;
  return {
    canonical: absoluteCanonical(origin, tenantPath(canonicalLocale)),
    languages,
  };
}

/**
 * Audit reciprocity across a set of pages: for every URL in every page's
 * alternate set, that URL's own alternate set must link back. Returns the
 * list of violations (empty = healthy).
 */
export function verifyHreflangReciprocity(pages: HreflangSet[]): string[] {
  const violations: string[] = [];
  const byUrl = new Map<string, HreflangSet>();
  for (const page of pages) byUrl.set(page.canonical, page);

  for (const page of pages) {
    for (const target of Object.values(page.languages)) {
      const targetPage = byUrl.get(target);
      if (!targetPage) {
        violations.push(`missing target page: ${target}`);
        continue;
      }
      if (!Object.values(targetPage.languages).includes(page.canonical)) {
        violations.push(`${target} does not link back to ${page.canonical}`);
      }
    }
  }
  return violations;
}
