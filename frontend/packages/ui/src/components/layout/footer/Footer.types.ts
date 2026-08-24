import type { TenantTheme } from '../../../lib/tenant-theme';

/** Footer link descriptor. */
export interface FooterLink {
  label: string;
  href: string;
}

/** Social link descriptor (aria-label required). */
export interface SocialLink {
  /** Accessible name, e.g. "Facebook". */
  label: string;
  href: string;
  /** Inline SVG or icon element (aria-hidden internally). */
  icon: React.ReactNode;
}

/** Props for {@link Footer}. */
export interface FooterProps {
  /** Brand column content (name, blurb). */
  brand: React.ReactNode;
  /** Navigation column links. */
  navigation: FooterLink[];
  /** Contact column lines (address, phone, email). */
  contact: string[];
  /** Legal links: privacy, terms, cookies, accessibility statement. */
  legal: FooterLink[];
  /** Social links with mandatory aria-labels. */
  social?: SocialLink[];
  /** Copyright holder name (year is added dynamically). */
  copyrightHolder: string;
  /** Tenant theming. */
  tenant?: TenantTheme;
  /** Extra class name. */
  className?: string;
}
