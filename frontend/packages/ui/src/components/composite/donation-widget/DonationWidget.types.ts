import type { TenantTheme } from '../../../lib/tenant-theme';

/** Props for {@link DonationWidget}. */
export interface DonationWidgetProps {
  /** Preset amounts in EUR. Defaults to [10, 20, 50, 100]. */
  presets?: number[];
  /** Called with the configured (not yet charged) donation intent. */
  onConfigure?: (selection: { amount: number; recurring: boolean }) => void;
  /** Widget heading. */
  title?: string;
  /** Tenant theming. */
  tenant?: TenantTheme;
  /** Extra class name. */
  className?: string;
}
