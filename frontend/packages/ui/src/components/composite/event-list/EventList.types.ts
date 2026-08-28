import type { TenantTheme } from '../../../lib/tenant-theme';
import type { EventCardProps } from '../event-card';

/** Props for {@link EventList}. */
export interface EventListProps {
  /** Event cards, rendered in order as a semantic list. */
  items: EventCardProps[];
  /** Optional "view all" destination (absolute URL, SEO rule 1). */
  viewAllHref?: string;
  /** Tenant theming. */
  tenant?: TenantTheme;
  /** Extra class name. */
  className?: string;
}
