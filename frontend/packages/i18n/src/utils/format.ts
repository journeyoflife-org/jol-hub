import type { SupportedLocale } from '../types';

/**
 * Format a date according to the locale.
 */
export function formatDate(date: Date | string | number, locale: SupportedLocale = 'lt'): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  const formatOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  return new Intl.DateTimeFormat(getLocaleString(locale), formatOptions).format(d);
}

/**
 * Format a time according to the locale.
 */
export function formatTime(date: Date | string | number, locale: SupportedLocale = 'lt'): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  const formatOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  };

  return new Intl.DateTimeFormat(getLocaleString(locale), formatOptions).format(d);
}

/**
 * Format a date and time according to the locale.
 */
export function formatDateTime(
  date: Date | string | number,
  locale: SupportedLocale = 'lt'
): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  const formatOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  return new Intl.DateTimeFormat(getLocaleString(locale), formatOptions).format(d);
}

/**
 * Format a number according to the locale.
 */
export function formatNumber(value: number, locale: SupportedLocale = 'lt'): string {
  return new Intl.NumberFormat(getLocaleString(locale)).format(value);
}

/**
 * Format a currency value according to the locale.
 */
export function formatCurrency(
  value: number,
  currency: string = 'EUR',
  locale: SupportedLocale = 'lt'
): string {
  const formatOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
  };

  return new Intl.NumberFormat(getLocaleString(locale), formatOptions).format(value);
}

/**
 * Format a relative time (e.g., "2 days ago").
 */
export function formatRelativeTime(
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  locale: SupportedLocale = 'lt'
): string {
  const rtf = new Intl.RelativeTimeFormat(getLocaleString(locale), {
    numeric: 'auto',
  });
  return rtf.format(value, unit);
}

/**
 * Get the text direction for a locale.
 */
export function getLocaleDirection(_locale: SupportedLocale): 'ltr' | 'rtl' {
  // All supported locales are LTR
  return 'ltr';
}

/**
 * Get the full locale string for Intl APIs.
 */
function getLocaleString(locale: SupportedLocale): string {
  const localeMap: Record<SupportedLocale, string> = {
    lt: 'lt-LT',
    ru: 'ru-RU',
    en: 'en-US',
  };

  return localeMap[locale];
}
