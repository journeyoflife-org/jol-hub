/**
 * Tenant contact — `/{locale}/{tenant}/contact` (STEP 6).
 *
 * Rendering strategy (see RENDERING.md): SSG intent (`revalidate = 3600`),
 * realized at the data cache (root layout `headers()`/lang constraint).
 *
 * Layout: a page header + the tenant's contact-info card (real identity data
 * from the fixture — address/phone/email; never fabricated), then the STEP 6
 * composition (map + contact form). The map collapses without geocoded
 * coordinates (pilot ships none) and the form is entitlement-gated.
 *
 * GDPR: the map defaults to OpenStreetMap (no third-party tracker); the ui
 * ContactForm carries the consent checkbox + privacy link.
 *
 * SEO: ContactPage JSON-LD (about → Organization) + canonical/hreflang/OG.
 */
import type { Metadata } from 'next';
import { getMessages, translate } from '@jol-hub/i18n';
import type { SupportedLocale } from '@jol-hub/i18n';
import type { TenantFixture } from '@jol-hub/seed-data';
import { JsonLd, organizationEntity, webPageEntity } from '@/lib/json-ld';
import { buildTenantMetadata, tenantDisplayName, tenantTagline } from '@/lib/page-seo';
import { PageComposer } from '@/lib/page-composer';
import { buildContactConfig } from '@/lib/page-defaults';
import { parsePageConfig, buildFallbackConfig } from '@/lib/page-config';
import { renderFixtureRoute, resolveTenantRoute } from '@/lib/route-dispatch';

// SSG intent: contact details change rarely → 1h window. See RENDERING.md.
export const revalidate = 3600;

interface TenantContactParams {
  locale: string;
  tenant: string;
}

function contactLabel(locale: SupportedLocale): string {
  return translate(getMessages(locale), 'navigation.contactTitle');
}

/** Tenant contact-info card from fixture identity (omits absent fields). */
function ContactInfoCard({
  fixture,
  locale,
}: {
  fixture: TenantFixture;
  locale: SupportedLocale;
}) {
  const messages = getMessages(locale);
  const rows = [
    { label: translate(messages, 'collections.addressLabel'), value: fixture.identity?.address },
    { label: translate(messages, 'forms.phoneLabel'), value: fixture.identity?.phone },
    { label: translate(messages, 'forms.emailLabel'), value: fixture.identity?.email },
  ].filter((row): row is { label: string; value: string } => Boolean(row.value));

  if (rows.length === 0) return null;

  return (
    <section aria-labelledby="contact-info-heading" className="container mx-auto px-4">
      <h2 id="contact-info-heading" className="text-2xl font-heading font-bold text-primary mb-4">
        {contactLabel(locale)}
      </h2>
      <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-sm text-gray-500">{row.label}</dt>
            <dd className="font-medium break-words">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export async function generateMetadata({
  params,
}: {
  params: TenantContactParams;
}): Promise<Metadata> {
  const { tenant, fixture, locale } = resolveTenantRoute(params);
  const name = tenantDisplayName(tenant, fixture, locale);
  const title = `${contactLabel(locale)} | ${name}`;
  const description = tenantTagline(fixture, locale) ?? name;
  return buildTenantMetadata({ tenant, fixture, locale, route: '/contact', title, description });
}

export default async function TenantContactPage({ params }: { params: TenantContactParams }) {
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
        type: 'ContactPage',
        name: `${contactLabel(locale)} | ${name}`,
        url: `${basePath}/contact`,
        about: org,
      })}
    />
  );

  const fixtureContact = renderFixtureRoute(fixture, '/contact', basePath);
  if (fixtureContact) {
    return (
      <>
        {jsonLd}
        {fixtureContact}
      </>
    );
  }

  const parsed = parsePageConfig(buildContactConfig(), '/contact');
  const config = parsed.ok && parsed.config ? parsed.config : buildFallbackConfig('/contact');

  return (
    <>
      {jsonLd}
      <div className="space-y-12 py-12 md:py-16">
        <header className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary">
            {contactLabel(locale)}
          </h1>
        </header>
        {fixture ? <ContactInfoCard fixture={fixture} locale={locale} /> : null}
        <PageComposer config={config} tenant={tenant} locale={locale} basePath={basePath} />
      </div>
    </>
  );
}
