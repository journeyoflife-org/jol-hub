import Link from 'next/link';
import { Button } from '@jol-hub/ui';
import { entityConfig } from '@/config/entity';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-heading">{entityConfig.name.lt}</h1>
              <p className="text-sm text-gray-300">{entityConfig.name.en}</p>
            </div>
            <nav className="hidden md:flex gap-6 text-sm">
              <Link href="/locate" className="hover:text-cemetery-bronze transition-colors">
                Kapo paieška
              </Link>
              <Link href="/shop" className="hover:text-cemetery-bronze transition-colors">
                Paslaugos
              </Link>
              <Link href="/maintenance" className="hover:text-cemetery-bronze transition-colors">
                Priežiūra
              </Link>
              <Link href="/monuments" className="hover:text-cemetery-bronze transition-colors">
                Paminklai
              </Link>
              <Link href="/#contact" className="hover:text-cemetery-bronze transition-colors">
                Kontaktai
              </Link>
            </nav>
            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-primary" asChild>
              <a href={`tel:${entityConfig.contact.phone}`}>Skambinti</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary to-primary/80 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-heading mb-4">
            Orus poilsis amžinybėje
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Restful Peace for Eternity
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button size="lg" className="bg-cemetery-bronze hover:bg-cemetery-bronze/90" asChild>
              <Link href="/locate">Rasti kapą</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white" asChild>
              <Link href="/shop">Paslaugos</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12">
            <div>
              <p className="text-4xl font-bold text-cemetery-bronze">{entityConfig.business.totalPlots.toLocaleString()}</p>
              <p className="text-sm text-gray-400">Viso kapų</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-cemetery-bronze">{entityConfig.statistics.totalInterments.toLocaleString()}</p>
              <p className="text-sm text-gray-400">Palaidojimų</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-cemetery-bronze">{entityConfig.statistics.activeMaintenanceContracts.toLocaleString()}</p>
              <p className="text-sm text-gray-400">Priežiūros sutarčių</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-cemetery-bronze">{entityConfig.statistics.annualVisitors.toLocaleString()}</p>
              <p className="text-sm text-gray-400">Lankytojų per metus</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Services */}
          <div className="lg:col-span-2">
            {/* Quick Actions */}
            <section className="grid md:grid-cols-2 gap-4 mb-8">
              <Link href="/locate" className="p-6 bg-white border rounded-lg hover:shadow-md transition-all">
                <h4 className="font-heading text-lg text-primary mb-2">🗺️ Kapo paieška / Grave Locator</h4>
                <p className="text-sm text-gray-600">
                  Raskite artimųjų kapus pagal vardą, pavardę ar kapo numerį.
                </p>
              </Link>
              <Link href="/maintenance" className="p-6 bg-white border rounded-lg hover:shadow-md transition-all">
                <h4 className="font-heading text-lg text-primary mb-2">🧹 Priežiūros planai / Maintenance Plans</h4>
                <p className="text-sm text-gray-600">
                  Užsiprenumeruokite kapo priežiūrą - savaitinę, mėnesinę ar ketvirtinę.
                </p>
              </Link>
              <Link href="/monuments" className="p-6 bg-white border rounded-lg hover:shadow-md transition-all">
                <h4 className="font-heading text-lg text-primary mb-2">🏛️ Paminklai / Monuments</h4>
                <p className="text-sm text-gray-600">
                  Granitiniai, marmuriniai, bronziniai paminklai su individualizacija.
                </p>
              </Link>
              <Link href="/shop?tab=flowers" className="p-6 bg-white border rounded-lg hover:shadow-md transition-all">
                <h4 className="font-heading text-lg text-primary mb-2">💐 Gėlių pristatymas / Flower Delivery</h4>
                <p className="text-sm text-gray-600">
                  Užsakykite gėlių pristatymą tiesiai į kapą.
                </p>
              </Link>
            </section>

            {/* Services List */}
            <section>
              <h3 className="text-2xl font-heading mb-6 text-primary">Mūsų paslaugos / Our Services</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {entityConfig.services.slice(0, 4).map((service) => (
                  <div key={service.id} className="p-4 bg-white border rounded-lg hover:shadow-md transition-shadow">
                    <h4 className="font-heading text-lg text-primary">{service.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{service.nameEn}</p>
                    <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-primary">€{service.price}</span>
                      <Button size="sm" asChild>
                        <Link href={`/shop?service=${service.id}`}>Užsakyti</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside>
            {/* Cemetery Sections */}
            <div className="p-6 bg-white border rounded-lg mb-6">
              <h4 className="font-heading text-lg text-primary mb-4">Kapinių sekcijos / Sections</h4>
              <div className="space-y-3 text-sm">
                {entityConfig.sections.map((section) => (
                  <div key={section.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{section.name}</p>
                      <p className="text-gray-600 text-xs">{section.type} - since {section.yearEstablished}</p>
                    </div>
                    <Link href={`/locate?section=${section.name}`}>
                      <Button variant="outline" size="sm">Žiūrėti</Button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Card */}
            <div id="contact" className="p-6 bg-white border rounded-lg mb-6">
              <h4 className="font-heading text-lg text-primary mb-4">Kontaktai / Contact</h4>
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
                  <strong>📧 El. paštas:</strong><br />
                  <a href={`mailto:${entityConfig.contact.email}`} className="text-primary hover:underline">
                    {entityConfig.contact.email}
                  </a>
                </p>
                <p>
                  <strong>🕐 Darbo laikas:</strong><br />
                  Vasarą: {entityConfig.contact.hours.summer}<br />
                  Žiemą: {entityConfig.contact.hours.winter}<br />
                  <span className="text-gray-500">Biuras: {entityConfig.contact.hours.office}</span>
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
                <li>✓ Deceased Data Protection</li>
                <li>✓ Long-term Contract Management</li>
                <li>✓ Data Residency: Lithuania/EU</li>
              </ul>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-primary text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-sm">
            <div>
              <h5 className="font-heading text-lg mb-3">{entityConfig.name.lt}</h5>
              <p className="text-gray-400">{entityConfig.name.en}</p>
              <p className="text-gray-400 mt-2">Įkurta: {entityConfig.business.established}</p>
              <p className="text-gray-400">Licencija: {entityConfig.business.license}</p>
            </div>
            <div>
              <h5 className="font-medium mb-3">Nuorodos / Links</h5>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/locate" className="hover:text-cemetery-bronze">Kapo paieška</Link></li>
                <li><Link href="/shop" className="hover:text-cemetery-bronze">Paslaugos</Link></li>
                <li><Link href="/maintenance" className="hover:text-cemetery-bronze">Priežiūra</Link></li>
                <li><Link href="/monuments" className="hover:text-cemetery-bronze">Paminklai</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium mb-3">Teisinė informacija / Legal</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/privacy" className="hover:text-cemetery-bronze">Privatumo politika</a></li>
                <li><a href="/terms" className="hover:text-cemetery-bronze">Naudojimo sąlygos</a></li>
                <li><a href="/deceased-data" className="hover:text-cemetery-bronze">Duomenų apsauga</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-gray-700 text-center text-xs text-gray-500">
            <p>© {new Date().getFullYear()} {entityConfig.name.lt}. Visos teisės saugomos.</p>
            <p className="mt-1">Powered by JOL-HUB | GDPR + PCI-DSS Compliant | Deceased Data Protected</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
