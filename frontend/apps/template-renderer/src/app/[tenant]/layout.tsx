/**
 * Tenant chrome: header, navigation and footer for a resolved tenant.
 *
 * SECURITY: an unknown `[tenant]` segment short-circuits to `notFound()` —
 * the response is identical for "tenant does not exist" and "page does not
 * exist", so no tenant enumeration is possible (GDPR Art. 9 / SOC 2 CC6.1).
 */
import { notFound } from 'next/navigation';
import { loadTenantFixture } from '@/lib/content-loader';

interface TenantLayoutParams {
  tenant: string;
}

export default function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: TenantLayoutParams;
}) {
  const fixture = loadTenantFixture(params.tenant);
  if (!fixture) {
    notFound();
  }

  const basePath = `/${fixture.slug}`;
  const navPages = fixture.pages.filter((page) => page.route !== '/');
  const year = new Date().getFullYear();

  return (
    <>
      <header className="bg-primary text-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-heading font-bold">
                <a href={basePath}>{fixture.name.lt}</a>
              </h1>
              {fixture.name.en && <p className="text-sm text-gray-300">{fixture.name.en}</p>}
            </div>
            {fixture.identity?.address && (
              <div className="text-right text-sm hidden md:block">
                <p>{fixture.identity.address}</p>
              </div>
            )}
          </div>

          <nav className="py-2 border-t border-primary-700">
            <ul className="flex gap-6 flex-wrap">
              <li>
                <a href={basePath} className="hover:text-liturgical-gold transition-colors">
                  Pradžia
                </a>
              </li>
              {navPages.map((page) => (
                <li key={page.route}>
                  <a
                    href={`${basePath}${page.route}`}
                    className="hover:text-liturgical-gold transition-colors"
                  >
                    {page.title.lt}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">{children}</div>
      </main>

      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-heading text-lg mb-4">Kontaktai / Contact</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                {fixture.identity?.address && <li>{fixture.identity.address}</li>}
                {fixture.identity?.phone && <li>{fixture.identity.phone}</li>}
                {fixture.identity?.email && <li>{fixture.identity.email}</li>}
              </ul>
            </div>
            <div>
              <h3 className="font-heading text-lg mb-4">Apie / About</h3>
              <p className="text-sm text-gray-300">{fixture.tagline.lt}</p>
            </div>
            <div>
              <h3 className="font-heading text-lg mb-4">Teisinė informacija / Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href={`${basePath}/privacy`} className="text-gray-300 hover:text-white">
                    Privatumo politika / Privacy
                  </a>
                </li>
                <li>
                  <a href={`${basePath}/cookies`} className="text-gray-300 hover:text-white">
                    Slapukai / Cookies
                  </a>
                </li>
                <li>
                  <a href={`${basePath}/consent`} className="text-gray-300 hover:text-white">
                    Sutikimai / Consent
                  </a>
                </li>
                <li>
                  <a href={`${basePath}/dsr`} className="text-gray-300 hover:text-white">
                    Duomenų subjekto teisės / DSR
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm text-gray-400">
            <p>
              © {year} {fixture.name.lt}. Visos teisės saugomos.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
