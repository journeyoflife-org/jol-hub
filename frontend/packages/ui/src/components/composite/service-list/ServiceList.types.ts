import type { TenantTheme } from '../../../lib/tenant-theme';
import type { ServiceCardProps } from '../service-card';

/** Props for {@link ServiceList}. */
export interface ServiceListProps {
  /** Service cards, rendered in order as a semantic list. */
  items: ServiceCardProps[];
  /** Optional "view all" destination (absolute URL, SEO rule 1). */
  viewAllHref?: string;
  /** Tenant theming. */
  tenant?: TenantTheme;
  /** Extra class name. */
  className?: string;
}
