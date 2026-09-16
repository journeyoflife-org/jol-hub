import type { TenantTheme } from '../../../lib/tenant-theme';

/** Props for {@link ServiceCard}. */
export interface ServiceCardProps {
  title: string;
  description?: string;
  /** Price in EUR — omit for non-commercial verticals. */
  price?: number;
  /** Duration label, e.g. "45 min". */
  duration?: string;
  /** Booking CTA (omit for informational services). */
  bookingCta?: { label: string; href: string };
  /** Tenant theming. */
  tenant?: TenantTheme;
  /** Extra class name. */
  className?: string;
}
