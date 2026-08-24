/**
 * Badge — small status/metadata label.
 *
 * Variants include `vertical` (tenant accent color) and
 * `liturgical-season` (gold) for feast/season markers.
 */
import { cn } from '../../../lib/utils';
import { accentBgClass, type TenantTheme } from '../../../lib/tenant-theme';
import type { BadgeProps, BadgeSize, BadgeVariant } from './Badge.types';

const SIZES: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[0.6875rem]',
  md: 'px-2 py-0.5 text-xs',
  lg: 'px-2.5 py-1 text-sm',
};

function variantClass(variant: BadgeVariant, tenant?: TenantTheme): string {
  switch (variant) {
    case 'default':
      return 'bg-primary text-neutral-50 dark:bg-primary-500';
    case 'secondary':
      return 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50';
    case 'outline':
      return 'border border-neutral-300 text-neutral-900 dark:border-neutral-700 dark:text-neutral-50';
    case 'destructive':
      return 'bg-error-700 text-neutral-50 dark:bg-error-600';
    case 'vertical':
      return cn(accentBgClass(tenant), 'text-neutral-50');
    case 'liturgical-season':
      return 'bg-liturgical-gold text-primary-900';
    default:
      return '';
  }
}

export function Badge({ variant = 'default', size = 'md', tenant, className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium leading-none',
        SIZES[size],
        variantClass(variant, tenant),
        className,
      )}
      {...props}
    />
  );
}
