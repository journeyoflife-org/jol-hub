import type { TenantTheme } from '../../../lib/tenant-theme';

/** Props for {@link EventCard}. */
export interface EventCardProps {
  /** Event title (card heading). */
  title: string;
  /** ISO 8601 start date-time (renders `<time dateTime>`). */
  startDateTime: string;
  /** Human-readable date label. */
  dateLabel: string;
  /** Human-readable time label. */
  timeLabel?: string;
  /** Location name. */
  location?: string;
  /** Marks a recurring event (renders a badge). */
  recurring?: boolean;
  /** Excerpt text. */
  description?: string;
  /** Detail link. */
  href?: string;
  /** Tenant theming. */
  tenant?: TenantTheme;
  /** Extra class name. */
  className?: string;
}
