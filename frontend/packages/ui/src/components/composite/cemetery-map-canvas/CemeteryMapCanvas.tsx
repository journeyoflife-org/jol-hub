/**
 * CemeteryMapCanvas — STATIC plot-overview canvas (page package 22).
 *
 * Inline-SVG plot grid rendered entirely from props: ZERO network requests,
 * no tile service, no consent prompt (ePrivacy-safe, same posture as
 * MapBlock). Plot DATA is never indexed — consumers render this on noindex
 * surfaces only (package 22 rule). Availability legend strings are
 * externalized (LT/EN/RU catalogs).
 */
'use client';

import { useTranslations } from '@jol-hub/i18n/use-translations';

import { cn } from '../../../lib/utils';
import type { CemeteryMapCanvasProps, PlotCell } from './CemeteryMapCanvas.types';

const STATUS_CLASS: Record<PlotCell['status'], string> = {
  available: 'fill-emerald-300 dark:fill-emerald-700',
  reserved: 'fill-amber-300 dark:fill-amber-700',
  occupied: 'fill-neutral-400 dark:fill-neutral-600',
};

const CELL = 24;
const GAP = 4;

export function CemeteryMapCanvas({ title, rows, cols, plots = [], tenant: _tenant, className }: CemeteryMapCanvasProps) {
  const t = useTranslations('collections');
  const width = cols * (CELL + GAP) + GAP;
  const height = rows * (CELL + GAP) + GAP;
  const byId = new Map(plots.map((plot) => [plot.id, plot.status]));

  const legend: Array<{ key: PlotCell['status']; label: string }> = [
    { key: 'available', label: t('plotAvailable') },
    { key: 'reserved', label: t('plotReserved') },
    { key: 'occupied', label: t('plotOccupied') },
  ];

  return (
    <figure className={cn('flex flex-col gap-2', className)}>
      <svg
        role="img"
        aria-label={title}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900"
      >
        {Array.from({ length: rows * cols }, (_, index) => {
          const row = Math.floor(index / cols);
          const col = index % cols;
          const plotId = `${String.fromCharCode(65 + row)}-${col + 1}`;
          const status = byId.get(plotId);
          return (
            <rect
              key={plotId}
              x={GAP + col * (CELL + GAP)}
              y={GAP + row * (CELL + GAP)}
              width={CELL}
              height={CELL}
              rx={3}
              className={status ? STATUS_CLASS[status] : 'fill-neutral-200 dark:fill-neutral-800'}
            />
          );
        })}
      </svg>
      <figcaption className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600 dark:text-neutral-300">
        {legend.map((item) => (
          <span key={item.key} className="inline-flex items-center gap-1">
            <span aria-hidden="true" className={cn('inline-block h-3 w-3 rounded-sm', {
              'bg-emerald-300 dark:bg-emerald-700': item.key === 'available',
              'bg-amber-300 dark:bg-amber-700': item.key === 'reserved',
              'bg-neutral-400 dark:bg-neutral-600': item.key === 'occupied',
            })} />
            {item.label}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
