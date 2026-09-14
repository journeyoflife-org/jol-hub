/**
 * LocaleSwitcher — accessible language dropdown.
 *
 * - Native names (Lietuvių / English / Русский) — never translated
 * - Preserves the current path: /{locale}/... → /{target}/...
 * - Client-side navigation (next/navigation) — no full page reload
 * - Persists the explicit choice in the locale cookie
 * - Announces the change via a polite live region (screen readers)
 * - Native `<select>`: keyboard support comes free
 */
'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { SUPPORTED_LOCALES, LOCALE_NAMES, LOCALE_COOKIE } from '@jol-hub/i18n/config';
import type { SupportedLocale } from '@jol-hub/i18n/config';
import { useTranslations } from '@jol-hub/i18n/use-translations';
import { useLocale } from '@jol-hub/i18n/use-locale';

import { cn } from '../../lib/utils';
import { LiveRegion } from '../accessibility/live-region';
import type { LocaleSwitcherProps } from './LocaleSwitcher.types';

export function LocaleSwitcher({ className }: LocaleSwitcherProps) {
  const { locale } = useLocale();
  const tNav = useTranslations('navigation');
  const tA11y = useTranslations('accessibility');
  const router = useRouter();
  const pathname = usePathname();
  const [announcement, setAnnouncement] = useState('');

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const target = event.target.value as SupportedLocale;
    if (target === locale) return;

    // Persist the explicit choice (strictly-necessary preference cookie).
    document.cookie = `${LOCALE_COOKIE}=${target};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;

    // Preserve everything after the locale prefix.
    const segments = pathname.split('/');
    const isPrefixed = (SUPPORTED_LOCALES as readonly string[]).includes(segments[1] ?? '');
    const rest = isPrefixed ? segments.slice(2).join('/') : segments.slice(1).join('/');
    const targetPath = `/${target}${rest ? `/${rest}` : ''}`;

    setAnnouncement(tA11y('localeChanged', { language: LOCALE_NAMES[target] }));
    router.push(targetPath);
  };

  return (
    <span className={cn('relative inline-flex items-center', className)}>
      <select
        value={locale}
        onChange={handleChange}
        aria-label={tNav('languageLabel')}
        className="h-9 cursor-pointer appearance-none rounded-md border border-neutral-300 bg-neutral-50 pe-8 ps-3 text-sm font-medium text-neutral-900 focus-ring dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
      >
        {SUPPORTED_LOCALES.map((code) => (
          <option key={code} value={code}>
            {LOCALE_NAMES[code]}
          </option>
        ))}
      </select>
      {/* Visual indicator for the current locale + affordance. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute end-2 text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400"
      >
        {locale}
      </span>
      <LiveRegion politeness="polite" message={announcement} />
    </span>
  );
}
