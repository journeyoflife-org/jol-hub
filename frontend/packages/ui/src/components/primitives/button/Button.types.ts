import type { TenantTheme } from '../../../lib/tenant-theme';

/** Visual style of the button. */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';

/** Size presets. `icon` renders a square icon button. */
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon';

/** Props for {@link Button}. */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. Defaults to `primary`. */
  variant?: ButtonVariant;
  /** Size preset. Defaults to `md`. */
  size?: ButtonSize;
  /**
   * Loading state: shows a spinner, sets `aria-busy`, and disables
   * interaction without losing the accessible name.
   */
  loading?: boolean;
  /**
   * Polymorphic rendering via Radix Slot: pass a link (or any element)
   * as the single child and it receives the button styles.
   */
  asChild?: boolean;
  /** Tenant theming — secondary/link variants pick up the vertical accent. */
  tenant?: TenantTheme;
}
