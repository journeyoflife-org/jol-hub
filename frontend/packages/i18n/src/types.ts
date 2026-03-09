/**
 * Supported locales for JOL-HUB.
 */
export type SupportedLocale = 'lt' | 'ru' | 'en';

/**
 * Locale configuration.
 */
export interface LocaleConfig {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  dateFormat: string;
  timeFormat: string;
}

/**
 * Cookie consent categories according to GDPR.
 */
export type CookieCategory = 'necessary' | 'analytics' | 'marketing';

/**
 * Cookie consent preferences.
 */
export interface CookieConsentPreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
  version: string;
}

/**
 * Translation key type for type-safe translations.
 */
export type TranslationKey = string; // In production, this would be generated from translation files

/**
 * Locale configurations for all supported languages.
 */
export const LOCALE_CONFIGS: Record<SupportedLocale, LocaleConfig> = {
  lt: {
    code: 'lt',
    name: 'Lithuanian',
    nativeName: 'Lietuvių',
    direction: 'ltr',
    dateFormat: 'yyyy-MM-dd',
    timeFormat: 'HH:mm',
  },
  ru: {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    direction: 'ltr',
    dateFormat: 'dd.MM.yyyy',
    timeFormat: 'HH:mm',
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: 'h:mm a',
  },
};

/**
 * Default locale.
 */
export const DEFAULT_LOCALE: SupportedLocale = 'lt';

/**
 * All supported locales.
 */
export const SUPPORTED_LOCALES: SupportedLocale[] = ['lt', 'ru', 'en'];
