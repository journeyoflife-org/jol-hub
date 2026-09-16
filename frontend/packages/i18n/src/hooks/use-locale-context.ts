/**
 * useLocale — current locale + direction + pre-bound Intl formatters.
 *
 *   const { locale, direction, formatDate, formatCurrency } = useLocale();
 *   formatDate(new Date())        → "2026 m. rugpjūčio 25 d." (lt)
 *   formatCurrency(1234.56)       → "1 234,56 €" (lt)
 */
'use client';

import { useCallback } from 'react';

import { useTranslationContext } from '../components/translation-provider';
import {
  formatDate as baseFormatDate,
  formatTime as baseFormatTime,
  formatDateTime as baseFormatDateTime,
  formatNumber as baseFormatNumber,
  formatCurrency as baseFormatCurrency,
} from '../utils';
import type { SupportedLocale } from '../types';

export interface UseLocaleResult {
  locale: SupportedLocale;
  direction: 'ltr' | 'rtl';
  formatDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string;
  formatTime(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string;
  formatDateTime(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string;
  formatNumber(value: number, options?: Intl.NumberFormatOptions): string;
  formatCurrency(amount: number, currency?: string): string;
}

export function useLocale(): UseLocaleResult {
  const { locale, direction } = useTranslationContext();

  const formatDate = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
      baseFormatDate(date, locale, options),
    [locale],
  );
  const formatTime = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
      baseFormatTime(date, locale, options),
    [locale],
  );
  const formatDateTime = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
      baseFormatDateTime(date, locale, options),
    [locale],
  );
  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) => baseFormatNumber(value, locale, options),
    [locale],
  );
  const formatCurrency = useCallback(
    (amount: number, currency = 'EUR') => baseFormatCurrency(amount, locale, currency),
    [locale],
  );

  return { locale, direction, formatDate, formatTime, formatDateTime, formatNumber, formatCurrency };
}
