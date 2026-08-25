/**
 * MapModule — embedded map (STEP 6 module).
 *
 * Content (from PageConfig): `src` (provider embed URL — OpenStreetMap by
 * default for GDPR; Google only behind a consent gate) and `title`. Renders
 * nothing without a `src` — the pilot ships no geocoded coordinates, so the
 * map collapses rather than embedding a third-party tracker by default.
 */
import { MapEmbed } from '@jol-hub/ui/components/composite';
import { getMessages, translate, isSupportedLocale } from '@jol-hub/i18n';
import { DEFAULT_LOCALE } from '@jol-hub/i18n/config';
import type { ModuleProps } from './types';

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export default function MapModule({ content, locale }: ModuleProps) {
  const src = asString(content.src);
  if (!src) return null;

  const effectiveLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
  const title = asString(content.title) ?? translate(getMessages(effectiveLocale), 'collections.mapTitle');
  const aspect =
    content.aspect === 'square' || content.aspect === 'wide' ? content.aspect : 'video';

  return <MapEmbed src={src} title={title} aspect={aspect} />;
}
