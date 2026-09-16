/**
 * Event detail — `/{locale}/{tenant}/events/{slug}` (STEP 6).
 *
 * Rendering strategy (see RENDERING.md): SSR (`force-dynamic`) — the
 * registration/availability state is time-sensitive.
 *
 * Resolution: invalid slug or missing event → the same bare 404 (closed
 * lookup, no enumeration). Registration CTA is a NORMAL/VIP entitlement and
 * renders only when the event exposes a `registrationUrl`.
 *
 * SEO: Event + BreadcrumbList JSON-LD, canonical/hreflang/OG.
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMessages, translate, formatDate, formatTime } from '@jol-hub/i18n';
import { Badge } from '@jol-hub/ui';
import { JsonLd, eventEntity, breadcrumbEntity } from '@/lib/json-ld';
import { absoluteUrl } from '@/lib/seo';
import { buildTenantMetadata, tenantDisplayName } from '@/lib/page-seo';
import { getEventItem } from '@/lib/collections';
import { themeVerticalFor } from '@/lib/template-registry';
import { normalizeSlugParam } from '@/lib/slug';
import { resolveTenantRoute } from '@/lib/route-dispatch';

// SSR: time-sensitive — fresh per request. See RENDERING.md.
export const dynamic = 'force-dynamic';

interface TenantEventDetailParams {
  locale: string;
  tenant: string;
  slug: string;
}

export async function generateMetadata({
  params,
}: {
  params: TenantEventDetailParams;
}): Promise<Metadata> {
  const { tenant, fixture, locale } = resolveTenantRoute(params);
  const slug = normalizeSlugParam(params.slug);
  if (!slug) return {};
  const item = await getEventItem(tenant, slug);
  if (!item) return {};

  return buildTenantMetadata({
    tenant,
    fixture,
    locale,
    route: `/events/${item.slug}`,
    title: item.title,
    description: item.description || item.title,
  });
}

export default async function TenantEventDetailPage({ params }: { params: TenantEventDetailParams }) {
  const { tenant, fixture, locale, basePath } = resolveTenantRoute(params);
  const slug = normalizeSlugParam(params.slug);
  if (!slug) notFound();

  const item = await getEventItem(tenant, slug);
  if (!item) notFound();

  const messages = getMessages(locale, { vertical: themeVerticalFor(tenant.vertical) });
  const tenantName = tenantDisplayName(tenant, fixture, locale);
  // STEP 11: structured-data URLs are ABSOLUTE (protocol + public domain).
  const eventUrl = absoluteUrl(`${basePath}/events/${item.slug}`);

  // Registration is a NORMAL/VIP entitlement; CHEAP never sees the CTA.
  const registrationAllowed = tenant.packageTier !== 'cheap' && Boolean(item.registrationUrl);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbEntity([
            { name: translate(messages, 'navigation.home'), url: absoluteUrl(basePath) },
            { name: translate(messages, 'navigation.events'), url: absoluteUrl(`${basePath}/events`) },
            { name: item.title, url: eventUrl },
          ]),
          eventEntity({
            name: item.title,
            url: eventUrl,
            startDateTime: item.startDateTime,
            endDateTime: item.endDateTime,
            location: item.location,
            organizerName: tenantName,
            description: item.description,
          }),
        ]}
      />

      <article className="container mx-auto px-4 max-w-3xl py-12">
        <a href={`${basePath}/events`} className="text-sm text-primary underline focus-ring rounded">
          {translate(messages, 'collections.backToList')}
        </a>

        <header className="mt-4 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary">
              {item.title}
            </h1>
            {item.recurring && (
              <Badge variant="outline">{translate(messages, 'commerce.recurringBadge')}</Badge>
            )}
          </div>
        </header>

        <dl className="mb-8 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-gray-500">{translate(messages, 'events.dateLabel')}</dt>
            <dd className="font-medium">
              <time dateTime={item.startDateTime}>{formatDate(item.startDateTime, locale)}</time>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">{translate(messages, 'events.timeLabel')}</dt>
            <dd className="font-medium">{formatTime(item.startDateTime, locale)}</dd>
          </div>
          {item.location && (
            <div>
              <dt className="text-sm text-gray-500">{translate(messages, 'events.locationLabel')}</dt>
              <dd className="font-medium">{item.location}</dd>
            </div>
          )}
        </dl>

        {item.description && (
          <p className="text-gray-800 leading-relaxed whitespace-pre-line">{item.description}</p>
        )}

        {registrationAllowed && (
          <div className="mt-8">
            <a
              href={item.registrationUrl}
              className="inline-block rounded-md bg-primary px-6 py-3 font-medium text-white focus-ring"
            >
              {translate(messages, 'collections.register')}
            </a>
          </div>
        )}
      </article>
    </>
  );
}
