/**
 * Catch-all tenant route: `/<tenant>` and `/<tenant>/<...slug>`.
 *
 * Resolution order:
 *   1. `[tenant]` segment → fixture lookup (closed registry, no enumeration).
 *   2. Shared compliance routes (`/privacy`, `/cookies`, `/consent`, `/dsr`)
 *      → shared templates (not fixture content).
 *   3. `[[...slug]]` → tenant-relative page route inside the fixture.
 *
 * Unknown tenants and unknown pages render the same bare 404
 * (GDPR Art. 9 / SOC 2 CC6.1: no tenant enumeration).
 */
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  findTenantPage,
  isSharedRoute,
  loadTenantFixture,
} from '@/lib/content-loader';
import { SharedCompliancePage } from '@/components/SharedCompliancePage';
import { TemplateRenderer } from '@/components/TemplateRenderer';

// Tenant resolution is request-scoped (headers/subdomains) and fixtures can
// change between deploys — never serve stale static output.
export const dynamic = 'force-dynamic';

interface TenantPageParams {
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

  const route = routeFromParams(params.slug);
  const page = isSharedRoute(route) ? undefined : findTenantPage(fixture, route);
  const title = page ? `${page.title.lt} | ${fixture.name.lt}` : fixture.name.lt;
  const description =
    page?.meta?.description ?? `${fixture.name.lt} — ${fixture.tagline.lt}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'lt_LT',
      alternateLocale: 'en_GB',
    },
  };
}

export default function TenantPage({ params }: { params: TenantPageParams }) {
  const fixture = loadTenantFixture(params.tenant);
  if (!fixture) {
    notFound();
  }

  const route = routeFromParams(params.slug);
  const basePath = `/${fixture.slug}`;

  if (isSharedRoute(route)) {
    return <SharedCompliancePage route={route} fixture={fixture} basePath={basePath} />;
  }

  const page = findTenantPage(fixture, route);
  if (!page) {
    notFound();
  }

  return <TemplateRenderer fixture={fixture} page={page} basePath={basePath} />;
}
