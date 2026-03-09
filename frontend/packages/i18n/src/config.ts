import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

import type { SupportedLocale } from './types';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './types';

/**
 * Initialize i18next with configuration.
 */
export function initI18n(): typeof i18n {
  i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      fallbackLng: DEFAULT_LOCALE,
      supportedLngs: SUPPORTED_LOCALES,
      defaultNS: 'common',
      ns: ['common', 'auth', 'parish', 'gdpr', 'errors'],

      debug: process.env.NODE_ENV === 'development',

      interpolation: {
        escapeValue: false, // React already escapes values
      },

      detection: {
        order: ['cookie', 'localStorage', 'navigator', 'htmlTag'],
        lookupCookie: 'jol-hub-locale',
        lookupLocalStorage: 'jol-hub-locale',
        caches: ['cookie', 'localStorage'],
        cookieMinutes: 60 * 24 * 365, // 1 year
        cookieDomain: process.env.NODE_ENV === 'production' ? '.jol-hub.lt' : undefined,
      },

      backend: {
        loadPath: '/locales/{{lng}}/{{ns}}.json',
      },

      react: {
        useSuspense: true,
      },
    });

  return i18n;
}

/**
 * Get the current locale.
 */
export function getCurrentLocale(): SupportedLocale {
  const lng = i18n.language;
  if (SUPPORTED_LOCALES.includes(lng as SupportedLocale)) {
    return lng as SupportedLocale;
  }
  return DEFAULT_LOCALE;
}

/**
 * Change the locale.
 */
export async function setLocale(locale: SupportedLocale): Promise<void> {
  await i18n.changeLanguage(locale);
}

// Re-export i18n instance
export { i18n };
