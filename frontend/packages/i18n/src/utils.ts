/**
 * Locale-aware formatting utilities (STEP 4).
 *
 * All user-visible dates/numbers/currency MUST go through these (or the
 * useLocale hook) — never `toLocaleString()` without a locale, never
 * hand-rolled separators.
 *
 * Regional formatting tags (Intl) are deliberately separated from hreflang
 * tags (SEO, see LOCALE_HREFLANG in config.ts): content targets Lithuania
 * (hreflang lt-LT/en-LT/ru-LT) while number/date conventions follow the
 * language's canonical region.
 *
 * Currency: EUR for the whole pilot; formatted per locale
 * (lt: "1 234,56 €", en: "€1,234.56", ru: "1 234,56 €").
 */
import type { SupportedLocale } from './types';
import { DEFAULT_LOCALE } from './types';

export { getLocaleDirection } from './utils/format';

/** Canonical Intl region tags per locale. */
export const INTL_TAGS: Record<SupportedLocale, string> = {
  lt: 'lt-LT',
  en: 'en-GB',
  ru: 'ru-RU',
};

function normalizeDate(date: Date | string | number): Date {
  return typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
}

/**
 * Locale-aware date. Default style is the Lithuanian long form
 * (lt: "2026 m. rugpjūčio 25 d."). Pass Intl options for other styles,
 * e.g. `{ year: 'numeric', month: '2-digit', day: '2-digit' }` for
 * ISO-like YYYY-MM-DD output.
 */
export function formatDate(
  date: Date | string | number,
  locale: SupportedLocale = DEFAULT_LOCALE,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' },
): string {
  return new Intl.DateTimeFormat(INTL_TAGS[locale], options).format(normalizeDate(date));
}

/** Locale-aware time (24-hour clock for all pilot locales). */
export function formatTime(
  date: Date | string | number,
  locale: SupportedLocale = DEFAULT_LOCALE,
  options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' },
): string {
  return new Intl.DateTimeFormat(INTL_TAGS[locale], options).format(normalizeDate(date));
}

/** Locale-aware date + time. */
export function formatDateTime(
  date: Date | string | number,
  locale: SupportedLocale = DEFAULT_LOCALE,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  },
): string {
  return new Intl.DateTimeFormat(INTL_TAGS[locale], options).format(normalizeDate(date));
}

/** Locale-aware number (grouping + decimal separators per locale). */
export function formatNumber(
  value: number,
  locale: SupportedLocale = DEFAULT_LOCALE,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(INTL_TAGS[locale], options).format(value);
}

/** Locale-aware currency — always EUR in the pilot unless stated otherwise. */
export function formatCurrency(
  amount: number,
  locale: SupportedLocale = DEFAULT_LOCALE,
  currency = 'EUR',
  options?: Omit<Intl.NumberFormatOptions, 'style' | 'currency'>,
): string {
  return new Intl.NumberFormat(INTL_TAGS[locale], { ...options, style: 'currency', currency }).format(amount);
}
