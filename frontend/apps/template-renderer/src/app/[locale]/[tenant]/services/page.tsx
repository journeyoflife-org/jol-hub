/**
 * Services list — `/{locale}/{tenant}/services` (STEP 6).
 *
 * Rendering strategy (see RENDERING.md): SSR (`force-dynamic`) — pricing and
 * availability are commercial data and must be fresh per request.
 *
 * Booking CTAs are a NORMAL/VIP entitlement (hidden for CHEAP tenants). The
 * pilot ships no services, so the list renders an accessible empty state.
 *
 * SEO: ItemList + BreadcrumbList JSON-LD, canonical/hreflang/OG.
 */
import type { Metadata } from 'next';
import { getMessages, translate } from '@jol-hub/i18n';
import { ServiceCard } from '@jol-hub/ui/components/composite';
import { getServices } from '@/lib/collections';
import { JsonLd, breadcrumbEntity, itemListEntity } from '@/lib/json-ld';
import { absoluteUrl } from '@/lib/seo';
import { buildTenantMetadata, tenantDisplayName } from '@/lib/page-seo';
import { themeVerticalFor } from '@/lib/template-registry';
import {
  CollectionPageHeader,
  CategoryFilter,
  CollectionEmptyState,
} from '@/components/collection-chrome';
import { readString, type SearchParams } from '@/lib/collection-view';
import { renderFixtureRoute, resolveTenantRoute } from '@/lib/route-dispatch';

// SSR: commercial data — fresh per request. See RENDERING.md.
export const dynamic = 'force-dynamic';

interface TenantServicesListParams {
  locale: string;
  tenant: string;
}

export async function generateMetadata({
  params,
}: {
  params: TenantServicesListParams;
}): Promise<Metadata> {
  const { tenant, fixture, locale } = resolveTenantRoute(params);
  const name = tenantDisplayName(tenant, fixture, locale);
  const messages = getMessages(locale);
  return buildTenantMetadata({
    tenant,
    fixture,
    locale,
    route: '/services',
    title: translate(messages, 'collections.servicesTitle'),
    description: name,
  });
}

export default async function TenantServicesListPage({
  params,
  searchParams,
}: {
  params: TenantServicesListParams;
  searchParams?: SearchParams;
}) {
  const { tenant, fixture, locale, basePath } = resolveTenantRoute(params);
  const messages = getMessages(locale, { vertical: themeVerticalFor(tenant.vertical) });
  const title = translate(messages, 'collections.servicesTitle');

  const breadcrumb = breadcrumbEntity([
    { name: translate(messages, 'navigation.home'), url: absoluteUrl(basePath) },
    { name: title, url: absoluteUrl(`${basePath}/services`) },
  ]);

  // Fixture-first fidelity (fixtures ship no /services today — future-proof).
  const fixtureServices = renderFixtureRoute(fixture, '/services', basePath);
  if (fixtureServices) {
    return (
      <>
        <JsonLd data={breadcrumb} />
        {fixtureServices}
      </>
    );
  }

  const all = await getServices(tenant);
  const categories = Array.from(new Set(all.map((item) => item.category).filter(Boolean))) as string[];
  const activeCategory = readString(searchParams, 'category');

  const listed = activeCategory ? all.filter((item) => item.category === activeCategory) : all;

  // Commercial entitlement: booking is NORMAL/VIP only.
  const bookingAllowed = tenant.packageTier !== 'cheap';

  return (
    <>
      <JsonLd
        data={[
          breadcrumb,
          itemListEntity(
            listed.map((item) => ({
              name: item.title,
              url: absoluteUrl(`${basePath}/services/${item.slug}`),
            })),
          ),
        ]}
      />

      <CollectionPageHeader title={title} />

      <CategoryFilter
        basePath={basePath}
        route="/services"
        categories={categories}
        active={activeCategory}
        locale={locale}
      />

      {listed.length === 0 ? (
        <CollectionEmptyState messageKey="collections.emptyServices" locale={locale} />
      ) : (
        <div className="container mx-auto px-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3 pb-12">
          {listed.map((item) => (
            <ServiceCard
              key={item.slug}
              title={item.title}
              description={item.description}
              price={item.price}
              duration={item.duration}
              bookingCta={
                bookingAllowed && item.bookable !== false
                  ? {
                      label: translate(messages, 'commerce.bookingCta'),
                      href: `${basePath}/services/${item.slug}`,
                    }
                  : undefined
              }
              tenant={{ vertical: themeVerticalFor(tenant.vertical) }}
            />
          ))}
        </div>
      )}
    </>
  );
}
