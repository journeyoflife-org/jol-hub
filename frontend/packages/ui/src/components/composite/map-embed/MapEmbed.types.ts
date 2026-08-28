/** Props for {@link MapEmbed}. */
export interface MapEmbedProps {
  /** Embed URL (provider-agnostic: Google/OSM embed endpoints). */
  src: string;
  /** Accessible title for the iframe (required). */
  title: string;
  /** Aspect ratio. Defaults to `video` (16:9). */
  aspect?: 'video' | 'square' | 'wide';
  /** Extra class name. */
  className?: string;
}
