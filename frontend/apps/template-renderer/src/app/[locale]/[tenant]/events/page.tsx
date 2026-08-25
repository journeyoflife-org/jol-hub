/**
 * Events list — `/{locale}/{tenant}/events` (STEP 6).
 *
 * Rendering strategy (see RENDERING.md): SSR (`force-dynamic`). Events are
 * time-sensitive — a stale "upcoming" list is bad UX — so every request
 * re-evaluates the clock and fetches with `no-store`.
 *
 * Views: a current-month calendar grid (with event indicators) and a list,
 * toggled via `view`; the list additionally filters upcoming/past (`when`)
 * and by category. All controls are `searchParams` links/forms → fully
 * server-rendered, no client JS required.
 *
 * SEO: ItemList + BreadcrumbList JSON-LD, canonical/hreflang/OG.
 */
import type { Metadata } from 'next';
import { getMessages, translate, formatTime, formatDate } from '@jol-hub/i18n';
import type { SupportedLocale } from '@jol-hub/i18n';
import { EventCard } from '@jol-hub/ui/components/composite';
import { getEvents, splitEventsByTime, buildMonthGrid, eventsByDate } from '@/lib/collections';
import type { EventItem } from '@/lib/collections';
import { JsonLd, breadcrumbEntity, itemListEntity } from '@/lib/json-ld';
import { buildTenantMetadata, tenantDisplayName } from '@/lib/page-seo';
import { themeVerticalFor } from '@/lib/template-registry';
import {
  CollectionPageHeader,
  CategoryFilter,
  CollectionEmptyState,
} from '@/components/collection-chrome';
import {
  readString,
  collectionHref,
  weekdayLabels,
  monthLabel,
  type SearchParams,
} from '@/lib/collection-view';
import { renderFixtureRoute, resolveTenantRoute } from '@/lib/route-dispatch';

// SSR: time-sensitive — fresh per request. See RENDERING.md.
export const dynamic = 'force-dynamic';

interface TenantEventsListParams {
  locale: string;
  tenant: string;
}

function eventsLabel(locale: SupportedLocale): string {
  return translate(getMessages(locale), 'navigation.events');
}

