import type { TenantTheme } from '../../../lib/tenant-theme';
import type { ProductCardProps } from '../product-card';

/** Props for {@link StorefrontGrid}. */
export interface StorefrontGridProps {
  /** Product cards, rendered in order as a responsive grid. */
  items: ProductCardProps[];
  /** Grid column count at desktop widths (2–4). */
  columns?: 2 | 3 | 4;
  /** Tenant theming. */
  tenant?: TenantTheme;
  /** Extra class name. */
  className?: string;
}
