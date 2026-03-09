'use client';

import { useLocale } from '../hooks/use-locale';
import type { SupportedLocale } from '../types';
import { SUPPORTED_LOCALES, LOCALE_CONFIGS } from '../types';

/**
 * Language switcher component for changing locale.
 */
export function LanguageSwitcher() {
  const { locale, setLocale, supportedLocales, localeConfigs } = useLocale();

  return (
    <div className="flex items-center gap-2">
      {supportedLocales.map((lang) => (
        <button
          key={lang}
          onClick={() => setLocale(lang)}
          className={`px-2 py-1 text-sm rounded transition-colors ${
            locale === lang
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-accent hover:text-accent-foreground'
          }`}
          aria-label={`Switch to ${localeConfigs[lang].name}`}
          aria-current={locale === lang ? 'true' : undefined}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

/**
 * Dropdown language switcher for compact spaces.
 */
export function LanguageSwitcherDropdown() {
  const { locale, setLocale, localeConfigs } = useLocale();

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as SupportedLocale)}
      className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      aria-label="Select language"
    >
      {SUPPORTED_LOCALES.map((lang) => (
        <option key={lang} value={lang}>
          {localeConfigs[lang].nativeName}
        </option>
      ))}
    </select>
  );
}
