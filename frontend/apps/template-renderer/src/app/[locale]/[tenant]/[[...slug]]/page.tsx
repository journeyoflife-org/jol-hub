/**
 * Catch-all tenant route: `/{locale}/{tenant}` and `/{locale}/{tenant}/{...slug}`.
 *
 * Resolution order:
 *   1. `[tenant]` segment → fixture lookup (closed registry, no enumeration).
 *   2. Shared compliance routes (`/privacy`, `/cookies`, `/consent`, `/dsr`)
 *      → shared templates (not fixture content).
 *   3. `[[...slug]]` → tenant-relative page route inside the fixture.
 *
 * Unknown tenants, unknown pages and unknown locales render the same bare
 * 404 (GDPR Art. 9 / SOC 2 CC6.1: no tenant enumeration).
 *
 * STEP 4: metadata is locale-aware and emits hreflang alternates for every
 * supported locale of the SAME tenant (never cross-tenant).
 */
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { isSupportedLocale, LOCALE_HREFLANG } from '@jol-hub/i18n';
import { DEFAULT_LOCALE } from '@jol-hub/i18n/config';
import type { SupportedLocale } from '@jol-hub/i18n';
import {
  findTenantPage,
  isSharedRoute,
  loadTenantFixture,
} from '@/lib/content-loader';
import { SharedCompliancePage } from '@/components/SharedCompliancePage';
import { TemplateRenderer } from '@/components/TemplateRenderer';
import { buildAlternates, pickLocalized } from '@/lib/i18n-helpers';

// Tenant resolution is request-scoped (headers/subdomains) and fixtures can
// change between deploys — never serve stale static output.
export const dynamic = 'force-dynamic';

interface TenantPageParams {
  locale: string;
  tenant: string;
  slug?: string[];
}

function routeFromParams(slug: string[] | undefined): string {
  if (!slug || slug.length === 0) return '/';
  return `/${slug.join('/')}`;
}

export async function generateMetadata({
  params,
}: {
  params: TenantPageParams;
}): Promise<Metadata> {
  const fixture = loadTenantFixture(params.tenant);
  // Unknown tenant: return empty metadata — the body is a bare 404 and must
  // not leak any tenant hints.
  if (!fixture) return {};

  const locale: SupportedLocale = isSupportedLocale(params.locale)
    ? params.locale
    : DEFAULT_LOCALE;
  const route = routeFromParams(params.slug);
  const page = isSharedRoute(route) ? undefined : findTenantPage(fixture, route);

  const tenantName = pickLocalized(fixture.name, locale);
  const title = page ? `${pickLocalized(page.title, locale)} | ${tenantName}` : tenantName;
  const description =
    page?.meta?.description ?? `${tenantName} — ${pickLocalized(fixture.tagline, locale)}`;
  const alternates = buildAlternates(fixture.slug, route);

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: LOCALE_HREFLANG[locale],
    },
  };
}

export default function TenantPage({ params }: { params: TenantPageParams }) {
  const fixture = loadTenantFixture(params.tenant);
  if (!fixture) {
    notFound();
  }

  const locale: SupportedLocale = isSupportedLocale(params.locale)
    ? params.locale
    : DEFAULT_LOCALE;

  const route = routeFromParams(params.slug);
  const basePath = `/${locale}/${fixture.slug}`;

  if (isSharedRoute(route)) {
    return (
      <SharedCompliancePage route={route} fixture={fixture} basePath={basePath} locale={locale} />
    );
  }

  const page = findTenantPage(fixture, route);
  if (!page) {
    notFound();
  }

  return <TemplateRenderer fixture={fixture} page={page} basePath={basePath} />;
}