/** Server-rendered current-month calendar grid with event indicators. */
function MonthCalendar({
  events,
  locale,
  basePath,
}: {
  events: EventItem[];
  locale: SupportedLocale;
  basePath: string;
}) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const cells = buildMonthGrid(year, month);
  const byDate = eventsByDate(events);
  const weekdays = weekdayLabels(locale);

  return (
    <div className="container mx-auto px-4">
      <p className="text-lg font-heading font-semibold text-primary mb-3">
        {monthLabel(locale, year, month)}
      </p>
      <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
        {weekdays.map((day) => (
          <div key={day} className="bg-gray-50 p-2 text-center text-xs font-medium text-gray-600">
            {day}
          </div>
        ))}
        {cells.map((cell, index) => {
          const dayEvents = cell.date ? byDate.get(cell.date) ?? [] : [];
          return (
            <div
              key={cell.date ?? `blank-${index}`}
              className={`bg-white min-h-[4.5rem] p-1.5 ${cell.inMonth ? '' : 'bg-gray-50'}`}
            >
              {cell.dayOfMonth && (
                <span className="text-xs text-gray-500">{cell.dayOfMonth}</span>
              )}
              {dayEvents.length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {dayEvents.map((event) => (
                    <li key={event.slug}>
                      <a
                        href={collectionHref(basePath, `/events/${event.slug}`, {})}
                        className="block truncate rounded bg-primary/10 px-1 text-[11px] text-primary hover:bg-primary/20 focus-ring"
                        title={event.title}
                      >
                        {event.title}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: TenantEventsListParams;
}): Promise<Metadata> {
  const { tenant, fixture, locale } = resolveTenantRoute(params);
  const name = tenantDisplayName(tenant, fixture, locale);
  return buildTenantMetadata({
    tenant,
    fixture,
    locale,
    route: '/events',
    title: `${eventsLabel(locale)} | ${name}`,
    description: name,
  });
}

export default async function TenantEventsListPage({
  params,
  searchParams,
}: {
  params: TenantEventsListParams;
  searchParams?: SearchParams;
}) {
  const { tenant, fixture, locale, basePath } = resolveTenantRoute(params);
  const messages = getMessages(locale, { vertical: themeVerticalFor(tenant.vertical) });

  const breadcrumb = breadcrumbEntity([
    { name: translate(messages, 'navigation.home'), url: basePath },
    { name: eventsLabel(locale), url: `${basePath}/events` },
  ]);

  // Fixture-first fidelity: a fixture events page wins when present.
  const fixtureEvents = renderFixtureRoute(fixture, '/events', basePath);
  if (fixtureEvents) {
    return (
      <>
        <JsonLd data={breadcrumb} />
        {fixtureEvents}
      </>
    );
  }

  const all = await getEvents(tenant);
  const categories = Array.from(new Set(all.map((item) => item.category).filter(Boolean))) as string[];

  const view = readString(searchParams, 'view') === 'calendar' ? 'calendar' : 'list';
  const when = readString(searchParams, 'when') === 'past' ? 'past' : 'upcoming';
  const activeCategory = readString(searchParams, 'category');

  const { upcoming, past } = splitEventsByTime(all, new Date());
  let listed = when === 'past' ? past : upcoming;
  if (activeCategory) listed = listed.filter((item) => item.category === activeCategory);

  const toggleLink = (selected: boolean) =>
    `inline-block rounded-md px-3 py-1.5 text-sm focus-ring ${
      selected ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
    }`;

  return (
    <>
      <JsonLd
        data={[
          breadcrumb,
          itemListEntity(
            listed.map((item) => ({
              name: item.title,
              url: `${basePath}/events/${item.slug}`,
            })),
          ),
        ]}
      />

      <CollectionPageHeader title={eventsLabel(locale)} />

      {/* View toggle: calendar vs list. */}
      <div className="container mx-auto px-4 pb-4 flex flex-wrap items-center gap-4">
        <div className="inline-flex rounded-lg border border-gray-300 p-0.5" role="group">
          <a
            href={collectionHref(basePath, '/events', { view: undefined, when, category: activeCategory })}
            className={toggleLink(view === 'list')}
            aria-current={view === 'list' ? 'true' : undefined}
          >
            {translate(messages, 'collections.listView')}
          </a>
          <a
            href={collectionHref(basePath, '/events', { view: 'calendar', when, category: activeCategory })}
            className={toggleLink(view === 'calendar')}
            aria-current={view === 'calendar' ? 'true' : undefined}
          >
            {translate(messages, 'collections.calendarView')}
          </a>
        </div>

        {view === 'list' && (
          <div className="inline-flex rounded-lg border border-gray-300 p-0.5" role="group">
            <a
              href={collectionHref(basePath, '/events', { view, when: undefined, category: activeCategory })}
              className={toggleLink(when === 'upcoming')}
              aria-current={when === 'upcoming' ? 'true' : undefined}
            >
              {translate(messages, 'collections.upcoming')}
            </a>
            <a
              href={collectionHref(basePath, '/events', { view, when: 'past', category: activeCategory })}
              className={toggleLink(when === 'past')}
              aria-current={when === 'past' ? 'true' : undefined}
            >
              {translate(messages, 'collections.past')}
            </a>
          </div>
        )}
      </div>

      <CategoryFilter
        basePath={basePath}
        route="/events"
        categories={categories}
        active={activeCategory}
        locale={locale}
        preserve={{ view: view === 'calendar' ? 'calendar' : undefined, when: when === 'past' ? 'past' : undefined }}
      />

      {view === 'calendar' ? (
        <MonthCalendar events={all} locale={locale} basePath={basePath} />
      ) : listed.length === 0 ? (
        <CollectionEmptyState messageKey="collections.emptyEvents" locale={locale} />
      ) : (
        <div className="container mx-auto px-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {listed.map((item) => (
            <EventCard
              key={item.slug}
              title={item.title}
              startDateTime={item.startDateTime}
              dateLabel={formatDate(item.startDateTime, locale)}
              timeLabel={formatTime(item.startDateTime, locale)}
              location={item.location}
              recurring={item.recurring}
              description={item.description}
              href={`${basePath}/events/${item.slug}`}
              tenant={{ vertical: themeVerticalFor(tenant.vertical) }}
            />
          ))}
        </div>
      )}
    </>
  );
}
