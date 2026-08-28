/**
 * ProductCard — DISPLAY-ONLY catalog card (hub-render side of the CLOSED
 * payment boundary: hub renders, marketplace transacts — ADR-009 Model A).
 *
 * PAYMENT-FREEZE COMPLIANCE (DECISION-LOG D-052): the transaction CTA is an
 * INERT PLACEHOLDER — a disabled button with the "available at launch"
 * pattern. Zero transaction wiring, zero PSP surface, zero API contact: the
 * card renders purely from props until the owner unfreezes the payment track.
 */
'use client';

import { useTranslations } from '@jol-hub/i18n/use-translations';

import { cn } from '../../../lib/utils';
import { Badge } from '../../primitives/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../primitives/card';
import type { ProductCardProps } from './ProductCard.types';

export function ProductCard({
  title,
  description,
  image,
  imageAlt,
  price,
  currency,
  availability = 'InStock',
  tenant,
  className,
}: ProductCardProps) {
  const t = useTranslations('commerce');

  return (
    <Card tenant={tenant} className={cn('flex h-full flex-col', className)}>
      {image && <img src={image} alt={imageAlt ?? ''} className="aspect-video w-full rounded-t-lg object-cover" />}
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>{title}</CardTitle>
          {availability !== 'InStock' && (
            <Badge variant="secondary" size="sm">
              {availability === 'OutOfStock' ? t('outOfStockBadge') : t('preOrderBadge')}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2 text-sm text-neutral-600 dark:text-neutral-300">
        {description && <p>{description}</p>}
        {price && (
          <p className="text-base font-medium text-neutral-900 dark:text-neutral-100">
            <span className="sr-only">{t('priceLabel')}: </span>
            {price} {currency && <span className="text-sm">{currency}</span>}
          </p>
        )}
        {/* INERT PLACEHOLDER — no transaction wiring while the freeze stands. */}
        <button
          type="button"
          disabled
          aria-disabled="true"
          title={t('availableAtLaunch')}
          className="mt-auto inline-flex min-h-[24px] cursor-not-allowed items-center justify-center rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-400 dark:border-neutral-700 dark:text-neutral-500"
        >
          {t('availableAtLaunch')}
        </button>
      </CardContent>
    </Card>
  );
}
