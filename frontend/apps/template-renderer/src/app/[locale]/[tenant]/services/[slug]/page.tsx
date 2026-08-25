/**
 * Service detail — `/{locale}/{tenant}/services/{slug}` (STEP 6).
 *
 * Rendering strategy (see RENDERING.md): SSR (`force-dynamic`) — price and
 * availability change and must be fresh per request.
 *
 * Resolution: invalid slug or missing service → the same bare 404 (closed
 * lookup). The booking CTA is a NORMAL/VIP entitlement (hidden for CHEAP).
 *
 * SEO: Service (with Offer when priced) + BreadcrumbList JSON-LD.
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMessages, translate } from '@jol-hub/i18n';
import { JsonLd, serviceEntity, breadcrumbEntity } from '@/lib/json-ld';
import { buildTenantMetadata, tenantDisplayName } from '@/lib/page-seo';
import { getServiceItem } from '@/lib/collections';
import { themeVerticalFor } from '@/lib/template-registry';
import { normalizeSlugParam } from '@/lib/slug';
import { resolveTenantRoute } from '@/lib/route-dispatch';

// SSR: commercial data — fresh per request. See RENDERING.md.
export const dynamic = 'force-dynamic';

interface TenantServiceDetailParams {
  locale: string;
  tenant: string;
  slug: string;
}

export async function generateMetadata({
  params,
}: {
  params: TenantServiceDetailParams;
}): Promise<Metadata> {
  const { tenant, fixture, locale } = resolveTenantRoute(params);
  const slug = normalizeSlugParam(params.slug);
  if (!slug) return {};
  const item = await getServiceItem(tenant, slug);
  if (!item) return {};

  const name = tenantDisplayName(tenant, fixture, locale);
  return buildTenantMetadata({
    tenant,
    fixture,
    locale,
    route: `/services/${item.slug}`,
    title: `${item.title} | ${name}`,
    description: item.description || item.title,
  });
}

export default async function TenantServiceDetailPage({ params }: { params: TenantServiceDetailParams }) {
  const { tenant, fixture, locale, basePath } = resolveTenantRoute(params);
  const slug = normalizeSlugParam(params.slug);
  if (!slug) notFound();

  const item = await getServiceItem(tenant, slug);
  if (!item) notFound();

  const messages = getMessages(locale, { vertical: themeVerticalFor(tenant.vertical) });
  const tenantName = tenantDisplayName(tenant, fixture, locale);
  const serviceUrl = `${basePath}/services/${item.slug}`;

  // Booking is a NORMAL/VIP entitlement; CHEAP never sees the CTA.
  const bookingAllowed = tenant.packageTier !== 'cheap' && item.bookable !== false;

  return (
    <>
      <JsonLd
        data={[
          breadcrumbEntity([
            { name: translate(messages, 'navigation.home'), url: basePath },
            {
              name: translate(messages, 'collections.servicesTitle'),
              url: `${basePath}/services`,
            },
            { name: item.title, url: serviceUrl },
          ]),
          serviceEntity({
            name: item.title,
            url: serviceUrl,
            providerName: tenantName,
            description: item.description,
            price: item.price,
          }),
        ]}
      />

      <article className="container mx-auto px-4 max-w-3xl py-12">
        <a
          href={`${basePath}/services`}
          className="text-sm text-primary underline focus-ring rounded"
        >
          {translate(messages, 'collections.backToList')}
        </a>

        <header className="mt-4 mb-6">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary">{item.title}</h1>
        </header>

        <dl className="mb-8 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {typeof item.price === 'number' && (
            <div>
              <dt className="text-sm text-gray-500">{translate(messages, 'commerce.priceLabel')}</dt>
              <dd className="font-medium">{item.price.toFixed(2)} EUR</dd>
            </div>
          )}
          {item.duration && (
            <div>
              <dt className="text-sm text-gray-500">
                {translate(messages, 'commerce.durationLabel')}
              </dt>
              <dd className="font-medium">{item.duration}</dd>
            </div>
          )}
        </dl>

        {item.description && (
          <p className="text-gray-800 leading-relaxed whitespace-pre-line">{item.description}</p>
        )}

        {bookingAllowed && (
          <div className="mt-8">
            <a
              href={serviceUrl}
              className="inline-block rounded-md bg-primary px-6 py-3 font-medium text-white focus-ring"
            >
              {translate(messages, 'commerce.bookingCta')}
            </a>
          </div>
        )}
      </article>
    </>
  );
}
