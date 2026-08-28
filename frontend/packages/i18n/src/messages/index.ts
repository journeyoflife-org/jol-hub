/**
 * Message catalogs + merge pipeline (STEP 4).
 *
 * Merge strategy (last wins):
 *   common(locale) ← vertical override ← tenant-specific overrides
 *
 * Catalogs are plain two-level objects ({ namespace: { key: ICU-string } })
 * formatted via intl-messageformat in useTranslations — no i18next runtime.
 */
import type { SupportedLocale } from '../types';
import { DEFAULT_LOCALE } from '../types';
import IntlMessageFormat from 'intl-messageformat';

import lt from './lt.json';
import en from './en.json';
import ru from './ru.json';
import church from './verticals/church.json';
import funeral from './verticals/funeral.json';
import cleaning from './verticals/cleaning.json';

/** One namespace: flat map of key → ICU message string. */
export type MessageNamespace = Record<string, string>;
/** Full catalog: namespace → keys. */
export type MessageCatalog = Record<string, MessageNamespace>;

const CATALOGS: Record<SupportedLocale, MessageCatalog> = {
  lt: lt as MessageCatalog,
  en: en as MessageCatalog,
  ru: ru as MessageCatalog,
};

export type VerticalOverride = 'church' | 'funeral' | 'cleaning';

/** Vertical files are keyed by locale: { lt: {...}, en: {...}, ru: {...} }. */
const VERTICAL_CATALOGS: Record<VerticalOverride, Record<SupportedLocale, MessageCatalog>> = {
  church: church as Record<SupportedLocale, MessageCatalog>,
  funeral: funeral as Record<SupportedLocale, MessageCatalog>,
  cleaning: cleaning as Record<SupportedLocale, MessageCatalog>,
};

/**
 * Map a tenant vertical (seed-data `Vertical`) to its override catalog.
 * Unknown/absent verticals get the pure common catalog.
 */
export function mapTenantVertical(vertical?: string): VerticalOverride | undefined {
  switch (vertical) {
    case 'cemetery':
    case 'funeral-home':
      return 'funeral';
    case 'parish':
    case 'basilica':
    case 'cathedral':
    case 'chapel':
    case 'monastery':
    case 'diocese':
    case 'deanery':
    case 'orthodox-church':
    case 'greek-catholic':
    case 'protestant-church':
      return 'church';
    case 'cleaning-service':
      return 'cleaning';
    default:
      return undefined;
  }
}

/** Recursive merge — `source` leaves win; nested objects merge deeply. */
export function deepMerge<T extends Record<string, unknown>>(target: T, source: Record<string, unknown>): T {
  const result: Record<string, unknown> = { ...target };
  for (const [key, value] of Object.entries(source)) {
    const existing = result[key];
    if (
      value && typeof value === 'object' && !Array.isArray(value) &&
      existing && typeof existing === 'object' && !Array.isArray(existing)
    ) {
      result[key] = deepMerge(existing as Record<string, unknown>, value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

const mergeCache = new Map<string, MessageCatalog>();

export interface GetMessagesOptions {
  /** Tenant vertical (seed-data `Vertical`) — selects the override catalog. */
  vertical?: string;
  /** Tenant-specific overrides — merged LAST (highest priority). */
  tenantOverrides?: MessageCatalog;
}

/**
 * Resolve the effective catalog for a locale/vertical/tenant combination.
 * Vertical-only merges are cached; tenant overrides are merged fresh
 * (unbounded key-space).
 */
export function getMessages(locale: SupportedLocale, options: GetMessagesOptions = {}): MessageCatalog {
  const vertical = mapTenantVertical(options.vertical);

  if (!options.tenantOverrides) {
    const cacheKey = `${locale}:${vertical ?? '-'}`;
    const cached = mergeCache.get(cacheKey);
    if (cached) return cached;

    let merged: MessageCatalog = CATALOGS[locale] ?? CATALOGS[DEFAULT_LOCALE];
    if (vertical) {
      merged = deepMerge({} as MessageCatalog, merged);
      merged = deepMerge(merged, VERTICAL_CATALOGS[vertical][locale] ?? {});
    }
    mergeCache.set(cacheKey, merged);
    return merged;
  }

  let merged = getMessages(locale, { vertical: options.vertical });
  merged = deepMerge({} as MessageCatalog, merged);
  return deepMerge(merged, options.tenantOverrides as Record<string, unknown>);
}

/**
 * Server-safe plain lookup (no ICU interpolation) for server components
 * and metadata generation. Returns `fallback` when the key is absent.
 */
export function translate(catalog: MessageCatalog, key: string, fallback?: string): string {
  const [namespace, ...rest] = key.split('.');
  const value = namespace && rest.length > 0 ? catalog[namespace]?.[rest.join('.')] : undefined;
  return value ?? fallback ?? key;
}

/** Interpolation values for ICU messages. */
export type TranslationValues = Record<string, string | number | boolean | Date>;

/**
 * Server-safe lookup WITH ICU interpolation, for server components that render
 * parameterized messages (e.g. `collections.pageInfo`). Mirrors the client
 * `useTranslations` behavior. Returns the key path itself when missing.
 */
export function translateWithValues(
  catalog: MessageCatalog,
  locale: SupportedLocale,
  key: string,
  values: TranslationValues,
): string {
  const [namespace, ...rest] = key.split('.');
  const pattern =
    namespace && rest.length > 0 ? catalog[namespace]?.[rest.join('.')] : undefined;
  if (pattern === undefined) return key;
  if (!pattern.includes('{')) return pattern;
  const formatter = new IntlMessageFormat(pattern, locale);
  const formatted = formatter.format(values);
  return Array.isArray(formatted) ? formatted.join('') : String(formatted);
}
