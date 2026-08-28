import type { ReactNode } from 'react';
import type { TenantTheme } from '../../../lib/tenant-theme';

/** One summary stat shown in the vendor shell header. */
export interface VendorStat {
  /** Stat label (caller-resolved string). */
  label: string;
  /** Stat value as display text. */
  value: string;
}

/** Props for {@link VendorDashboardShell}. */
export interface VendorDashboardShellProps {
  /** Vendor display name (from the caller's data). */
  vendorName: string;
  /** Summary stats — display only, passed by the caller. */
  stats?: VendorStat[];
  /** Dashboard body content (consumer-composed). */
  children?: ReactNode;
  /** Tenant theming. */
  tenant?: TenantTheme;
  /** Extra class name. */
  className?: string;
}
