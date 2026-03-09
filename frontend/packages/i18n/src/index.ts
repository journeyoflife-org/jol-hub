// i18n configuration and exports
export { initI18n, i18n } from './config';
export { useTranslation, Trans, withTranslation } from 'react-i18next';

// Types
export type { SupportedLocale, TranslationKey } from './types';

// Components
export { CookieConsentBanner } from './components/cookie-consent-banner';
export { LanguageSwitcher } from './components/language-switcher';

// Hooks
export { useLocale } from './hooks/use-locale';
export { useCookieConsent } from './hooks/use-cookie-consent';

// Utils
export { formatDate, formatNumber, getLocaleDirection } from './utils/format';
