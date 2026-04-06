import type { Metadata } from 'next';
import { Cormorant_Garamond, Source_Sans_Pro } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-heading',
});

const sourceSans = Source_Sans_Pro({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'Vilniaus Kapinių Tarnyba | Vilnius Cemetery Services',
  description: 'Kapinių paslaugos, kapų paieška, priežiūros planai, paminklai. 45,000 kapų, 120,000 palaidojimų.',
  keywords: ['cemetery', 'kapinės', 'Vilnius', 'grave locator', 'monument', 'priežiūra'],
  authors: [{ name: 'JOL-HUB' }],
  openGraph: {
    title: 'Vilniaus Kapinių Tarnyba',
    description: 'Professional cemetery services in Vilnius, Lithuania',
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
    <html lang="lt" className={`${cormorant.variable} ${sourceSans.variable}`}>
      <body className="min-h-screen bg-cemetery-marble font-body">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
