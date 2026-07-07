import type { Metadata } from 'next';
import { Inter, Crimson_Text } from 'next/font/google';
import './globals.css';
import { entityConfig } from '@/config/entity';
import { navigationConfig } from '@/config';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
const crimson = Crimson_Text({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-heading' });

export const metadata: Metadata = {
  title: {
    default: `${entityConfig.name.lt} | ${entityConfig.name.en}`,
    template: `%s | ${entityConfig.name.lt}`,
  },
  description: `${entityConfig.name.lt} - Vilnius Cathedral Basilica of St. Stanislaus and St. Ladislaus. Mass schedules, heritage, and cathedral events.`,
  keywords: ['Vilnius Cathedral', 'Vilniaus Katedra', 'Catholic Church', 'Lithuania', 'Basilica', 'Cathedral'],
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
                <h1 className="font-heading text-xl font-semibold">Vilniaus Katedra</h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">Vilnius Cathedral Basilica</p>
              </div>
            </div>
            <div className="hidden md:flex gap-6 text-sm">
              {navigationConfig.mainNav.map((item) => (
                <a key={item.href} href={item.href} className="hover:text-primary transition-colors">
                  {item.label.lt}
                </a>
              ))}
            </div>
          </nav>
        </header>
        <main className="container mx-auto px-4 py-8">{children}</main>
        <footer className="bg-primary text-white py-8 mt-16">
          <div className="container mx-auto px-4 text-center">
            <p className="font-heading text-lg mb-2">{entityConfig.name.lt}</p>
            <p className="text-sm opacity-80 mb-4">{entityConfig.address.street}, {entityConfig.address.postalCode} {entityConfig.address.city}</p>
            <div className="flex justify-center gap-4 text-xs opacity-60 mb-4">
              {navigationConfig.footerNav.map((item) => (
                <a key={item.href} href={item.href} className="hover:text-white">{item.label.lt}</a>
              ))}
            </div>
            <p className="text-xs opacity-60">© {new Date().getFullYear()} Vilniaus arkivyskupija. Visos teisės saugomos.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
