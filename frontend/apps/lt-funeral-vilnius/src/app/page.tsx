import Link from 'next/link';
import { Button } from '@jol-hub/ui';
import { entityConfig } from '@/config/entity';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-memorial-navy text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-heading">{entityConfig.name.lt}</h1>
              <p className="text-sm text-gray-300">{entityConfig.name.en}</p>
            </div>
            <nav className="hidden md:flex gap-6 text-sm">
              <Link href="/#services" className="hover:text-memorial-gold transition-colors">
                Paslaugos
              </Link>
              <Link href="/obituaries" className="hover:text-memorial-gold transition-colors">
                Nekrologai
              </Link>
              <Link href="/shop" className="hover:text-memorial-gold transition-colors">
                Parduotuvė
              </Link>
              <Link href="/pre-need" className="hover:text-memorial-gold transition-colors">
                Išankstinis planavimas
              </Link>
              <Link href="/#contact" className="hover:text-memorial-gold transition-colors">
                Kontaktai
              </Link>
            </nav>
            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-memorial-navy" asChild>
              <a href={`tel:${entityConfig.contact.emergency}`}>Skubus tel.</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-memorial-navy to-memorial-navy/80 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-heading mb-4">
            Orios atsisveikinimo ceremonijos
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Dignified Farewell Ceremonies
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button size="lg" asChild>
              <Link href="/#services">Mūsų paslaugos</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white" asChild>
              <Link href="/obituaries">Nekrologai</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12">
            <div>
              <p className="text-4xl font-bold text-memorial-gold">{entityConfig.statistics.yearsInService}+</p>
              <p className="text-sm text-gray-400">Metų patirtis</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-memorial-gold">{entityConfig.statistics.familiesServed.toLocaleString()}+</p>
              <p className="text-sm text-gray-400">Šeimų aptarnauta</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-memorial-gold">{entityConfig.statistics.averageRating}</p>
              <p className="text-sm text-gray-400">Įvertinimas</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-memorial-gold">{entityConfig.statistics.preNeedContracts}+</p>
              <p className="text-sm text-gray-400">Pre-need sutarčių</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Services */}
          <div className="lg:col-span-2">
            <section id="services">
              <h3 className="text-2xl font-heading mb-6 text-primary">Mūsų paslaugos / Our Services</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {entityConfig.servicePackages.map((pkg) => (
                  <div key={pkg.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <h4 className="font-heading text-lg text-memorial-navy">{pkg.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{pkg.nameEn}</p>
                    <p className="text-gray-600 text-sm mb-3">{pkg.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-memorial-gold">€{pkg.price.toLocaleString()}</span>
                      <Button size="sm" asChild>
                        <Link href={`/shop?package=${pkg.id}`}>Daugiau</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Quick Links */}
            <section className="mt-12 grid md:grid-cols-2 gap-6">
              <Link href="/obituaries" className="p-6 bg-memorial-cream border rounded-lg hover:shadow-md transition-all">
                <h4 className="font-heading text-lg text-primary mb-2">📰 Nekrologai / Obituaries</h4>
                <p className="text-sm text-gray-600">
                  Peržiūrėkite naujausius nekrologus ir atsisveikinimo ceremonijų informaciją.
                </p>
              </Link>
              <Link href="/pre-need" className="p-6 bg-memorial-cream border rounded-lg hover:shadow-md transition-all">
                <h4 className="font-heading text-lg text-primary mb-2">📋 Išankstinis planavimas / Pre-Need Planning</h4>
                <p className="text-sm text-gray-600">
                  Suplanuokite savo atsisveikinimą iš anksto ir palikite šeimą nuo rūpesčių.
                </p>
              </Link>
            </section>
          </div>

          {/* Sidebar */}
          <aside>
            {/* Contact Card */}
            <div id="contact" className="p-6 bg-white border rounded-lg mb-6">
              <h4 className="font-heading text-lg text-primary mb-4">Kontakt informacija / Contact</h4>
              <div className="space-y-3 text-sm">
                <p>
                  <strong>📍 Adresas:</strong><br />
                  {entityConfig.address.street}<br />
                  {entityConfig.address.postalCode} {entityConfig.address.city}
                </p>
                <p>
                  <strong>📞 Telefonas:</strong><br />
                  <a href={`tel:${entityConfig.contact.phone}`} className="text-primary hover:underline">
                    {entityConfig.contact.phone}
                  </a>
                </p>
                <p>
                  <strong>🚨 Skubus:</strong><br />
                  <a href={`tel:${entityConfig.contact.emergency}`} className="text-memorial-gold hover:underline font-medium">
                    {entityConfig.contact.emergency}
                  </a>
                  <span className="text-xs text-gray-500 block">24/7</span>
                </p>
                <p>
                  <strong>📧 El. paštas:</strong><br />
                  <a href={`mailto:${entityConfig.contact.email}`} className="text-primary hover:underline">
                    {entityConfig.contact.email}
                  </a>
                </p>
                <p>
                  <strong>🕐 Darbo laikas:</strong><br />
                  I-V: {entityConfig.contact.hours.weekdays}<br />
                  VI-VII: {entityConfig.contact.hours.weekends}<br />
                  <span className="text-memorial-gold">Skubus: 24/7</span>
                </p>
              </div>
            </div>

            {/* Compliance Badge */}
            <div className="p-4 bg-gray-50 rounded-lg text-xs text-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <span>🔒</span>
                <strong>Compliance & Security</strong>
              </div>
              <ul className="space-y-1">
                <li>✓ GDPR Compliant</li>
                <li>✓ PCI-DSS Level 2 Certified</li>
                <li>✓ Tamper-Evident Audit Logging</li>
                <li>✓ Data Residency: Lithuania/EU</li>
              </ul>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-memorial-navy text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-sm">
            <div>
              <h5 className="font-heading text-lg mb-3">{entityConfig.name.lt}</h5>
              <p className="text-gray-400">{entityConfig.name.en}</p>
              <p className="text-gray-400 mt-2">Licencija: {entityConfig.business.license}</p>
            </div>
            <div>
              <h5 className="font-medium mb-3">Nuorodos / Links</h5>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/obituaries" className="hover:text-memorial-gold">Nekrologai</Link></li>
                <li><Link href="/shop" className="hover:text-memorial-gold">Parduotuvė</Link></li>
                <li><Link href="/pre-need" className="hover:text-memorial-gold">Pre-need planavimas</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium mb-3">Teisinė informacija / Legal</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/privacy" className="hover:text-memorial-gold">Privatumo politika</a></li>
                <li><a href="/terms" className="hover:text-memorial-gold">Naudojimo sąlygos</a></li>
                <li><a href="/cookies" className="hover:text-memorial-gold">Slapukai</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-gray-700 text-center text-xs text-gray-500">
            <p>© {new Date().getFullYear()} {entityConfig.name.lt}. Visos teisės saugomos.</p>
            <p className="mt-1">Powered by JOL-HUB | GDPR + PCI-DSS Compliant</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
