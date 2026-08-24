/**
 * EventCard — consistent card pattern with event metadata
 * (date via semantic `<time>`, location, recurring badge).
 */
'use client';

import { Calendar, Clock, MapPin } from 'lucide-react';
import { useTranslations } from '@jol-hub/i18n/use-translations';

import { cn } from '../../../lib/utils';
import { accentTextClass } from '../../../lib/tenant-theme';
import { Badge } from '../../primitives/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../primitives/card';
import type { EventCardProps } from './EventCard.types';

export function EventCard({
  title,
  startDateTime,
  dateLabel,
  timeLabel,
  location,
  recurring = false,
  description,
  href,
  tenant,
  className,
}: EventCardProps) {
  const t = useTranslations('commerce');

  return (
    <Card variant={href ? 'interactive' : 'default'} tenant={tenant} className={className}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>
            {href ? (
              <a href={href} className={cn('focus-ring rounded-sm', accentTextClass(tenant))}>
                {title}
              </a>
            ) : (
              title
            )}
          </CardTitle>
          {recurring && (
            <Badge variant="secondary" size="sm">
              {t('recurringBadge')}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm text-neutral-600 dark:text-neutral-300">
        <p className="flex items-center gap-2">
          <Calendar aria-hidden="true" className="h-4 w-4 shrink-0" />
          <time dateTime={startDateTime}>{dateLabel}</time>
          {timeLabel && (
            <>
              <Clock aria-hidden="true" className="ms-2 h-4 w-4 shrink-0" />
              <span>{timeLabel}</span>
            </>
          )}
        </p>
        {location && (
          <p className="flex items-center gap-2">
            <MapPin aria-hidden="true" className="h-4 w-4 shrink-0" />
            {location}
          </p>
        )}
        {description && <p className="mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}
