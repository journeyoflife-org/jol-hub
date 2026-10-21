/**
 * Inline localized-field resolution for tenant/entity data.
 *
 * Complements the message-catalog pipeline in ./messages: catalogs map
 * translation KEYS to ICU strings, whereas tenant fixtures (seed-data,
 * spoke `tenant.json`) carry the translation INLINE as a per-locale object
 * (`{ lt, en?, ru? }`). This module resolves such an object to a string.
 *
 * PURE module (no react/i18next imports) — safe for edge runtime, server
 * components and client bundles alike, matching ./config.
 *
 * Policy (Phase 3 spec S3.2 Step 4): a locale silently falling back to
 * another is a BLOCKING FAILURE. `lt` is the mandatory source language
 * (DEFAULT_LOCALE); when a requested locale is absent and the `lt` value is
 * still unverified, a visible placeholder is returned instead of degrading
 * quietly.
 */
import type { SupportedLocale } from './types';
import { DEFAULT_LOCALE } from './types';

/**
 * Marker used by content editors for translations awaiting verification.
 * Its presence suppresses silent fallback (see module docs).
 */
export const TODO_MARKER = '[TODO: verify';

/**
 * A localized text field. `lt` is mandatory — it is DEFAULT_LOCALE and the
 * source language every other locale is verified against. All other
 * supported locales are optional.
 */
export type LocalizedText = { lt: string } & Partial<Record<SupportedLocale, string>>;

/**
 * Resolve a localized text object to a plain string for the given locale.
 *
 * Exact match always wins verbatim — including when it carries TODO_MARKER,
 * since that marker is then the editor's own published content, not a
 * silent substitution.
 */
export function resolveLocale(text: LocalizedText, locale: SupportedLocale): string {
  const exact = text[locale];
  if (exact !== undefined) return exact;

  // `lt` is required by LocalizedText and is DEFAULT_LOCALE.
  const fallback: string = text.lt;

  if (locale === DEFAULT_LOCALE) return fallback;

  if (fallback.includes(TODO_MARKER)) {
    return `[${locale.toUpperCase()} translation pending] ${fallback}`;
  }

  return fallback;
}
