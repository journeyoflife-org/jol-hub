import type { TenantTheme } from '../../../lib/tenant-theme';

/** Props for {@link ProductCard}. */
export interface ProductCardProps {
  /** Product title. */
  title: string;
  /** Product description/excerpt. */
  description?: string;
  /** Image URL (tenant-provided; renders as plain <img> with alt policy). */
  image?: string;
  /** Image alt text (required when image present — DS-A11Y-02). */
  imageAlt?: string;
  /** VAT-inclusive price, decimal string (schema.org convention). */
  price?: string;
  /** Currency code label, e.g. "EUR". */
  currency?: string;
  /** Availability state — display only. */
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  /** Tenant theming. */
  tenant?: TenantTheme;
  /** Extra class name. */
  className?: string;
}
