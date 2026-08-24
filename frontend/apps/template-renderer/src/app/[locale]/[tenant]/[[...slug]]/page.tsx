/**
 * Catch-all tenant route: `/{locale}/{tenant}` and `/{locale}/{tenant}/{...slug}`.
 *
 * STEP 5 resolution chain endpoint — content link:
 *   1. `[tenant]` segment → closed lookup: seed-data fixture OR STEP-5
 *      registry (Wave-1 tenants without content yet). Unknown → bare 404.
 *   2. Content: backend content API first (RLS-scoped), seed-data fixture
 *      as the pilot fallback.
 *   3. Shared compliance routes (`/privacy`, `/cookies`, `/consent`, `/dsr`)
 *      → shared templates (fixture identity required).
 *   4. Template: fixture tenants render via TemplateRenderer; registry-only
 *      tenants via the lazy vertical template from the template registry.
 *
 * Unknown tenants, unknown pages and unknown locales render the same bare
 * 404 (GDPR Art. 9 / SOC 2 CC6.1: no tenant enumeration).
 *
 * STEP 4: metadata is locale-aware and emits hreflang alternates for every
 * supported locale of the SAME tenant (never cross-tenant).
 */
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { isSupportedLocale, LOCALE_HREFLANG, getMessages, translate } from '@jol-hub/i18n';
import { DEFAULT_LOCALE } from '@jol-hub/i18n/config';
import type { SupportedLocale } from '@jol-hub/i18n';
import { findTenantBySlug } from '@jol-hub/tenant-resolver';
import type { TenantPage } from '@jol-hub/seed-data';
import {
  findTenantPage,
  isSharedRoute,
  loadTenantFixture,
} from '@/lib/content-loader';
import { ContentApiError, fetchTenantPage } from '@/lib/content-api';
import { SharedCompliancePage } from '@/components/SharedCompliancePage';
import { TemplateRenderer } from '@/components/TemplateRenderer';
import { buildAlternates, pickLocalized } from '@/lib/i18n-helpers';
import { getTemplateForTenant } from '@/lib/template-registry';

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

/** Backend content failures → typed UX (upgrade prompt / retry notice). */
function ContentErrorNotice({
  kind,
  locale,
}: {
  kind: 'forbidden' | 'server-error';
  locale: SupportedLocale;
}) {
  const messages = getMessages(locale);
  // 403 = subscription gate (upgrade prompt), 5xx = transient (retry by
  // reload). Dedicated catalog copy for both lands with the billing
  // vertical keys (i18n parity); until then the generic error text is
  // shown rather than hard-coded strings.
  return (
    <section
      data-content-error={kind}
      className="max-w-md mx-auto text-center space-y-4 py-16"
    >
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
  params: TenantPageParams;
}): Promise<Metadata> {
  const fixture = loadTenantFixture(params.tenant);
  const registryTenant = findTenantBySlug(params.tenant);
  // Unknown tenant: return empty metadata — the body is a bare 404 and must
  // not leak any tenant hints.
  if (!fixture && !registryTenant) return {};

  const locale: SupportedLocale = isSupportedLocale(params.locale)
    ? params.locale
    : DEFAULT_LOCALE;
  const route = routeFromParams(params.slug);
  const page =
    fixture && !isSharedRoute(route) ? findTenantPage(fixture, route) : undefined;

  const tenantName = fixture
    ? pickLocalized(fixture.name, locale)
    : pickLocalized(registryTenant!.name, locale);
  const title = page ? `${pickLocalized(page.title, locale)} | ${tenantName}` : tenantName;
  const description =
    page?.meta?.description ??
    (fixture
      ? `${tenantName} — ${pickLocalized(fixture.tagline, locale)}`
      : tenantName);
  const alternates = buildAlternates(params.tenant, route);

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

export default async function TenantPage({ params }: { params: TenantPageParams }) {
  const fixture = loadTenantFixture(params.tenant);
  const registryTenant = findTenantBySlug(params.tenant);
  if (!fixture && !registryTenant) {
    notFound();
  }

  const locale: SupportedLocale = isSupportedLocale(params.locale)
    ? params.locale
    : DEFAULT_LOCALE;

  const route = routeFromParams(params.slug);
  const basePath = `/${locale}/${params.tenant}`;

  if (isSharedRoute(route)) {
    // Compliance pages render from fixture identity (pilot contract).
    if (!fixture) notFound();
    return (
      <SharedCompliancePage route={route} fixture={fixture} basePath={basePath} locale={locale} />
    );
  }

  // Content link of the chain: backend API (RLS-scoped) → fixture fallback.
  let page: TenantPage | undefined;
  if (registryTenant) {
    try {
      page = (await fetchTenantPage(registryTenant, route)) ?? undefined;
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
  }
  if (!page && fixture) {
    page = findTenantPage(fixture, route);
  }

  if (!page) {
    // Fixture tenants: unknown page → bare 404 (no enumeration).
    // Registry-only tenants: the HOME route renders the vertical scaffold
    // (hero + chrome) until backend content ships; deeper routes 404.
    if (fixture || route !== '/') {
      notFound();
    }
    const Scaffold = await getTemplateForTenant(registryTenant!);
    return <Scaffold tenant={registryTenant!} locale={locale} basePath={basePath} />;
  }

  // Fixture-era rendering path (the 12 seed tenants keep their exact output).
  if (fixture) {
    return <TemplateRenderer fixture={fixture} page={page} basePath={basePath} />;
  }

  // Registry-only tenant: lazy-loaded vertical template (template registry).
  const Template = await getTemplateForTenant(registryTenant!);
  return <Template tenant={registryTenant!} locale={locale} basePath={basePath} pageData={page} />;
}
