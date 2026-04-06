import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { entityConfig } from '@/config/entity';
import { navigationConfig } from '@/config';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: `${entityConfig.name.lt} | ${entityConfig.name.en}`,
    template: `%s | ${entityConfig.name.lt}`,
  },
  description: `${entityConfig.name.lt} - Greek Catholic Church in Vilnius, Lithuania. Divine Liturgy, Byzantine icons, Eastern Christian tradition in communion with Rome.`,
  keywords: ['greek catholic', 'byzantine', 'Vilnius', 'Lithuania', 'Ukrainian Greek Catholic', 'Divine Liturgy', 'icons'],
  authors: [{ name: 'JOL-HUB' }],
  openGraph: {
    title: entityConfig.name.lt,
    description: entityConfig.name.en,
    type: 'website',
    locale: 'lt_LT',
    alternateLocale: ['en_GB', 'uk_UA'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="lt" className={inter.variable}>
      <body className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="header-byzantine text-white shadow-lg">
          <div className="container mx-auto px-4">
            <div className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="triple-bar-cross"></span>
                <div>
                  <h1 className="text-xl font-byzantine font-bold">{entityConfig.name.lt}</h1>
                  <p className="text-sm text-gray-300">{entityConfig.name.uk}</p>
                </div>
              </div>
              <div className="text-right text-sm">
                <p>{entityConfig.address.street}</p>
                <p>{entityConfig.address.postalCode} {entityConfig.address.city}</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="py-2 border-t border-purple-800">
              <ul className="flex gap-6">
                {navigationConfig.mainNav.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="hover:text-byzantine-gold transition-colors"
                    >
                      {item.label.lt}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="footer-byzantine py-8">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Contact */}
              <div>
                <h3 className="font-byzantine text-lg mb-4">Kontaktai / Контакти</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>📍 {entityConfig.address.street}</li>
                  <li>📞 {entityConfig.contact.phone}</li>
                  <li>📧 {entityConfig.contact.email}</li>
                  <li>🌐 {entityConfig.contact.website}</li>
                </ul>
              </div>

              {/* Ecclesiastical */}
              <div>
                <h3 className="font-byzantine text-lg mb-4">Bažnytinė valdžia / Церковна влада</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>{entityConfig.ecclesiastical.church}</li>
                  <li>{entityConfig.ecclesiastical.eparchy}</li>
                  <li>{entityConfig.ecclesiastical.rite}</li>
                  <li>{entityConfig.ecclesiastical.calendar}</li>
                </ul>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="font-byzantine text-lg mb-4">Nuorodos / Посилання</h3>
                <ul className="space-y-2 text-sm">
                  {navigationConfig.footerNav.map((item) => (
                    <li key={item.href}>
                      <a href={item.href} className="text-gray-300 hover:text-white">
                        {item.label.lt}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm text-gray-400">
              <p>© {new Date().getFullYear()} {entityConfig.name.lt}. Visos teisės saugomos.</p>
              <p className="mt-1">☦ Христос посеред нас! / Christ is among us!</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
