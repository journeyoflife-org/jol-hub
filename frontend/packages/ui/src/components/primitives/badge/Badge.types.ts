import type { TenantTheme } from '../../../lib/tenant-theme';

/** Visual style of the badge. */
export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'outline'
  | 'destructive'
  /** Vertical-specific accent — requires the `tenant` prop. */
  | 'vertical'
  /** Liturgical season accent (gold). */
  | 'liturgical-season';

/** Badge size. */
export type BadgeSize = 'sm' | 'md' | 'lg';

/** Props for {@link Badge}. */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Visual style. Defaults to `default`. */
  variant?: BadgeVariant;
  /** Size. Defaults to `md`. */
  size?: BadgeSize;
  /** Tenant theming — required for `variant="vertical"`. */
  tenant?: TenantTheme;
}
