import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { entityConfig } from '@/config/entity';
import { navigationConfig } from '@/config';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: `${entityConfig.name.lt} | ${entityConfig.name.en}`,
    template: `%s | ${entityConfig.name.lt}`,
  },
  description: `${entityConfig.name.lt} - Evangelical Lutheran Church in Kaunas, Lithuania. Worship services, community events, and Lutheran fellowship.`,
  keywords: ['lutheran', 'protestant', 'Kaunas', 'Lithuania', 'church', 'evangelical', 'Lietuva'],
  authors: [{ name: 'JOL-HUB' }],
  openGraph: {
    title: entityConfig.name.lt,
    description: entityConfig.name.en,
    type: 'website',
    locale: 'lt_LT',
    alternateLocale: 'en_GB',
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
        <header className="bg-primary text-white shadow-lg">
          <div className="container mx-auto px-4">
            <div className="py-4 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-heading font-bold">{entityConfig.name.lt}</h1>
                <p className="text-sm text-gray-300">{entityConfig.name.en}</p>
              </div>
              <div className="text-right text-sm">
                <p>{entityConfig.address.street}</p>
                <p>{entityConfig.address.postalCode} {entityConfig.address.city}</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="py-2 border-t border-primary-700">
              <ul className="flex gap-6">
                {navigationConfig.mainNav.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="hover:text-lutheran-gold transition-colors"
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
        <footer className="bg-gray-800 text-white py-8">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Contact */}
              <div>
                <h3 className="font-heading text-lg mb-4">Kontaktai / Contact</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>📍 {entityConfig.address.street}</li>
                  <li>📞 {entityConfig.contact.phone}</li>
                  <li>📧 {entityConfig.contact.email}</li>
                  <li>🌐 {entityConfig.contact.website}</li>
                </ul>
              </div>

              {/* Governance */}
              <div>
                <h3 className="font-heading text-lg mb-4">Valdymas / Governance</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>{entityConfig.governance.synodAffiliation.name}</li>
                  <li>Bažnyčios taryba: {entityConfig.governance.churchCouncil.members} nariai</li>
                  <li>Kiti rinkimai: {entityConfig.governance.churchCouncil.nextElection}</li>
                </ul>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="font-heading text-lg mb-4">Nuorodos / Links</h3>
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
              <p className="mt-1">
                <a href="/privacy" className="hover:text-white">Privatumo politika / Privacy Policy</a>
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
