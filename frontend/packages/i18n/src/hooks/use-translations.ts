/**
 * useTranslations — ICU message lookup bound to the active locale.
 *
 * Usage:
 *   const t = useTranslations('navigation');
 *   t('home')                       → simple lookup
 *   t('count', { count: 3 })        → ICU interpolation + pluralization
 *
 * Keys may also be passed fully qualified ('navigation.home') with no
 * namespace. Missing keys render as the key path itself (visible in UI,
 * caught by `pnpm i18n:check` in CI).
 */
'use client';

import { useCallback, useRef } from 'react';
import IntlMessageFormat from 'intl-messageformat';

import { useTranslationContext } from '../components/translation-provider';

export type TranslationValues = Record<string, string | number | boolean | Date>;

export function useTranslations(namespace?: string) {
  const { locale, messages } = useTranslationContext();
  const cache = useRef(new Map<string, IntlMessageFormat>());

  const t = useCallback(
    (key: string, values?: TranslationValues): string => {
      const fullKey = namespace && !key.includes('.') ? `${namespace}.${key}` : key;
      const separator = fullKey.indexOf('.');
      const pattern =
        separator > 0
          ? messages[fullKey.slice(0, separator)]?.[fullKey.slice(separator + 1)]
          : undefined;

      // Missing key: return the path so it is obvious in the UI.
      if (pattern === undefined) return fullKey;

      // Fast path: no ICU syntax and no values → return as-is.
      if (!values && !pattern.includes('{')) return pattern;

      let formatter = cache.current.get(fullKey);
      if (!formatter) {
        formatter = new IntlMessageFormat(pattern, locale);
        cache.current.set(fullKey, formatter);
      }
      const formatted = formatter.format(values ?? {});
      return Array.isArray(formatted) ? formatted.join('') : String(formatted);
    },
    [locale, messages, namespace],
  );

  return t;
}
