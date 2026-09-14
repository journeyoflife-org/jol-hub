import type { NavItem } from '../main-nav/MainNav.types';

/** Props for {@link MobileNav}. */
export interface MobileNavProps {
  /** Drawer visibility. */
  open: boolean;
  /** Request to close (backdrop click, Escape, close button). */
  onClose: () => void;
  /** Navigation items (same shape as MainNav). */
  items: NavItem[];
  /** Accessible label for the drawer. */
  label?: string;
}
