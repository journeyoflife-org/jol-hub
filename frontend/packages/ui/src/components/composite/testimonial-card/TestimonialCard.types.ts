import type { TenantTheme } from '../../../lib/tenant-theme';

/** Props for {@link TestimonialCard}. */
export interface TestimonialCardProps {
  /** Quoted text. */
  quote: string;
  /** Attribution name. */
  author: string;
  /** Attribution role/context, e.g. "parishioner". */
  role?: string;
  /** Tenant theming. */
  tenant?: TenantTheme;
  /** Extra class name. */
  className?: string;
}
