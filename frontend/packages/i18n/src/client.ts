'use client';

/**
 * Client-only exports for @jol-hub/i18n
 *
 * Import from '@jol-hub/i18n/client' in any file that uses these in a
 * Client Component (file must have 'use client' directive or be a client
 * component already).
 *
 * Server-safe utilities (getLocaleFromPath, types, middleware) remain in '@jol-hub/i18n'.
 * Server-only DeepL SDK functions are in '@jol-hub/i18n/server'.
 */

// i18next initialization (requires react-i18next — client only)
export { i18n, initI18n, getCurrentLocale, setLocale } from './config';

// React-i18next (client-only)
export { useTranslation, Trans, withTranslation } from 'react-i18next';

// Components (all require React context)
export {
  LanguageSwitcher,
  LanguageSwitcherCompact,
  type LanguageSwitcherProps,
} from './components/language-switcher';

export {
  CookieConsentBanner,
  type CookieConsentBannerProps,
} from './components/cookie-consent-banner';

export {
  I18nProvider,
  type I18nProviderProps,
} from './components/i18n-provider';

// Hooks (all require React context / browser APIs)
export { useLocale } from './hooks/use-locale';
export { useCookieConsent, hasConsentForCategory } from './hooks/use-cookie-consent';

// Enhanced translation hook with DeepL fallback
export {
  useTranslationWithDeepL,
  translateUserContent,
  type UseTranslationWithDeepLReturn,
  type TranslationCacheEntry,
  type DeepLTranslationResponse,
  type TranslateUserContentResult,
} from './hooks/use-translation-with-deepl';
