/** Sidebar section. */
export interface SidebarSection {
  title: string;
  links: { label: string; href: string; active?: boolean }[];
}

/** Props for {@link Sidebar}. */
export interface SidebarProps {
  /** Grouped link sections. */
  sections: SidebarSection[];
  /** Accessible label for the nav landmark. */
  label?: string;
  /** Extra class name. */
  className?: string;
}
