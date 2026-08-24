import type { TenantTheme } from '../../../lib/tenant-theme';

/** Props for {@link NewsCard}. */
export interface NewsCardProps {
  title: string;
  /** ISO 8601 publication date (renders `<time dateTime>`). */
  publishedAt: string;
  /** Human-readable date label. */
  dateLabel: string;
  /** Author name. */
  author?: string;
  /** Category label (renders a badge). */
  category?: string;
  /** Excerpt text. */
  excerpt: string;
  /** Estimated reading time, e.g. "4 min". */
  readTime?: string;
  /** Article link. */
  href?: string;
  /** Tenant theming. */
  tenant?: TenantTheme;
  /** Extra class name. */
  className?: string;
}
