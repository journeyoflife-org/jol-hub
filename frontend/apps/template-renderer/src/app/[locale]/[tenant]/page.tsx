/**
 * Tenant home — `/{locale}/{tenant}` (STEP 6).
 *
 * Rendering strategy (see RENDERING.md): ISR intent (`revalidate = 300`).
 * The root layout reads `headers()` for `<html lang>`, which opts the whole
 * tenant subtree into per-request rendering — so the revalidate window is
 * realized at the DATA cache layer (content-api) rather than as a cached
 * full-page. Behavior is equivalent for visitors: content refreshes within
 * the window without a cold render every hit.
 *
 * Content link (fixture-first): a seed fixture's home page renders via
 * TemplateRenderer (the 12 pilot tenants keep their exact output); tenants
 * without a fixture home render their vertical-specific template (STEP 7) —
 * vertical accent, hero variant and default module composition.
 *
 * SEO: canonical + hreflang alternates + Open Graph (page-seo). Fixture homes
 * emit Organization/WebSite JSON-LD here; vertical templates emit their own
 * vertical-aware JSON-LD (BaseTemplate).
 */
import type { Metadata } from 'next';
import {
  JsonLd,
  organizationEntity,
  websiteEntity,
} from '@/lib/json-ld';
import { buildTenantMetadata, tenantDisplayName, tenantTagline } from '@/lib/page-seo';
import { getTemplateForTenant } from '@/lib/template-registry';
import { renderFixtureRoute, resolveTenantRoute } from '@/lib/route-dispatch';

// ISR intent: refresh home content within 5 minutes. See RENDERING.md for
// the headers()/lang constraint that pins full-page rendering dynamic.
export const revalidate = 300;

interface TenantHomeParams {
  locale: string;
  tenant: string;
}

export async function generateMetadata({
  params,
}: {
  params: TenantHomeParams;
}): Promise<Metadata> {
  const { tenant, fixture, locale } = resolveTenantRoute(params);
  const name = tenantDisplayName(tenant, fixture, locale);
  const description = tenantTagline(fixture, locale) ?? name;
  return buildTenantMetadata({
    tenant,
    fixture,
    locale,
    route: '/',
    title: name,
    description,
  });
}

export default async function TenantHomePage({ params }: { params: TenantHomeParams }) {
  const { tenant, fixture, locale, basePath } = resolveTenantRoute(params);

  // Fixture-first fidelity: the seed home page wins when present, with
  // Organization/WebSite JSON-LD (identity contact fields from the fixture —
  // never fabricated).
  const fixtureHome = renderFixtureRoute(fixture, '/', basePath);
  if (fixtureHome) {
    const name = tenantDisplayName(tenant, fixture, locale);
    const org = organizationEntity({
      name,
      url: basePath,
      vertical: tenant.vertical,
      address: fixture?.identity?.address,
      phone: fixture?.identity?.phone,
      email: fixture?.identity?.email,
    });
    return (
      <>
        <JsonLd data={[org, websiteEntity(name, basePath)]} />
        {fixtureHome}
      </>
    );
  }

  // STEP 7: vertical-specific template — vertical accent, hero variant and the
  // vertical's default module composition. BaseTemplate emits the vertical-aware
  // Organization/WebSite JSON-LD; template selection honors the registry's
  // `templateOverride` entitlement.
  const Template = await getTemplateForTenant(tenant);
  return <Template tenant={tenant} locale={locale} basePath={basePath} />;
}
