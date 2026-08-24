/**
 * Legacy i18next runtime (parish-template compat) — split out of config.ts
 * in STEP 4 so config stays pure/edge-safe. Client-only: imports
 * react-i18next + browser language detector.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import type { SupportedLocale } from './types';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, LOCALE_COOKIE, isSupportedLocale } from './config';

// Import translation files directly for Next.js compatibility
import ltCommon from './locales/lt/common.json';
import ltLiturgical from './locales/lt/liturgical.json';
import ltGdpr from './locales/lt/gdpr.json';
import ruCommon from './locales/ru/common.json';
import ruLiturgical from './locales/ru/liturgical.json';
import ruGdpr from './locales/ru/gdpr.json';
import enCommon from './locales/en/common.json';
import enLiturgical from './locales/en/liturgical.json';
import enGdpr from './locales/en/gdpr.json';

const resources = {
  lt: { common: ltCommon, liturgical: ltLiturgical, gdpr: ltGdpr },
  ru: { common: ruCommon, liturgical: ruLiturgical, gdpr: ruGdpr },
  en: { common: enCommon, liturgical: enLiturgical, gdpr: enGdpr },
};

/**
 * Initialize i18next with configuration (LEGACY — client-only).
 * New STEP 4 code uses TranslationProvider/useTranslations instead.
 */
export function initI18n(initialLocale?: SupportedLocale): typeof i18n {
  // Guard against re-initialization (singleton pattern)
  if (i18n.isInitialized) {
    if (initialLocale && i18n.language !== initialLocale) {
      void i18n.changeLanguage(initialLocale);
    }
    return i18n;
  }

  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      lng: initialLocale || DEFAULT_LOCALE,
      fallbackLng: DEFAULT_LOCALE,
      supportedLngs: SUPPORTED_LOCALES,
      defaultNS: 'common',
      ns: ['common', 'liturgical', 'gdpr'],
      debug: process.env.NODE_ENV === 'development',
      interpolation: { escapeValue: false },
      detection: {
        order: ['path', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
        lookupFromPathIndex: 0,
        lookupCookie: LOCALE_COOKIE,
        lookupLocalStorage: LOCALE_COOKIE,
        caches: ['cookie', 'localStorage'],
        cookieMinutes: 60 * 24 * 365,
      },
      react: { useSuspense: false },
      nsSeparator: ':',
      keySeparator: '.',
    });

  return i18n;
}

/** Get the current locale (legacy i18next instance). */
export function getCurrentLocale(): SupportedLocale {
  const lng = i18n.language;
  return isSupportedLocale(lng) ? lng : DEFAULT_LOCALE;
}

/** Change the locale (legacy i18next instance). */
export async function setLocale(locale: SupportedLocale): Promise<void> {
  await i18n.changeLanguage(locale);
}

export { i18n };
