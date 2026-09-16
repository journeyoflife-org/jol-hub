import type { TenantTheme } from '../../../lib/tenant-theme';

/** Props for {@link MapBlock}. */
export interface MapBlockProps {
  /** Accessible title for the map figure (e.g. the entity name). */
  title: string;
  /** Coordinates (marker placement + external-map deep link). */
  latitude: number;
  longitude: number;
  /** Human-readable address line rendered as the figure caption. */
  addressLabel: string;
  /**
   * Optional external maps URL (user-initiated navigation only — the block
   * itself makes ZERO network requests; ePrivacy-safe by construction).
   */
  externalHref?: string;
  /** Aspect of the static canvas. */
  aspect?: 'square' | 'video';
  /** Tenant theming. */
  tenant?: TenantTheme;
  /** Extra class name. */
  className?: string;
}
