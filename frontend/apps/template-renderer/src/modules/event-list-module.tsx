/**
 * EventListModule — upcoming events preview (STEP 6 module).
 *
 * Async server module: fetches events (RLS-scoped) and renders the next N
 * upcoming. Empty in pilot → collapses to null.
 */
import { EventCard, SectionHeader } from '@jol-hub/ui/components/composite';
import {
  getMessages,
  translate,
  isSupportedLocale,
  formatDate,
  formatTime,
} from '@jol-hub/i18n';
import { DEFAULT_LOCALE } from '@jol-hub/i18n/config';
import { getEvents, splitEventsByTime } from '@/lib/collections';
import { themeVerticalFor } from '@/lib/template-registry';
import { tenantThemeFor, type ModuleProps } from './types';

export default async function EventListModule({ tenant, locale, content, basePath }: ModuleProps) {
  const items = await getEvents(tenant);
  if (items.length === 0) return null;

  const { upcoming } = splitEventsByTime(items, new Date());
  if (upcoming.length === 0) return null;

  const limit = typeof content.limit === 'number' && content.limit > 0 ? content.limit : 3;
  const next = upcoming.slice(0, limit);

  const effectiveLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
  const messages = getMessages(effectiveLocale, { vertical: themeVerticalFor(tenant.vertical) });

  return (
    <div className="space-y-6">
      <SectionHeader
        title={translate(messages, 'navigation.events')}
        headingLevel={2}
        action={{ label: translate(messages, 'common.viewAll'), href: `${basePath}/events` }}
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {next.map((item) => (
          <EventCard
            key={item.slug}
            title={item.title}
            startDateTime={item.startDateTime}
            dateLabel={formatDate(item.startDateTime, effectiveLocale)}
            timeLabel={formatTime(item.startDateTime, effectiveLocale)}
            location={item.location}
            recurring={item.recurring}
            description={item.description}
            href={`${basePath}/events/${item.slug}`}
            tenant={tenantThemeFor(tenant)}
          />
        ))}
      </div>
    </div>
  );
}
