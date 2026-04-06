import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import type { SupportedLocale } from './types';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './types';

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

// Translation resources
const resources = {
  lt: {
    common: ltCommon,
    liturgical: ltLiturgical,
    gdpr: ltGdpr,
  },
  ru: {
    common: ruCommon,
    liturgical: ruLiturgical,
    gdpr: ruGdpr,
  },
  en: {
    common: enCommon,
    liturgical: enLiturgical,
    gdpr: enGdpr,
  },
};

/**
 * Initialize i18next with configuration.
 * Optimized for Next.js with route-based i18n (/lt/, /ru/, /en/)
 */
export function initI18n(initialLocale?: SupportedLocale): typeof i18n {
  // Guard against re-initialization (singleton pattern)
  if (i18n.isInitialized) {
    // If locale differs, just change language on the existing instance
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

      interpolation: {
        escapeValue: false, // React already escapes values
      },

      detection: {
        order: ['path', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
        lookupFromPathIndex: 0,
        lookupCookie: 'jol-hub-locale',
        lookupLocalStorage: 'jol-hub-locale',
        caches: ['cookie', 'localStorage'],
        cookieMinutes: 60 * 24 * 365, // 1 year
        cookieDomain: process.env.NODE_ENV === 'production' ? '.jol-hub.eu' : undefined,
      },

      react: {
        useSuspense: false, // Disable for SSR compatibility
      },

      // Liturgical terms should never be auto-translated
      // They are handled through the liturgical namespace
      nsSeparator: ':',
      keySeparator: '.',
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

/**
 * Get locale from URL path.
 * Extracts /lt/, /ru/, /en/ from pathname.
 */
export function getLocaleFromPath(pathname: string): SupportedLocale | null {
  const match = pathname.match(/^\/(lt|ru|en)(?:\/|$)/);
  if (match && SUPPORTED_LOCALES.includes(match[1] as SupportedLocale)) {
    return match[1] as SupportedLocale;
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

// Re-export i18n instance
export { i18n };
