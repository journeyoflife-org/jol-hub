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
 * without a fixture home compose the STEP 6 default modules via PageComposer.
 *
 * SEO: canonical + hreflang alternates + Open Graph (page-seo) and
 * Organization / WebSite JSON-LD. The organization `@type` follows the
 * vertical (ReligiousOrganization / LocalBusiness / FuneralHome).
 */
import type { Metadata } from 'next';
import {
  JsonLd,
  organizationEntity,
  websiteEntity,
} from '@/lib/json-ld';
import { buildTenantMetadata, tenantDisplayName, tenantTagline } from '@/lib/page-seo';
import { PageComposer } from '@/lib/page-composer';
import { buildHomeConfig } from '@/lib/page-defaults';
import { parsePageConfig, buildFallbackConfig } from '@/lib/page-config';
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

  // Structured data: organization (vertical-aware @type) + WebSite. Identity
  // contact fields come from the fixture when present (never fabricated).
  const name = tenantDisplayName(tenant, fixture, locale);
  const org = organizationEntity({
    name,
    url: basePath,
    vertical: tenant.vertical,
    address: fixture?.identity?.address,
    phone: fixture?.identity?.phone,
    email: fixture?.identity?.email,
  });
  const jsonLd = <JsonLd data={[org, websiteEntity(name, basePath)]} />;

  // Fixture-first fidelity: the seed home page wins when present.
  const fixtureHome = renderFixtureRoute(fixture, '/', basePath);
  if (fixtureHome) {
    return (
      <>
        {jsonLd}
        {fixtureHome}
      </>
    );
  }

  // STEP 6 composition. Defaults are built in-code (always valid); route them
  // through the Zod parser anyway so an API-sourced config follows the exact
  // same validated → fallback path (graceful degradation).
  const parsed = parsePageConfig(buildHomeConfig(), '/');
  const config = parsed.ok && parsed.config ? parsed.config : buildFallbackConfig('/');

  return (
    <>
      {jsonLd}
      <PageComposer config={config} tenant={tenant} locale={locale} basePath={basePath} />
    </>
  );
}
