/**
 * Required catch-all tenant route: `/{locale}/{tenant}/{...slug}`.
 *
 * STEP 6 routing: the home path (`/{locale}/{tenant}`) is owned by
 * `[tenant]/page.tsx`, and the specific collections/static pages (about,
 * contact, news, events, services) own their own segments — all of which take
 * precedence over this catch-all (Next.js static > dynamic > catch-all). This
 * route therefore handles what is left:
 *
 *   1. Shared compliance routes (`/privacy`, `/cookies`, `/consent`, `/dsr`)
 *      → shared templates (fixture identity required).
 *   2. Arbitrary fixture pages not covered by a specific route (`/gallery`,
 *      `/obituaries`, `/sacraments`, …) → TemplateRenderer (pilot fidelity).
 *   3. Backend content (RLS-scoped) when that service ships.
 *   4. Everything else → bare 404.
 *
 * Unknown tenants, unknown pages and unknown locales render the same bare 404
 * (GDPR Art. 9 / SOC 2 CC6.1: no tenant enumeration).
 */
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getMessages, translate, isSupportedLocale } from '@jol-hub/i18n';
import { DEFAULT_LOCALE } from '@jol-hub/i18n/config';
import type { SupportedLocale } from '@jol-hub/i18n';
import type { TenantPage } from '@jol-hub/seed-data';
import { findTenantPage, isSharedRoute } from '@/lib/content-loader';
import { ContentApiError, fetchTenantPage } from '@/lib/content-api';
import { SharedCompliancePage } from '@/components/SharedCompliancePage';
import { TemplateRenderer } from '@/components/TemplateRenderer';
import { buildAlternates, pickLocalized } from '@/lib/i18n-helpers';
import { getTemplateForTenant } from '@/lib/template-registry';
import { resolveTenantRoute } from '@/lib/route-dispatch';

// Tenant resolution is request-scoped (headers/subdomains) and fixtures can
// change between deploys — never serve stale static output.
export const dynamic = 'force-dynamic';

interface TenantCatchAllParams {
  locale: string;
  tenant: string;
  /** Required catch-all — always at least one segment (home lives elsewhere). */
  slug: string[];
}

function routeFromParams(slug: string[]): string {
  return `/${slug.join('/')}`;
}

/** Backend content failures → typed UX (upgrade prompt / retry notice). */
function ContentErrorNotice({
  kind,
  locale,
}: {
  kind: 'forbidden' | 'server-error';
  locale: SupportedLocale;
}) {
  const messages = getMessages(locale);
  return (
    <section data-content-error={kind} className="max-w-md mx-auto text-center space-y-4 py-16">
      <h1 className="text-2xl font-heading font-bold">
        {translate(messages, 'errors.notFoundTitle')}
      </h1>
      <p className="text-gray-600">{translate(messages, 'errors.generic')}</p>
    </section>
  );
}

export async function generateMetadata({
  params,
}: {
  params: TenantCatchAllParams;
}): Promise<Metadata> {
  const { tenant, fixture, locale } = resolveTenantRoute(params);
  const route = routeFromParams(params.slug);
  const page = fixture && !isSharedRoute(route) ? findTenantPage(fixture, route) : undefined;

  const tenantName = pickLocalized(
    fixture ? fixture.name : tenant.name,
    locale,
  );
  const title = page ? `${pickLocalized(page.title, locale)} | ${tenantName}` : tenantName;
  const description =
    page?.meta?.description ??
    (fixture ? `${tenantName} — ${pickLocalized(fixture.tagline, locale)}` : tenantName);

  return {
    title,
    description,
    alternates: buildAlternates(params.tenant, route),
  };
}

export default async function TenantCatchAllPage({ params }: { params: TenantCatchAllParams }) {
  const { tenant, fixture, locale, basePath } = resolveTenantRoute(params);
  const route = routeFromParams(params.slug);

  if (isSharedRoute(route)) {
    // Compliance pages render from fixture identity (pilot contract).
    if (!fixture) notFound();
    return (
      <SharedCompliancePage route={route} fixture={fixture} basePath={basePath} locale={locale} />
    );
  }

  // Content link of the chain: backend API (RLS-scoped) → fixture fallback.
  let page: TenantPage | undefined;
  try {
    page = (await fetchTenantPage(tenant, route)) ?? undefined;
  } catch (error) {
    if (error instanceof ContentApiError) {
      if (error.kind !== 'not-found') {
        return <ContentErrorNotice kind={error.kind} locale={locale} />;
      }
      // 'not-found' → fall through to fixture / bare 404 below.
    } else {
      throw error;
    }
  }
  if (!page && fixture) {
    page = findTenantPage(fixture, route);
  }

  if (!page) {
    // No content for this route: fixture without the page, or a registry-only
    // tenant with no backend content yet. Bare 404 (no enumeration).
    notFound();
  }

  // Fixture-era rendering path (the 12 seed tenants keep their exact output).
  if (fixture) {
    return <TemplateRenderer fixture={fixture} page={page} basePath={basePath} />;
  }

  // Registry-only tenant with a backend page: lazy vertical template.
  const Template = await getTemplateForTenant(tenant);
  return <Template tenant={tenant} locale={locale} basePath={basePath} pageData={page} />;
}
