/**
 * MapEmbed — lazy-loaded, titled iframe for location maps.
 * Progressive enhancement: a plain link fallback could be added by the
 * consumer alongside this component.
 */
import { cn } from '../../../lib/utils';
import type { MapEmbedProps } from './MapEmbed.types';

const ASPECTS = {
  video: 'aspect-video',
  square: 'aspect-square',
  wide: 'aspect-[21/9]',
} as const;

export function MapEmbed({ src, title, aspect = 'video', className }: MapEmbedProps) {
  return (
    <div className={cn('w-full overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800', ASPECTS[aspect], className)}>
      <iframe
        title={title}
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-full w-full border-0"
      />
    </div>
  );
}
