import type { Metadata, Viewport } from 'next';
import { Inter, Source_Serif_4 } from 'next/font/google';
import { localeAccents } from '@journeyoflife-org/ui/tokens';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
});

const serif = Source_Serif_4({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-serif',
  weight: ['300', '400', '700', '900'],
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
