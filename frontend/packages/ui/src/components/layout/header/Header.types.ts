import type { TenantTheme } from '../../../lib/tenant-theme';
import type { NavItem } from '../main-nav/MainNav.types';

/** Props for {@link Header}. */
export interface HeaderProps {
  /** Logo content (tenant-aware — pass tenant name/mark). */
  logo: React.ReactNode;
  /** Navigation items for desktop + mobile nav. */
  navItems: NavItem[];
  /** Action area (theme toggle, language switcher, CTA). */
  actions?: React.ReactNode;
  /** Sticky positioning. Defaults to true. */
  sticky?: boolean;
  /**
   * Transparent over hero until scrolled, then solid.
   * Only meaningful with a dark hero below. Defaults to false.
   */
  transparentOnScroll?: boolean;
  /** Tenant theming. */
  tenant?: TenantTheme;
  /** Extra class name. */
  className?: string;
}
