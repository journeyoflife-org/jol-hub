/**
 * PhotoGallery Component
 * Next.js Image optimization with lightbox modal
 * Lazy loading, responsive grid, keyboard navigation
 * WCAG 2.1 AA accessible
 */

'use client';

import { useState, useCallback } from 'react';
import { Image } from './image-shim';
import { Lightbox } from './photo-gallery-lightbox';
import { ZoomIn } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

export interface Photo {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface PhotoGalleryProps {
  photos: Photo[];
  columns?: 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  aspectRatio?: 'square' | 'video' | 'portrait' | 'auto';
  className?: string;
  enableLightbox?: boolean;
  lazyLoad?: boolean;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const GAP_SIZES = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
};

const COLUMN_CLASSES = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
};

const ASPECT_RATIOS = {
  square: 'aspect-square',
  video: 'aspect-video',
  portrait: 'aspect-[3/4]',
  auto: '',
};

// The Lightbox lives in ./photo-gallery-lightbox.tsx (STEP 3 250-line rule).

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PhotoGallery({
  photos,
  columns = 3,
  gap = 'md',
  aspectRatio = 'square',
  className = '',
  enableLightbox = true,
  lazyLoad = true,
}: PhotoGalleryProps): JSX.Element {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = useCallback((index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  if (!photos.length) {
    return (
      <div className={`text-center py-12 text-muted-foreground ${className}`}>
        No photos available
      </div>
    );
  }

  return (
    <>
      <div className={`grid ${COLUMN_CLASSES[columns]} ${GAP_SIZES[gap]} ${className}`}>
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className={`relative group overflow-hidden rounded-lg bg-muted ${ASPECT_RATIOS[aspectRatio]} ${
              aspectRatio === 'auto' ? '' : ''
            }`}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill={aspectRatio !== 'auto'}
              width={aspectRatio === 'auto' ? photo.width || 400 : undefined}
              height={aspectRatio === 'auto' ? photo.height || 300 : undefined}
              className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
                aspectRatio === 'auto' ? 'w-full h-auto' : ''
              }`}
              loading={lazyLoad && index > 3 ? 'lazy' : 'eager'}
              sizes={`(max-width: 640px) 100vw, (max-width: 1024px) 50vw, ${100 / columns}vw`}
            />
            
            {/* Overlay */}
            {enableLightbox && (
              <button
                onClick={() => openLightbox(index)}
                className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors duration-300 focus:bg-black/40 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
                aria-label={`View ${photo.alt} in lightbox`}
              >
                <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-300" />
              </button>
            )}

            {/* Caption overlay */}
            {photo.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-white text-sm truncate">{photo.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {enableLightbox && (
        <Lightbox
          photos={photos}
          currentIndex={currentIndex}
          isOpen={lightboxOpen}
          onClose={closeLightbox}
          onNext={goToNext}
          onPrev={goToPrev}
        />
      )}
    </>
  );
}
