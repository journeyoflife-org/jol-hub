/**
 * Open Graph image helpers — STEP 11.
 *
 * SPEC: 1200×630px, < 1MB, branded with tenant identity. The ACTUAL raster
 * rendering requires `@vercel/og`/`satori`, which is not yet available in
 * this workspace; this module defines the contract (dimensions, URL scheme,
 * fallback chain) so the rendering route can land without metadata changes.
 *
 * FALLBACK CHAIN (never emit broken og:image):
 *   1. tenant/fixture-provided image (when available);
 *   2. generated OG image at {@link ogImagePath} (once the renderer lands);
 *   3. undefined — og:image omitted rather than broken (valid but imageless).
 */

/** Required OG image dimensions (Facebook/LinkedIn/X standard). */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
/** Max payload (bytes) — spec: < 1MB. */
export const OG_IMAGE_MAX_BYTES = 1_000_000;

/** Tenant-scoped OG image route path (renderer implements the rasterizer). */
export function ogImagePath(tenantSlug: string, route: string): string {
  const cleanRoute = route === '/' ? '' : encodeURIComponent(route.replace(/^\//, ''));
  return cleanRoute
    ? `/${tenantSlug}/og.png?r=${cleanRoute}`
    : `/${tenantSlug}/og.png`;
}

/**
 * Resolve the og:image for a page: explicit tenant image first, else the
 * generated-image path when generation is enabled, else undefined (omit).
 */
export function resolveOgImage(options: {
  tenantImage?: string;
  generationEnabled: boolean;
  tenantSlug: string;
  route: string;
}): string | undefined {
  if (options.tenantImage) return options.tenantImage;
  if (options.generationEnabled) return ogImagePath(options.tenantSlug, options.route);
  return undefined;
}

/** Twitter card policy: summary_large_image when an image exists. */
export function twitterCardFor(image: string | undefined): {
  card: 'summary_large_image' | 'summary';
} {
  return { card: image ? 'summary_large_image' : 'summary' };
}
