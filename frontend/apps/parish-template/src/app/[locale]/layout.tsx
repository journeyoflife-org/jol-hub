/**
 * Locale-aware Layout for parish-template
 * 
 * Sits at /app/[locale]/layout.tsx and wraps all locale-prefixed routes.
 * - Initialises i18next with the detected locale (Server Component)
 * - Sets <html lang> and dir attributes for RTL readiness
 * - Provides I18nProvider context (Client Component)
 * - Renders global nav with LanguageSwitcher
 * - Renders GDPR CookieConsentBanner
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import {
  I18nProvider,
  LanguageSwitcher,
  CookieConsentBanner,
} from '@jol-hub/i18n/client';
import type { SupportedLocale } from '@jol-hub/i18n';

// =============================================================================
// TYPES
// =============================================================================

const SUPPORTED_LOCALES = ['lt', 'ru', 'en'] as const;

function isSupportedLocale(value: string): value is SupportedLocale {
  return SUPPORTED_LOCALES.includes(value as SupportedLocale);
}

// =============================================================================
// METADATA
// =============================================================================

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  const resolvedLocale = isSupportedLocale(locale) ? locale : 'lt';

  return {
    alternates: {
      languages: {
        'lt': '/lt',
        'ru': '/ru',
        'en': '/en',
        'x-default': '/lt',
      },
    },
    other: {
      'content-language': resolvedLocale,
      'og:locale': resolvedLocale === 'lt' ? 'lt_LT' : resolvedLocale === 'ru' ? 'ru_RU' : 'en_US',
    },
  };
}

// =============================================================================
// STATIC PARAMS — tell Next.js which locale segments to pre-render
// =============================================================================

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

// =============================================================================
// LAYOUT
// =============================================================================

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps): Promise<JSX.Element> {
  const { locale } = params;

  // Validate locale segment — show 404 for unknown locales
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  // Read subdomain from middleware header (for multi-tenant context)
  const headersList = await headers();
  const subdomain = headersList.get('x-subdomain') ?? null;
  // RTL ready: extend for 'ar', 'he' - would use _direction variable

  return (
    <I18nProvider locale={locale}>
      {/* Site-wide Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Parish name / logo */}
          <div className="flex items-center gap-3">
            {/* Cross icon */}
            <svg
              className="h-7 w-7 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="12" y1="2" x2="12" y2="22" />
              <line x1="4" y1="9" x2="20" y2="9" />
            </svg>
            <span className="text-lg font-semibold font-serif text-foreground">
              {subdomain
                ? subdomain.charAt(0).toUpperCase() + subdomain.slice(1)
                : 'Parapija'}
            </span>
          </div>

          {/* Language Switcher */}
          <LanguageSwitcher />
        </div>
      </header>

      {/* Page Content */}
      <main id="main-content" className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/40 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            {locale === 'lt' && '© JOL-HUB. Visos teisės saugomos.'}
            {locale === 'ru' && '© JOL-HUB. Все права защищены.'}
            {locale === 'en' && '© JOL-HUB. All rights reserved.'}
          </p>
          <nav className="mt-2 flex justify-center gap-4" aria-label="Footer navigation">
            <a
              href={`/${locale}/privacy`}
              className="hover:text-foreground underline underline-offset-4 transition-colors"
            >
              {locale === 'lt' && 'Privatumo politika'}
              {locale === 'ru' && 'Политика конфиденциальности'}
              {locale === 'en' && 'Privacy Policy'}
            </a>
            <a
              href={`/${locale}/contact`}
              className="hover:text-foreground underline underline-offset-4 transition-colors"
            >
              {locale === 'lt' && 'Kontaktai'}
              {locale === 'ru' && 'Контакты'}
              {locale === 'en' && 'Contact'}
            </a>
          </nav>
        </div>
      </footer>

      {/* GDPR Cookie Consent Banner */}
      <CookieConsentBanner privacyPolicyUrl={`/${locale}/privacy`} />
    </I18nProvider>
  );
}
