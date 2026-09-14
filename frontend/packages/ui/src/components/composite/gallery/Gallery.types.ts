/** A gallery image. `alt` is REQUIRED — there is no fallback. */
export interface GalleryImage {
  src: string;
  /** Alternative text — mandatory (type-level enforcement). */
  alt: string;
  /** Intrinsic width (CLS prevention). */
  width: number;
  /** Intrinsic height (CLS prevention). */
  height: number;
  caption?: string;
}

/** Props for {@link Gallery}. */
export interface GalleryProps {
  /** Images to display. */
  images: GalleryImage[];
  /** Accessible label for the gallery region. */
  label?: string;
  /** Grid columns at desktop. Defaults to 3. */
  columns?: 2 | 3 | 4;
  /** Extra class name. */
  className?: string;
}
