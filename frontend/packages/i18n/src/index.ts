// =============================================================================
// i18n Package - Main Exports
// JOL-HUB Multilingual System with DeepL Integration
// =============================================================================

// -----------------------------------------------------------------------------
// Core Configuration — server-safe functions only
// initI18n, i18n, getCurrentLocale, setLocale are client-only
// (they use react-i18next) → import from '@journeyoflife-org/i18n/client'
// -----------------------------------------------------------------------------
export { getLocaleFromPath, localizePath } from './config';

// -----------------------------------------------------------------------------
// STEP 4 — canonical constants, message pipeline, provider
// All server/client safe (pure modules; the provider is a client-component
// reference that RSC may render but never executes hooks server-side).
// -----------------------------------------------------------------------------
export {
  LOCALE_NAMES,
  LOCALE_PREFIXES,
  LOCALE_HREFLANG,
  LOCALE_COOKIE,
  FALLBACK_ORDER,
  PLANNED_LOCALES,
  isSupportedLocale,
  type PlannedLocale,
  type LocaleCode,
} from './config';

export {
  getMessages,
  translate,
  translateWithValues,
  deepMerge,
  mapTenantVertical,
  type MessageCatalog,
  type MessageNamespace,
  type VerticalOverride,
  type GetMessagesOptions,
  type TranslationValues,
} from './messages';

export {
  TranslationProvider,
  type TranslationProviderProps,
} from './components/translation-provider';

// Client-only hooks live behind dedicated subpaths (keeps RSC bundles clean):
//   useTranslations → '@journeyoflife-org/i18n/use-translations'
//   useLocale       → '@journeyoflife-org/i18n/use-locale'
// Locale-aware Intl formatters → '@journeyoflife-org/i18n/utils'

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

export { SUPPORTED_LOCALES, DEFAULT_LOCALE, LOCALE_CONFIGS } from './types';

// -----------------------------------------------------------------------------
// Components & Hooks
// ALL components and hooks use React context / hooks and must run in a
// Client Component. Import them from '@journeyoflife-org/i18n/client' instead.
// -----------------------------------------------------------------------------
// export { LanguageSwitcher ... }   → use '@journeyoflife-org/i18n/client'
// export { CookieConsentBanner ... } → use '@journeyoflife-org/i18n/client'
// export { I18nProvider ... }        → use '@journeyoflife-org/i18n/client'
// export { useLocale ... }           → use '@journeyoflife-org/i18n/client'
// export { useCookieConsent ... }    → use '@journeyoflife-org/i18n/client'
// export { useTranslationWithDeepL } → use '@journeyoflife-org/i18n/client'

// Main useTranslation hook + client-safe utilities
export {
  // Liturgical guard (PURE module — keeps react-i18next out of server bundles)
  containsLiturgicalContent,
  // Liturgical terms dictionary
  LITURGICAL_TERMS,
  getLiturgicalTerm,
  isLiturgicalTerm,
  // Types
  type DeepLTranslationResult,
  type TranslateOptions,
} from './lib/liturgical';

// NOTE: Server-only DeepL functions (translateWithDeepL, translateBatchWithDeepL, getDeepLTranslator)
// are available via '@journeyoflife-org/i18n/server' import path

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
  // Types
  type SupportedLocale as MiddlewareSupportedLocale,
} from './middleware/language';

// Legacy middleware export (for backward compatibility)
export { i18nMiddleware, i18nMiddlewareMatcher } from './middleware';

// -----------------------------------------------------------------------------
// Inline localized-field resolution (tenant/entity data)
// Complements the message-catalog pipeline above: catalogs map KEYS to ICU
// strings; tenant fixtures carry translations INLINE as { lt, en?, ru? }.
// PURE module — server/edge/client safe.
// -----------------------------------------------------------------------------
export { resolveLocale, TODO_MARKER, type LocalizedText } from './localized-text';
