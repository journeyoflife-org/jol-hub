import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { localeAccents } from '@journeyoflife-org/ui/tokens';
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
    default: 'JOL-HUB - Lithuanian Catholic Church Platform',
    template: '%s | JOL-HUB',
  },
  description:
    'Official platform for the Lithuanian Catholic Church. Find parishes, mass schedules, and spiritual resources.',
  keywords: [
    'Lithuanian Catholic Church',
    'Catholic',
    'Church',
    'Lithuania',
    'Parish',
    'Mass Schedule',
  ],
  authors: [{ name: 'JOL-HUB' }],
  creator: 'JOL-HUB',
  publisher: 'JOL-HUB',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'lt_LT',
    alternateLocale: ['en_US', 'ru_RU'],
    siteName: 'JOL-HUB',
  },
};

export const viewport: Viewport = {
  themeColor: localeAccents.lt.primary,
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
    <html lang="lt" className={`${inter.variable} ${serif.variable}`}>
      <body className="bg-background min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
