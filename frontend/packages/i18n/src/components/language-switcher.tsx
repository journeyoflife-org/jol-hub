/// <reference types="next" />

/**
 * LanguageSwitcher Component
 * Full-featured language switcher with:
 * - Flag icons (LT, RU, EN)
 * - Cookie persistence (1 year)
 * - URL-based routing (/lt/, /ru/, /en/)
 * - WCAG 2.1 AA keyboard navigation and aria labels
 * - Dropdown menu with animated transition
 */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import type { SupportedLocale } from '../types';
import { SUPPORTED_LOCALES, LOCALE_CONFIGS } from '../types';
import { getLocaleFromPath } from '../config';

// =============================================================================
// TYPES
// =============================================================================

export interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'inline';
  showFlags?: boolean;
  showNativeName?: boolean;
  className?: string;
}

// =============================================================================
// FLAG ICONS (SVG inline for Edge Runtime compatibility)
// =============================================================================

const FLAG_ICONS: Record<SupportedLocale, React.ReactNode> = {
  lt: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 5 3"
      aria-hidden="true"
      className="h-4 w-6 overflow-hidden rounded-sm"
    >
      {/* Lithuania: Yellow, Green, Red */}
      <rect width="5" height="1" y="0" fill="#FDB913" />
      <rect width="5" height="1" y="1" fill="#006A44" />
      <rect width="5" height="1" y="2" fill="#C1272D" />
    </svg>
  ),
  ru: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 5 3"
      aria-hidden="true"
      className="h-4 w-6 overflow-hidden rounded-sm"
    >
      {/* Russia: White, Blue, Red */}
      <rect width="5" height="1" y="0" fill="#FFFFFF" />
      <rect width="5" height="1" y="1" fill="#0039A6" />
      <rect width="5" height="1" y="2" fill="#D52B1E" />
    </svg>
  ),
  pl: (
    <svg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
      <rect width='24' height='12' fill='white' />
      <rect y='12' width='24' height='12' fill='#DC143C' />
    </svg>
  ),
  en: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 60 30"
      aria-hidden="true"
      className="h-4 w-6 overflow-hidden rounded-sm"
    >
      {/* UK flag (simplified) */}
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" />
      <path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  ),
};

// =============================================================================
// COOKIE HELPERS
// =============================================================================

function setLocaleCookie(locale: SupportedLocale): void {
  if (typeof document === 'undefined') return;
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  const domain = process.env.NODE_ENV === 'production' ? '; domain=.jol-hub.eu' : '';
  document.cookie = `jol-hub-locale=${locale}; expires=${expires.toUTCString()}; path=/${domain}; SameSite=Lax`;
}

