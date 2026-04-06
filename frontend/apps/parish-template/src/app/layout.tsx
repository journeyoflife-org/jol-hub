/**
 * Root Layout — minimal shell
 * 
 * This is the outermost <html> wrapper. It does NOT contain:
 * - LanguageSwitcher (added per-locale in [locale]/layout.tsx)
 * - CookieConsentBanner (added per-locale in [locale]/layout.tsx)
 * - I18nProvider (added per-locale in [locale]/layout.tsx)
 * 
 * The middleware redirects / → /lt/ (301), so most traffic goes directly
 * through [locale]/layout.tsx where full i18n is active.
 * 
 * The root / page.tsx acts as a fallback redirect for any missed cases.
 */

import type { Metadata, Viewport } from 'next';
import { Inter, Merriweather } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
});

const merriweather = Merriweather({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-merriweather',
  weight: ['300', '400', '700', '900'],
});

export const metadata: Metadata = {
  title: {
    default: 'JOL-HUB Parish',
    template: '%s | JOL-HUB',
  },
  description: 'Catholic parish information, mass schedules, and community events.',
  robots: {
    index: true,
    follow: true,
  },
  // hreflang for lt, ru, en — helps crawlers find localised versions
  alternates: {
    languages: {
      'lt': '/lt',
      'ru': '/ru',
      'en': '/en',
      'x-default': '/lt',
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#00843D',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      // Default lang; overridden by [locale]/layout.tsx via the I18nProvider
      lang="lt"
      dir="ltr"
      className={`${inter.variable} ${merriweather.variable}`}
    >
      <body className="min-h-screen bg-background font-sans antialiased flex flex-col">
        {/* Skip-to-content link for screen readers */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
        >
          Skip to content
        </a>

        {children}
      </body>
    </html>
  );
}
