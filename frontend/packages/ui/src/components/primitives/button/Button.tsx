/**
 * Button — primary interactive control.
 *
 * - Variants: primary / secondary / ghost / danger / link
 * - Sizes: xs / sm / md / lg / icon
 * - States: default / hover / active / disabled / loading
 * - `asChild` polymorphic pattern (Radix Slot) for links styled as buttons
 * - Native `<button>` semantics: Space/Enter activation comes free
 * - Focus indicator uses the design-system `.focus-ring` token
 */
import { Slot } from '@radix-ui/react-slot';

import { cn } from '../../../lib/utils';
import { accentTextClass, type TenantTheme } from '../../../lib/tenant-theme';
import { Spinner } from '../spinner';
import type { ButtonProps, ButtonSize, ButtonVariant } from './Button.types';

const BASE =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium ' +
  'transition-colors motion-reduce:transition-none focus-ring ' +
  'disabled:pointer-events-none disabled:opacity-50';

const VARIANTS: Record<ButtonVariant, (tenant?: TenantTheme) => string> = {
  primary: () =>
    'bg-primary text-neutral-50 hover:bg-primary-700 active:bg-primary-900 dark:bg-primary-500 dark:hover:bg-primary-400 dark:active:bg-primary-600',
  secondary: (tenant) =>
    cn(
      'border border-neutral-300 bg-neutral-50 text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50 dark:hover:bg-neutral-800',
      tenant?.vertical ? accentTextClass(tenant) : '',
    ),
  ghost: (tenant) =>
    cn(
      'bg-transparent text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 dark:text-neutral-50 dark:hover:bg-neutral-800',
      tenant?.vertical ? accentTextClass(tenant) : '',
    ),
  danger: () =>
    'bg-error-700 text-neutral-50 hover:bg-error-800 active:bg-error-900 dark:bg-error-600 dark:hover:bg-error-700',
  link: (tenant) =>
    cn(
      'h-auto p-0 underline-offset-4 hover:underline',
      tenant?.vertical ? accentTextClass(tenant) : 'text-primary dark:text-info-300',
    ),
};

const SIZES: Record<ButtonSize, string> = {
  xs: 'h-7 px-2 text-xs',
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
  icon: 'h-10 w-10',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  asChild = false,
  tenant,
  className,
  children,
  disabled,
  type,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const classes = cn(BASE, VARIANTS[variant](tenant), variant !== 'link' && SIZES[size], className);

  // `asChild` polymorphic rendering: Slot requires EXACTLY one element
  // child, so the loading spinner is never injected on this path
  // (links cannot be disabled safely anyway — set `aria-disabled` on the
  // target element yourself if needed).
  if (asChild) {
    return (
      <Slot className={classes} aria-busy={loading || undefined} {...props}>
        {children}
      </Slot>
    );
  }

  return (
    <button
      type={type ?? 'button'}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={classes}
      {...props}
    >
      {loading && <Spinner size="sm" label="" className="text-current" />}
      {children}
    </button>
  );
}
