/**
 * ServiceList — semantic list wrapper for ServiceCard (renderer
 * `service-list` module, contained variant per package 03). Empty state and
 * the "view all" link are externalized strings (LT/EN/RU catalogs).
 */
'use client';

import { useTranslations } from '@jol-hub/i18n/use-translations';

import { cn } from '../../../lib/utils';
import { accentTextClass } from '../../../lib/tenant-theme';
import { ServiceCard } from '../service-card';
import type { ServiceListProps } from './ServiceList.types';

export function ServiceList({ items, viewAllHref, tenant, className }: ServiceListProps) {
  const t = useTranslations('collections');

  if (items.length === 0) {
    return <p className={cn('text-sm text-neutral-600 dark:text-neutral-300', className)}>{t('emptyServices')}</p>;
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <ul className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.title} className="list-none">
            <ServiceCard {...item} tenant={tenant} />
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
          {t('viewAllServices')}
        </a>
      )}
    </div>
  );
}
