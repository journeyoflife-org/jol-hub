/**
 * Collection list-page view helpers — STEP 6.
 *
 * Pure, server-side utilities shared by the news/events/services list routes.
 * Filters + pagination are driven by `searchParams` (GET semantics), which
 * keeps the pages fully server-rendered and progressively enhanced — no
 * client JS is required to filter or paginate (WCAG 2.2 / SSR contract).
 */
import { LOCALE_HREFLANG } from '@jol-hub/i18n';
import type { SupportedLocale } from '@jol-hub/i18n';

/** Next.js page `searchParams` prop shape. */
export type SearchParams = { [key: string]: string | string[] | undefined };

/** Read a single string param (first value when duplicated). */
export function readString(params: SearchParams | undefined, key: string): string | undefined {
  const value = params?.[key];
  if (Array.isArray(value)) return value[0];
  return value && value.length > 0 ? value : undefined;
}

/** Read a positive integer param, clamped to >= 1 (else the fallback). */
export function readPage(params: SearchParams | undefined, key = 'page'): number {
  const raw = readString(params, key);
  if (!raw) return 1;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
}

/**
 * Build a tenant-collection href preserving/overriding query params. Pass a
 * param value of `undefined` to drop it (e.g. clearing a filter).
 */
export function collectionHref(
  basePath: string,
  route: string,
  params: Record<string, string | number | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return `${basePath}${route}${qs ? `?${qs}` : ''}`;
}

/**
 * Monday-first short weekday labels for the calendar header, localized via
 * `Intl` (server-side — no client dependency, no hard-coded literals).
 */
export function weekdayLabels(locale: SupportedLocale): string[] {
  const tag = LOCALE_HREFLANG[locale];
  const formatter = new Intl.DateTimeFormat(tag, { weekday: 'short', timeZone: 'UTC' });
  // 2024-01-01 is a Monday → walk 7 days to get Mon..Sun in order.
  const labels: string[] = [];
  for (let i = 0; i < 7; i++) {
    labels.push(formatter.format(new Date(Date.UTC(2024, 0, 1 + i))));
  }
  return labels;
}

/** Localized month + year heading for a calendar grid. */
export function monthLabel(locale: SupportedLocale, year: number, month: number): string {
  const tag = LOCALE_HREFLANG[locale];
  return new Intl.DateTimeFormat(tag, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, month, 1)),
  );
}
