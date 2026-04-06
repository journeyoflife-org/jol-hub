import type { Metadata } from 'next';
import { Inter, Crimson_Text } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
const crimson = Crimson_Text({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-heading' });

export const metadata: Metadata = {
  title: 'Vilniaus miesto dekanatas | Vilnius City Deanery',
  description: 'Vilniaus miesto dekanatas - oficialus portalas | Vilnius City Deanery official portal',
  keywords: ['Vilnius Deanery', 'Vilniaus dekanatas', 'Catholic Church', 'Lithuania'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="lt" className={`${inter.variable} ${crimson.variable}`}>
      <body className="font-body bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-b">
          <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⛪</span>
              <div>
                <h1 className="font-heading text-xl font-semibold">Vilniaus miesto dekanatas</h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">Vilnius City Deanery</p>
              </div>
            </div>
            <div className="hidden md:flex gap-6 text-sm">
              <a href="/" className="hover:text-primary transition-colors">Pagrindinis</a>
              <a href="/directory" className="hover:text-primary transition-colors">Parapijos</a>
              <a href="/events" className="hover:text-primary transition-colors">Renginiai</a>
              <a href="/shop" className="hover:text-primary transition-colors">Parduotuvė</a>
            </div>
          </nav>
        </header>
        <main className="container mx-auto px-4 py-8">{children}</main>
        <footer className="bg-primary text-white py-8 mt-16">
          <div className="container mx-auto px-4 text-center">
            <p className="font-heading text-lg mb-2">Vilniaus miesto dekanatas</p>
            <p className="text-sm opacity-80 mb-2">Dekanas: Kun. Dr. Jonas Ivanauskas</p>
            <p className="text-xs opacity-60">© 2026 Vilniaus arkivyskupija</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
