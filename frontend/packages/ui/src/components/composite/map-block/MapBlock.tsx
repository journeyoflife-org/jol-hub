/**
 * MapBlock — STATIC location map (ePrivacy-safe default).
 *
 * Renders an inline-SVG canvas with a marker — ZERO network requests, no
 * third-party tiles, no consent prompt required. The heavy interactive
 * variant (external tiles) remains MapEmbed and may only be mounted behind
 * consent. An optional external-maps link is user-initiated navigation.
 */
'use client';

import { ExternalLink, MapPin } from 'lucide-react';
import { useTranslations } from '@jol-hub/i18n/use-translations';

import { cn } from '../../../lib/utils';
import { accentTextClass } from '../../../lib/tenant-theme';
import type { MapBlockProps } from './MapBlock.types';

const ASPECTS = {
  square: 'aspect-square',
  video: 'aspect-video',
} as const;

export function MapBlock({
  title,
  latitude,
  longitude,
  addressLabel,
  externalHref,
  aspect = 'video',
  tenant,
  className,
}: MapBlockProps) {
  const t = useTranslations('collections');

  return (
    <figure className={cn('overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800', className)}>
      <div className={cn('relative w-full bg-neutral-100 dark:bg-neutral-900', ASPECTS[aspect])}>
        <svg
          role="img"
          aria-label={`${title} — ${addressLabel} (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`}
          viewBox="0 0 400 300"
          className="absolute inset-0 h-full w-full"
        >
          {/* Static street-grid suggestion — decorative, generated locally. */}
          <g aria-hidden="true" stroke="currentColor" strokeWidth="1" className="text-neutral-300 dark:text-neutral-700">
            {[50, 100, 150, 200, 250, 300, 350].map((x) => (
              <line key={`v${x}`} x1={x} y1="0" x2={x} y2="300" />
            ))}
            {[50, 100, 150, 200, 250].map((y) => (
              <line key={`h${y}`} x1="0" y1={y} x2="400" y2={y} />
            ))}
          </g>
          {/* Marker pin at canvas centre. */}
          <g aria-hidden="true" transform="translate(200 130)">
            <path
              d="M0 24 C -12 8 -12 -8 0 -14 C 12 -8 12 8 0 24 Z"
              className="fill-neutral-700 dark:fill-neutral-200"
            />
            <circle cx="0" cy="-4" r="4" className="fill-neutral-100 dark:fill-neutral-900" />
          </g>
        </svg>
      </div>
      <figcaption className="flex flex-col gap-1 p-3 text-sm text-neutral-600 dark:text-neutral-300">
        <span className="flex items-center gap-2 font-medium text-neutral-900 dark:text-neutral-100">
          <MapPin aria-hidden="true" className="h-4 w-4 shrink-0" />
          {addressLabel}
        </span>
        <span>{t('mapStaticNotice')}</span>
        {externalHref && (
          <a
            href={externalHref}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'focus-ring inline-flex min-h-[24px] items-center gap-1 self-start rounded-sm underline-offset-2 hover:underline',
              accentTextClass(tenant),
            )}
          >
            <ExternalLink aria-hidden="true" className="h-4 w-4 shrink-0" />
            {t('openInExternalMaps')}
          </a>
        )}
      </figcaption>
    </figure>
  );
}
