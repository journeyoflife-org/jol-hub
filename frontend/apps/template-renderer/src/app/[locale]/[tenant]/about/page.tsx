/**
 * Tenant about — `/{locale}/{tenant}/about` (STEP 6).
 *
 * Rendering strategy (see RENDERING.md): SSG intent (`revalidate = 3600`);
 * realized at the data cache because the root layout's `headers()` (lang)
 * pins the tenant subtree to per-request rendering.
 *
 * Content link (fixture-first): a fixture `/about` page renders via
 * TemplateRenderer; otherwise the STEP 6 composition is used. Pilot note:
 * the about composition ships hero + an (empty) content module — history,
 * mission, clergy/team and values blocks flow from the backend content
 * service when it lands (content is never fabricated for real institutions).
 *
 * SEO: AboutPage JSON-LD (about → Organization) + canonical/hreflang/OG.
 */
import type { Metadata } from 'next';
import { getMessages, translate } from '@jol-hub/i18n';
import type { SupportedLocale } from '@jol-hub/i18n';
import { JsonLd, organizationEntity, webPageEntity } from '@/lib/json-ld';
import { buildTenantMetadata, tenantDisplayName, tenantTagline } from '@/lib/page-seo';
import { PageComposer } from '@/lib/page-composer';
import { buildAboutConfig } from '@/lib/page-defaults';
import { parsePageConfig, buildFallbackConfig } from '@/lib/page-config';
import { renderFixtureRoute, resolveTenantRoute } from '@/lib/route-dispatch';

// SSG intent: about content changes rarely → 1h window. See RENDERING.md.
export const revalidate = 3600;

interface TenantAboutParams {
  locale: string;
  tenant: string;
}

function aboutLabel(locale: SupportedLocale): string {
  return translate(getMessages(locale), 'navigation.about');
}

export async function generateMetadata({
  params,
}: {
  params: TenantAboutParams;
}): Promise<Metadata> {
  const { tenant, fixture, locale } = resolveTenantRoute(params);
  const name = tenantDisplayName(tenant, fixture, locale);
  const title = `${aboutLabel(locale)} | ${name}`;
  const description = tenantTagline(fixture, locale) ?? name;
  return buildTenantMetadata({ tenant, fixture, locale, route: '/about', title, description });
}

export default async function TenantAboutPage({ params }: { params: TenantAboutParams }) {
  const { tenant, fixture, locale, basePath } = resolveTenantRoute(params);
  const name = tenantDisplayName(tenant, fixture, locale);

  const org = organizationEntity({
    name,
    url: basePath,
    vertical: tenant.vertical,
    address: fixture?.identity?.address,
    phone: fixture?.identity?.phone,
    email: fixture?.identity?.email,
  });
  const jsonLd = (
    <JsonLd
      data={webPageEntity({
        type: 'AboutPage',
        name: `${aboutLabel(locale)} | ${name}`,
        url: `${basePath}/about`,
        about: org,
      })}
    />
  );

  const fixtureAbout = renderFixtureRoute(fixture, '/about', basePath);
  if (fixtureAbout) {
    return (
      <>
        {jsonLd}
        {fixtureAbout}
      </>
    );
  }

  const parsed = parsePageConfig(buildAboutConfig(), '/about');
  const config = parsed.ok && parsed.config ? parsed.config : buildFallbackConfig('/about');

  return (
    <>
      {jsonLd}
      <PageComposer config={config} tenant={tenant} locale={locale} basePath={basePath} />
    </>
  );
}
