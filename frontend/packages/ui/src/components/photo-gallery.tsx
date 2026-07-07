/**
 * PhotoGallery Component
 * Next.js Image optimization with lightbox modal
 * Lazy loading, responsive grid, keyboard navigation
 * WCAG 2.1 AA accessible
 */

'use client';

import { useState, useCallback, useEffect } from 'react';

// Use standard img tag to avoid Next.js dependency in UI package
// Apps using this component should wrap with their own Image component if needed
interface ImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  loading?: 'eager' | 'lazy';
  sizes?: string;
}

const Image = ({ src, alt, width, height, className, priority, fill, loading, sizes }: ImageProps) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src={src}
    alt={alt}
    width={width}
    height={height}
    className={className}
    loading={priority ? 'eager' : loading}
    sizes={sizes}
    style={fill ? { position: 'absolute', inset: 0, width: '100%', height: '100%' } : undefined}
  />
);
import { Dialog, DialogContent, DialogTitle } from './dialog';
import { Button } from './button';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';

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

// =============================================================================
// LIGHTBOX COMPONENT
// =============================================================================

interface LightboxProps {
  photos: Photo[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

function Lightbox({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onNext,
  onPrev,
}: LightboxProps): JSX.Element | null {
  const currentPhoto = photos[currentIndex];

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowRight':
          onNext();
          break;
        case 'ArrowLeft':
          onPrev();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNext, onPrev]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!currentPhoto) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 border-0 bg-black/95">
        <DialogTitle className="sr-only">
          Image {currentIndex + 1} of {photos.length}: {currentPhoto.alt}
        </DialogTitle>
        
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
          onClick={onClose}
          aria-label="Close lightbox"
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Navigation */}
        {photos.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
              onClick={onPrev}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
              onClick={onNext}
              aria-label="Next image"
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          </>
        )}

        {/* Image counter */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 text-white text-sm">
          {currentIndex + 1} / {photos.length}
        </div>

        {/* Image */}
        <div className="relative w-full h-full flex items-center justify-center p-4">
          <Image
            src={currentPhoto.src}
            alt={currentPhoto.alt}
            width={currentPhoto.width || 1200}
            height={currentPhoto.height || 800}
            className="max-w-full max-h-[85vh] w-auto h-auto object-contain"
            priority
          />
        </div>

        {/* Caption */}
        {currentPhoto.caption && (
          <div className="absolute bottom-12 left-0 right-0 text-center text-white px-4">
            <p className="text-sm bg-black/50 inline-block px-3 py-1 rounded">
              {currentPhoto.caption}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

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
