import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-heading',
});

export const metadata: Metadata = {
  title: 'Vilniaus Laidojimo Namai | Vilnius Funeral Home',
  description: 'Profesionalios laidotuvių paslaugos Vilniuje. 29 metų patirtis, 8500 šeimų aptarnauta. Pre-need planavimas, nekrologai, gedėjimo ištekliai.',
  keywords: ['funeral', 'laidotuvės', 'Vilnius', 'pre-need', 'obituary', 'nekrologas'],
  authors: [{ name: 'JOL-HUB' }],
  openGraph: {
    title: 'Vilniaus Laidojimo Namai',
    description: 'Professional funeral services in Vilnius, Lithuania',
    type: 'website',
    locale: 'lt_LT',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="lt" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-memorial-cream font-body">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
