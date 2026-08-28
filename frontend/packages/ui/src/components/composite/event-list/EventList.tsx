/**
 * EventList — semantic list wrapper for EventCard (renderer `event-list`
 * module, page packages 03/06 reference structure). Empty state and the
 * "view all" link are externalized strings (LT/EN/RU catalogs).
 */
'use client';

import { useTranslations } from '@jol-hub/i18n/use-translations';

import { cn } from '../../../lib/utils';
import { accentTextClass } from '../../../lib/tenant-theme';
import { EventCard } from '../event-card';
import type { EventListProps } from './EventList.types';

export function EventList({ items, viewAllHref, tenant, className }: EventListProps) {
  const t = useTranslations('collections');

  if (items.length === 0) {
    return <p className={cn('text-sm text-neutral-600 dark:text-neutral-300', className)}>{t('emptyEvents')}</p>;
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <ul className="flex flex-col gap-4">
        {items.map((item) => (
          <li key={`${item.title}-${item.startDateTime}`} className="list-none">
            <EventCard {...item} tenant={tenant} />
          </li>
        ))}
      </ul>
      {viewAllHref && (
        <a
          href={viewAllHref}
          className={cn(
            'focus-ring inline-flex min-h-[24px] items-center self-start rounded-sm text-sm underline-offset-2 hover:underline',
            accentTextClass(tenant),
          )}
        >
          {t('viewAllEvents')}
        </a>
      )}
    </div>
  );
}
