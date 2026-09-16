/**
 * StorefrontGrid — DISPLAY-ONLY catalog grid (hub-render side of the CLOSED
 * payment boundary). Renders ProductCards from props; empty state is an
 * externalized string. Zero marketplace API contact — catalog data arrives
 * through the tenant content pipeline, and transactions stay on the
 * marketplace side until the payment-track freeze is lifted (D-052).
 */
'use client';

import { useTranslations } from '@jol-hub/i18n/use-translations';

import { cn } from '../../../lib/utils';
import { ProductCard } from '../product-card';
import type { StorefrontGridProps } from './StorefrontGrid.types';

const COLUMNS = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
} as const;

export function StorefrontGrid({ items, columns = 3, tenant, className }: StorefrontGridProps) {
  const t = useTranslations('commerce');

  if (items.length === 0) {
    return <p className={cn('text-sm text-neutral-600 dark:text-neutral-300', className)}>{t('emptyProducts')}</p>;
  }

  return (
    <ul className={cn('grid grid-cols-1 gap-4', COLUMNS[columns], className)}>
      {items.map((item) => (
        <li key={item.title} className="list-none">
          <ProductCard {...item} tenant={tenant} />
        </li>
      ))}
    </ul>
  );
}