function getLocaleCookieClient(): SupportedLocale | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/jol-hub-locale=([^;]+)/);
  if (match && SUPPORTED_LOCALES.includes(match[1] as SupportedLocale)) {
    return match[1] as SupportedLocale;
  }
  return null;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function LanguageSwitcher({
  variant = 'dropdown',
  showFlags = true,
  showNativeName = true,
  className = '',
}: LanguageSwitcherProps): JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  // Derive current locale from URL path first, then cookie, then i18n
  const currentLocale: SupportedLocale =
    (getLocaleFromPath(pathname) as SupportedLocale) ||
    getLocaleCookieClient() ||
    (SUPPORTED_LOCALES.includes(i18n.language as SupportedLocale)
      ? (i18n.language as SupportedLocale)
      : 'lt');

  const currentConfig = LOCALE_CONFIGS[currentLocale];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation for the dropdown menu
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
        return;
      }

      if (!isOpen) {
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
          event.preventDefault();
          setIsOpen(true);
          setTimeout(() => {
            const firstItem = menuRef.current?.querySelector('[role="menuitem"]') as HTMLElement;
            firstItem?.focus();
          }, 0);
        }
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        const items = Array.from(
          menuRef.current?.querySelectorAll('[role="menuitem"]') ?? []
        ) as HTMLElement[];
        const currentIndex = items.indexOf(document.activeElement as HTMLElement);
        items[(currentIndex + 1) % items.length]?.focus();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        const items = Array.from(
          menuRef.current?.querySelectorAll('[role="menuitem"]') ?? []
        ) as HTMLElement[];
        const currentIndex = items.indexOf(document.activeElement as HTMLElement);
        items[(currentIndex - 1 + items.length) % items.length]?.focus();
      } else if (event.key === 'Home') {
        event.preventDefault();
        const firstItem = menuRef.current?.querySelector('[role="menuitem"]') as HTMLElement;
        firstItem?.focus();
      } else if (event.key === 'End') {
        event.preventDefault();
        const items = Array.from(
          menuRef.current?.querySelectorAll('[role="menuitem"]') ?? []
        ) as HTMLElement[];
        items[items.length - 1]?.focus();
      }
    },
    [isOpen]
  );

  const switchLocale = useCallback(
    (locale: SupportedLocale) => {
      if (locale === currentLocale) {
        setIsOpen(false);
        return;
      }

      // Persist to cookie (1 year)
      setLocaleCookie(locale);

      // Update i18n
      i18n.changeLanguage(locale).catch(() => {});

      // Navigate to new locale route
      const cleanPath =
        pathname.replace(new RegExp(`^\\/(${SUPPORTED_LOCALES.join('|')})(\\/.+)?$`), '$2') || '/';
      router.push(`/${locale}${cleanPath}`);

      setIsOpen(false);
    },
    [currentLocale, pathname, router, i18n]
  );

  // === INLINE VARIANT ===
  if (variant === 'inline') {
    return (
      <div
        className={`flex items-center gap-1 ${className}`}
        role="group"
        aria-label="Language selection"
      >
        {SUPPORTED_LOCALES.map((locale) => (
          <button
            key={locale}
            onClick={() => switchLocale(locale)}
            className={`focus:ring-primary flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors focus:outline-none focus:ring-2 ${
              currentLocale === locale
                ? 'bg-primary text-primary-foreground font-medium'
                : 'hover:bg-accent text-foreground hover:text-accent-foreground'
            }`}
            aria-label={`Switch to ${LOCALE_CONFIGS[locale].name}`}
            aria-pressed={currentLocale === locale}
          >
            {showFlags && FLAG_ICONS[locale]}
            {showNativeName && <span>{LOCALE_CONFIGS[locale].nativeName}</span>}
            {!showNativeName && <span className="font-mono uppercase">{locale}</span>}
          </button>
        ))}
      </div>
    );
  }

  // === DROPDOWN VARIANT ===
  return (
    <div
      ref={dropdownRef}
      className={`relative inline-block ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((prev) => !prev)}
        className="border-input bg-background hover:bg-accent hover:text-accent-foreground focus:ring-primary flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${currentConfig.name} — change language`}
      >
        {showFlags && FLAG_ICONS[currentLocale]}
        {showNativeName && <span>{currentConfig.nativeName}</span>}
        {!showNativeName && <span className="font-mono uppercase">{currentLocale}</span>}
        {/* Chevron */}
        <svg
          className={`text-muted-foreground h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <ul
          ref={menuRef}
          role="listbox"
          aria-label="Available languages"
          className="border-border bg-popover animate-in fade-in slide-in-from-top-2 absolute right-0 z-50 mt-1 w-44 rounded-md border py-1 shadow-lg duration-150"
        >
          {SUPPORTED_LOCALES.map((locale) => {
            const config = LOCALE_CONFIGS[locale];
            const isSelected = locale === currentLocale;

            return (
              <li key={locale} role="none">
                <button
                  role="menuitem"
                  aria-selected={isSelected}
                  onClick={() => switchLocale(locale)}
                  className={`focus:bg-accent flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors focus:outline-none ${
                    isSelected
                      ? 'bg-accent text-accent-foreground font-semibold'
                      : 'text-popover-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  {showFlags && <span className="flex-shrink-0">{FLAG_ICONS[locale]}</span>}
                  <div className="flex flex-col items-start">
                    <span>{config.nativeName}</span>
                    {config.nativeName !== config.name && (
                      <span className="text-muted-foreground text-xs">{config.name}</span>
                    )}
                  </div>
                  {/* Checkmark for selected */}
                  {isSelected && (
                    <svg
                      className="text-primary ml-auto h-4 w-4 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// =============================================================================
// COMPACT VARIANT (for mobile nav)
// =============================================================================

export function LanguageSwitcherCompact({ className = '' }: { className?: string }): JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const { i18n } = useTranslation();

  const currentLocale: SupportedLocale =
    (getLocaleFromPath(pathname) as SupportedLocale) ||
    (SUPPORTED_LOCALES.includes(i18n.language as SupportedLocale)
      ? (i18n.language as SupportedLocale)
      : 'lt');

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const locale = e.target.value as SupportedLocale;
      setLocaleCookie(locale);
      i18n.changeLanguage(locale).catch(() => {});
      const cleanPath =
        pathname.replace(new RegExp(`^\\/(${SUPPORTED_LOCALES.join('|')})(\\/.+)?$`), '$2') || '/';
      router.push(`/${locale}${cleanPath}`);
    },
    [pathname, router, i18n]
  );

  return (
    <select
      value={currentLocale}
      onChange={handleChange}
      className={`border-input bg-background focus:ring-primary h-9 rounded-md border px-3 py-1 text-sm focus:outline-none focus:ring-2 ${className}`}
      aria-label="Select language"
    >
      {SUPPORTED_LOCALES.map((locale) => (
        <option key={locale} value={locale}>
          {LOCALE_CONFIGS[locale].nativeName}
        </option>
      ))}
    </select>
  );
}
