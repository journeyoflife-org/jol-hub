// =============================================================================
// i18n Package - Main Exports
// JOL-HUB Multilingual System with DeepL Integration
// =============================================================================

// -----------------------------------------------------------------------------
// Core Configuration — server-safe functions only
// initI18n, i18n, getCurrentLocale, setLocale are client-only
// (they use react-i18next) → import from '@jol-hub/i18n/client'
// -----------------------------------------------------------------------------
export {
  getLocaleFromPath,
  localizePath,
} from './config';

// -----------------------------------------------------------------------------
// React i18next Re-exports
// NOTE: These are client-side hooks/components — import from 'react-i18next'
// directly in your 'use client' components.
// We do NOT re-export useTranslation here to avoid RSC bundle evaluation.
// -----------------------------------------------------------------------------
// export { useTranslation, Trans, withTranslation } from 'react-i18next';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
export type {
  SupportedLocale,
  TranslationKey,
  LocaleConfig,
  CookieConsentPreferences,
  CookieCategory,
} from './types';

export {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  LOCALE_CONFIGS,
} from './types';

// -----------------------------------------------------------------------------
// Components & Hooks
// ALL components and hooks use React context / hooks and must run in a
// Client Component. Import them from '@jol-hub/i18n/client' instead.
// -----------------------------------------------------------------------------
// export { LanguageSwitcher ... }   → use '@jol-hub/i18n/client'
// export { CookieConsentBanner ... } → use '@jol-hub/i18n/client'
// export { I18nProvider ... }        → use '@jol-hub/i18n/client'
// export { useLocale ... }           → use '@jol-hub/i18n/client'
// export { useCookieConsent ... }    → use '@jol-hub/i18n/client'
// export { useTranslationWithDeepL } → use '@jol-hub/i18n/client'

// Main useTranslation hook + client-safe utilities
export {
  // Liturgical guard (client-safe, pure function)
  containsLiturgicalContent,
  // Liturgical terms dictionary
  LITURGICAL_TERMS,
  getLiturgicalTerm,
  isLiturgicalTerm,
  // Types
  type DeepLTranslationResult,
  type TranslateOptions,
} from './hooks/useTranslation';

// NOTE: Server-only DeepL functions (translateWithDeepL, translateBatchWithDeepL, getDeepLTranslator)
// are available via '@jol-hub/i18n/server' import path

// -----------------------------------------------------------------------------
// Utils
// -----------------------------------------------------------------------------
export {
  formatDate,
  formatTime,
  formatDateTime,
  formatNumber,
  formatCurrency,
  formatRelativeTime,
  getLocaleDirection,
} from './utils/format';

// -----------------------------------------------------------------------------
// Middleware (for Next.js apps)
// -----------------------------------------------------------------------------
export {
  // Main middleware function
  languageMiddleware,
  // Helper functions
  detectLocale,
  // Note: getLocaleFromPath is already exported from './config' above
  getLocaleFromCookie,
  getLocaleFromBrowser,
  isRTLLocale,
  getHTMLLang,
  localizePath as localizePathMiddleware,
  getAlternativeLocales,
  // Constants
  languageMiddlewareMatcher,
  LOCALE_COOKIE,
  // Types
  type SupportedLocale as MiddlewareSupportedLocale,
} from './middleware/language';

// Legacy middleware export (for backward compatibility)
export {
  i18nMiddleware,
  i18nMiddlewareMatcher,
} from './middleware';
