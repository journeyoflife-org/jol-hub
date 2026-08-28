/**
 * PhotoGallery lightbox — keyboard-navigable image dialog. Extracted from
 * photo-gallery.tsx (STEP 3 250-line rule).
 */

'use client';

import { useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from './dialog';
import { Button } from './button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Image } from './image-shim';
import type { Photo } from './photo-gallery';

export interface LightboxProps {
  photos: Photo[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export function Lightbox({
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
