/**
 * i18n configuration — STEP 4 (27-locale architecture, LT/EN/RU pilot).
 *
 * Design decisions (documented in packages/i18n/README.md):
 * - Pilot locales: lt (primary/default), en, ru. Adding a locale is a
 *   data change (message files + one array entry) — never a redesign.
 * - Poland (pl) is an OPEN QUESTION: declared in PLANNED_LOCALES but
 *   intentionally NOT enabled.
 * - This module is PURE (no i18next/react imports) so it is safe for the
 *   edge runtime, server components and client bundles alike. The legacy
 *   i18next runtime lives in ./i18next.
 * - The SupportedLocale union lives in ./types (single source of truth);
 *   this module re-exports it so `import { ... } from config` is complete.
 */
import type { SupportedLocale } from './types';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, LOCALE_CONFIGS } from './types';

/* ========================================================================== */
/* STEP 4 canonical constants                                                 */
/* ========================================================================== */

/** Re-exported so config is the single import surface required by STEP 4. */
export { DEFAULT_LOCALE, SUPPORTED_LOCALES, LOCALE_CONFIGS };
export type { SupportedLocale };

/** Native names, used by the locale switcher (never translate these). */
export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  lt: 'Lietuvių',
  en: 'English',
  ru: 'Русский',
};

/** URL path prefixes for the locale-prefixed routing strategy. */
export const LOCALE_PREFIXES: Record<SupportedLocale, `/${SupportedLocale}`> = {
  lt: '/lt',
  en: '/en',
  ru: '/ru',
};

/** BCP-47 regional tags used for hreflang / og:locale. */
export const LOCALE_HREFLANG: Record<SupportedLocale, string> = {
  lt: 'lt-LT',
  en: 'en-LT',
  ru: 'ru-LT',
};

/** Cookie carrying the user's explicit language choice. Strictly-necessary
 *  preference cookie — no consent banner required (e-Privacy Art. 5(3)
 *  user-input exception); documented in the cookie policy regardless. */
export const LOCALE_COOKIE = 'jol-hub-locale';

/** Request header carrying the resolved locale downstream (set by the
 *  locale middleware; read by root layout and server components). */
export const LOCALE_HEADER = 'x-locale';

/**
 * Negotiation fallback chain: an unsupported locale request never 404s —
 * resolution falls back ru → en → lt (STEP 4 requirement). In practice
 * resolution short-circuits on the first supported match; the chain
 * documents the intent and order for future regional variants.
 */
export const FALLBACK_ORDER: readonly SupportedLocale[] = ['ru', 'en', 'lt'];

/**
 * OPEN QUESTION — Poland (pl). Declared so the extension point is explicit,
 * but NOT in SUPPORTED_LOCALES: no routing, no messages, no detection.
 * Enabling = add messages/pl.json + move 'pl' into SUPPORTED_LOCALES.
 */
export const PLANNED_LOCALES = ['pl'] as const;
export type PlannedLocale = (typeof PLANNED_LOCALES)[number];
/** Full horizon type — superset used by code that must anticipate scale. */
export type LocaleCode = SupportedLocale | PlannedLocale;

/** Type guard for the pilot set (runtime input is always `string`). */
export function isSupportedLocale(value: string | null | undefined): value is SupportedLocale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/* ========================================================================== */
/* Path helpers                                                               */
/* ========================================================================== */

/**
 * Get locale from URL path.
 * Extracts /lt/, /ru/, /en/ from pathname.
 */
export function getLocaleFromPath(pathname: string): SupportedLocale | null {
  const match = pathname.match(/^\/(lt|ru|en)(?:\/|$)/);
  if (match && isSupportedLocale(match[1])) {
    return match[1];
  }
  return null;
}

/**
 * Add locale prefix to path.
 */
export function localizePath(path: string, locale: SupportedLocale): string {
  // Remove existing locale prefix if present
  const cleanPath = path.replace(/^\/(lt|ru|en)\//, '/');

  // Don't add locale for default if it's the root
  if (locale === DEFAULT_LOCALE && cleanPath === '/') {
    return cleanPath;
  }

  return `/${locale}${cleanPath}`;
}
