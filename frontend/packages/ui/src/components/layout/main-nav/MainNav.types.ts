/** A navigation item (optionally with a dropdown). */
export interface NavItem {
  label: string;
  href?: string;
  /** Active state indicator (e.g. current path prefix). */
  active?: boolean;
  /** Dropdown children. */
  children?: { label: string; href: string }[];
}

/** Props for {@link MainNav}. */
export interface MainNavProps {
  /** Navigation items. */
  items: NavItem[];
  /** Accessible label for the nav landmark. */
  label?: string;
  /** Extra class name. */
  className?: string;
}
