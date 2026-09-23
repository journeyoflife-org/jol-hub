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
import localFont from 'next/font/local';
import './globals.css';

const inter = localFont({
  src: '../../../../packages/ui/fonts/Inter.var.woff2',
  variable: '--font-inter',
  display: 'swap',
});

const serif = localFont({
  src: [
    { path: '../../../../packages/ui/fonts/SourceSerif4Variable-Roman.woff2', style: 'normal' },
    { path: '../../../../packages/ui/fonts/SourceSerif4Variable-It.woff2', style: 'italic' },
  ],
  variable: '--font-serif',
  display: 'swap',
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
      lt: '/lt',
      ru: '/ru',
      en: '/en',
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
      className={`${inter.variable} ${serif.variable}`}
    >
      <body className="bg-background flex min-h-screen flex-col font-sans antialiased">
        {/* Skip-to-content link for screen readers */}
        <a
          href="#main-content"
          className="focus:bg-primary focus:text-primary-foreground sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:px-4 focus:py-2"
        >
          Skip to content
        </a>

        {children}
      </body>
    </html>
  );
}
