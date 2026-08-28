/**
 * ServiceCard — commercial/service offering with optional price, duration
 * and booking CTA.
 */
'use client';

import { Clock } from 'lucide-react';
import { useTranslations } from '@jol-hub/i18n/use-translations';
import { useLocale } from '@jol-hub/i18n/use-locale';

import { accentTextClass } from '../../../lib/tenant-theme';
import { Button } from '../../primitives/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../primitives/card';
import type { ServiceCardProps } from './ServiceCard.types';

export function ServiceCard({
  title,
  description,
  price,
  duration,
  bookingCta,
  tenant,
  className,
}: ServiceCardProps) {
  const t = useTranslations('commerce');
  const { formatCurrency } = useLocale();

  return (
    <Card tenant={tenant} className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {description && (
          <p className="text-sm text-neutral-600 dark:text-neutral-300">{description}</p>
        )}
        {duration && (
          <p className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
            <Clock aria-hidden="true" className="h-4 w-4" />
            {duration}
          </p>
        )}
      </CardContent>
      <CardFooter className="justify-between">
        {typeof price === 'number' ? (
          <p className="text-lg font-semibold">
            <span className="sr-only">{t('priceLabel')}: </span>
            {formatCurrency(price)}
          </p>
        ) : (
          <span />
        )}
        {bookingCta && (
          <Button asChild variant="secondary" size="sm" tenant={tenant}>
            <a href={bookingCta.href}>
              <span className={accentTextClass(tenant)}>{bookingCta.label}</span>
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
