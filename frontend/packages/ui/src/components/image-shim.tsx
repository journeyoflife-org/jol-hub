/**
 * Dependency-free image shim — standard <img> so the ui package carries no
 * Next.js dependency. Apps may wrap with their own Image component.
 * Extracted from photo-gallery.tsx (STEP 3 250-line rule).
 */

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

export const Image = ({ src, alt, width, height, className, priority, fill, loading, sizes }: ImageProps) => (
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
