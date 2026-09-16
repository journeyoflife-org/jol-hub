import type { TenantTheme } from '../../../lib/tenant-theme';

/** One course entry of a {@link CourseList}. */
export interface CourseItem {
  /** Course title. */
  title: string;
  /** Course description/excerpt. */
  description?: string;
  /** Human-readable schedule label (e.g. "Tuesdays 18:00"). */
  schedule?: string;
  /** Level/audience label (controlled vocabulary, caller-resolved). */
  level?: string;
  /** Detail link (absolute URL, SEO rule 1). */
  href?: string;
}

/** Props for {@link CourseList}. */
export interface CourseListProps {
  /** Course entries, rendered in order as a semantic list. */
  items: CourseItem[];
  /** Tenant theming. */
  tenant?: TenantTheme;
  /** Extra class name. */
  className?: string;
}
