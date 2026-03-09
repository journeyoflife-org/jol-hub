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
    default: 'Parish - JOL-HUB',
    template: '%s | JOL-HUB Parish',
  },
  description: 'Catholic parish information, mass schedules, and community events.',
  robots: {
    index: true,
    follow: true,
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
    <html lang="lt" className={`${inter.variable} ${merriweather.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
