'use client';

import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { SupportedLocale } from '../types';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, LOCALE_CONFIGS } from '../types';

/**
 * Hook for managing locale selection.
 */
export function useLocale() {
  const { i18n } = useTranslation();

  const currentLocale = useMemo((): SupportedLocale => {
    const lng = i18n.language;
    if (SUPPORTED_LOCALES.includes(lng as SupportedLocale)) {
      return lng as SupportedLocale;
    }
    return DEFAULT_LOCALE;
  }, [i18n.language]);

  const localeConfig = useMemo(() => LOCALE_CONFIGS[currentLocale], [currentLocale]);

  const setLocale = useCallback(
    async (locale: SupportedLocale): Promise<void> => {
      await i18n.changeLanguage(locale);
      // Store preference
      if (typeof window !== 'undefined') {
        localStorage.setItem('jol-hub-locale', locale);
        document.documentElement.lang = locale;
      }
    },
    [i18n]
  );

  const t = useCallback(
    (key: string, options?: Record<string, string | number>): string => {
      return i18n.t(key, options);
    },
    [i18n]
  );

  return {
    locale: currentLocale,
    localeConfig,
    setLocale,
    t,
    supportedLocales: SUPPORTED_LOCALES,
    localeConfigs: LOCALE_CONFIGS,
  };
}
