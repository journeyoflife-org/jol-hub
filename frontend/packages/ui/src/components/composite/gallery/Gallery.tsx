/**
 * Gallery — grid + lightbox.
 *
 * Progressive enhancement: thumbnails are plain links to the full image;
 * with JavaScript they open the lightbox instead. Lightbox keyboard
 * support: Escape closes, ArrowLeft/ArrowRight navigate, focus is trapped
 * and restored on close. `alt` text is mandatory per `GalleryImage`.
 * Images declare width/height (CLS) and lazy-load with a placeholder
 * background.
 */
'use client';

import { useCallback, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTranslations } from '@jol-hub/i18n/use-translations';

import { cn } from '../../../lib/utils';
import { FocusTrap } from '../../accessibility/focus-trap';
import type { GalleryProps } from './Gallery.types';

const COLUMNS = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-2 lg:grid-cols-3',
  4: 'md:grid-cols-3 lg:grid-cols-4',
} as const;

export function Gallery({ images, label, columns = 3, className }: GalleryProps) {
  const tA11y = useTranslations('accessibility');
  const tCommon = useTranslations('common');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (delta: number) => {
      setOpenIndex((current) => {
        if (current === null) return current;
        return (current + delta + images.length) % images.length;
      });
    },
    [images.length],
  );

  const open = openIndex !== null ? images[openIndex] : null;

  return (
    <section aria-label={label ?? tA11y('galleryLabel')} className={className}>
      <ul className={cn('grid grid-cols-1 gap-4', COLUMNS[columns])}>
        {images.map((image, index) => (
          <li key={image.src}>
            <a
              href={image.src}
              onClick={(event) => {
                event.preventDefault();
                setOpenIndex(index);
              }}
              className="block overflow-hidden rounded-lg bg-neutral-200 focus-ring dark:bg-neutral-800"
            >
              <img
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                loading="lazy"
                className="aspect-video h-auto w-full object-cover transition-opacity motion-reduce:transition-none"
              />
            </a>
          </li>
        ))}
      </ul>

      {open && openIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={open.alt}
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/90 p-4"
        >
          <FocusTrap active onEscape={close}>
            <figure className="flex max-h-full max-w-4xl flex-col items-center gap-3">
              <img
                src={open.src}
                alt={open.alt}
                width={open.width}
                height={open.height}
                className="max-h-[75vh] w-auto rounded-lg object-contain"
              />
              {open.caption && <figcaption className="text-sm text-neutral-200">{open.caption}</figcaption>}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label={tA11y('previousImage')}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-800 text-neutral-50 hover:bg-neutral-700 focus-ring"
                >
                  <ChevronLeft aria-hidden="true" className="h-5 w-5" />
                </button>
                <p className="text-sm text-neutral-300" aria-live="polite">
                  {openIndex + 1} / {images.length}
                </p>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label={tA11y('nextImage')}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-800 text-neutral-50 hover:bg-neutral-700 focus-ring"
                >
                  <ChevronRight aria-hidden="true" className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={close}
                  aria-label={tCommon('close')}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-800 text-neutral-50 hover:bg-neutral-700 focus-ring"
                >
                  <X aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>
            </figure>
          </FocusTrap>
        </div>
      )}
    </section>
  );
}
