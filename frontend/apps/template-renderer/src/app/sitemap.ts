/**
 * Per-tenant sitemap (STEP 4 SEO i18n).
 *
 * SECURITY (GDPR Art. 9 / SOC 2 CC6.1): there is deliberately NO hub-level
 * sitemap — a global sitemap would enumerate every tenant. This file only
 * emits URLs when a tenant is resolved for the request (subdomain or
 * X-Tenant header); it lists that ONE tenant's pages across all supported
 * locales with hreflang alternates. Unresolved requests get an empty sitemap.
 */
import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { SUPPORTED_LOCALES, LOCALE_HREFLANG } from '@jol-hub/i18n';
import { loadTenantFixture, SHARED_ROUTES } from '@/lib/content-loader';

export default function sitemap(): MetadataRoute.Sitemap {
  const tenantSlug = headers().get('x-resolved-tenant');
  if (!tenantSlug) return [];

  const fixture = loadTenantFixture(tenantSlug);
  if (!fixture) return [];

  const host = headers().get('host') ?? 'localhost:3000';
  const protocol = host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https';
  const origin = `${protocol}://${host}`;

  const routes = [
    '/',
    ...fixture.pages.filter((page) => page.route !== '/').map((page) => page.route),
    ...SHARED_ROUTES,
  ];

  const lastModified = new Date();

  return routes.map((route) => {
    const path = route === '/' ? '' : route;
    const languages: Record<string, string> = {};
    for (const locale of SUPPORTED_LOCALES) {
      languages[LOCALE_HREFLANG[locale]] = `${origin}/${locale}/${fixture.slug}${path}`;
    }
    return {
      url: `${origin}/lt/${fixture.slug}${path}`,
      lastModified,
      alternates: { languages },
    };
  });
}
