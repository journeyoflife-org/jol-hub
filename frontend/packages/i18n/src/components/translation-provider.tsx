/**
 * TranslationProvider — React context carrying the resolved locale,
 * direction and (already merged) message catalog.
 *
 * Server layouts resolve locale + catalog (getMessages) and pass them in
 * as serializable props; everything below consumes this context.
 */
'use client';

// Namespace import keeps this file working under BOTH JSX runtimes: Next's
// SWC (automatic) and classic-transform tooling (tsx/esbuild in scripts).
import * as React from 'react';
import { createContext, useContext, type ReactNode } from 'react';

import type { SupportedLocale } from '../types';
import type { MessageCatalog } from '../messages';
import { getLocaleDirection } from '../utils/format';

export interface TranslationContextValue {
  locale: SupportedLocale;
  direction: 'ltr' | 'rtl';
  messages: MessageCatalog;
}

const TranslationContext = createContext<TranslationContextValue | null>(null);

export interface TranslationProviderProps {
  locale: SupportedLocale;
  /** Effective catalog — getMessages(locale, { vertical, tenantOverrides }). */
  messages: MessageCatalog;
  children: ReactNode;
}

export function TranslationProvider({ locale, messages, children }: TranslationProviderProps) {
  return (
    <TranslationContext.Provider
      value={{ locale, direction: getLocaleDirection(locale), messages }}
    >
      {children}
    </TranslationContext.Provider>
  );
}

/** Internal accessor — throws with a clear message outside the provider. */
export function useTranslationContext(): TranslationContextValue {
  const value = useContext(TranslationContext);
  if (!value) {
    throw new Error('useTranslations/useLocale must be used inside <TranslationProvider>.');
  }
  return value;
}
