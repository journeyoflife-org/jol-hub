/**
 * GalleryModule — image gallery with lightbox (STEP 6 module).
 *
 * Content (from PageConfig): `images` ({ src, alt, width, height, caption }[]).
 * `alt` is mandatory per the ui contract (type-level enforcement). Renders
 * nothing when no valid images are provided.
 */
import { Gallery } from '@jol-hub/ui/components/composite';
import type { GalleryImage } from '@jol-hub/ui/components/composite';
import type { ModuleProps } from './types';

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
}

export default function GalleryModule({ content }: ModuleProps) {
  const rawImages = Array.isArray(content.images) ? content.images : [];

  const images: GalleryImage[] = (
    rawImages as Array<{
      src?: unknown;
      alt?: unknown;
      width?: unknown;
      height?: unknown;
      caption?: unknown;
    }>
  )
    // CLS + a11y contract: src, alt, width, height are ALL required.
    .filter(
      (image) =>
        asString(image.src) && asString(image.alt) && asNumber(image.width) && asNumber(image.height),
    )
    .map((image) => ({
      src: asString(image.src) as string,
      alt: asString(image.alt) as string,
      width: asNumber(image.width) as number,
      height: asNumber(image.height) as number,
      caption: asString(image.caption),
    }));

  if (images.length === 0) return null;

  const columns = content.columns === 2 || content.columns === 4 ? content.columns : 3;
  const label = asString(content.label);
  return <Gallery images={images} columns={columns} label={label} />;
}
