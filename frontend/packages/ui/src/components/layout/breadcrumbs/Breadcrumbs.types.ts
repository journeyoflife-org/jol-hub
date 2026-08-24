/** A breadcrumb entry. */
export interface BreadcrumbItem {
  label: string;
  /** Link target; the last item is rendered as plain text regardless. */
  href?: string;
}

/** Props for {@link Breadcrumbs}. */
export interface BreadcrumbsProps {
  /** Trail from root to current page (last = current). */
  items: BreadcrumbItem[];
  /** Accessible label for the nav landmark. Defaults to "Breadcrumb". */
  label?: string;
  /** Extra class name. */
  className?: string;
}
