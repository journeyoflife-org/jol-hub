'use client';

/**
 * I18nProvider
 * 
 * Client-side wrapper that initialises i18next once and provides
 * the I18nextProvider context to all children.
 * 
 * Usage (in a Server Component layout):
 *   <I18nProvider locale="lt">
 *     {children}
 *   </I18nProvider>
 */

import { type ReactNode, useEffect, useRef } from 'react';
import { I18nextProvider } from 'react-i18next';
import { initI18n } from '../config';
import type { SupportedLocale } from '../types';

export interface I18nProviderProps {
  locale: SupportedLocale;
  children: ReactNode;
}

export function I18nProvider({ locale, children }: I18nProviderProps): JSX.Element {
  const i18nRef = useRef(initI18n(locale));

  // Sync language when locale prop changes (e.g. user switches via LanguageSwitcher)
  useEffect(() => {
    if (i18nRef.current.language !== locale) {
      void i18nRef.current.changeLanguage(locale);
    }
  }, [locale]);

  return (
    <I18nextProvider i18n={i18nRef.current}>
      {children}
    </I18nextProvider>
  );
}
