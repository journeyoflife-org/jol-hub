/**
 * Card — content container with header/content/footer/media slots.
 *
 * Variants: `default` (border), `outlined`, `elevated` (shadow),
 * `interactive` (clickable affordances: hover elevation + focus ring).
 */
import { cn } from '../../../lib/utils';
import { accentBorderClass, type TenantTheme } from '../../../lib/tenant-theme';
import type {
  CardMediaAspect,
  CardMediaProps,
  CardProps,
  CardSlotProps,
} from './Card.types';

const VARIANTS: Record<'default' | 'outlined' | 'elevated', (tenant?: TenantTheme) => string> = {
  default: () => 'border border-neutral-200 dark:border-neutral-800',
  outlined: () => 'border-2 border-neutral-200 dark:border-neutral-700',
  elevated: () => 'shadow-md dark:shadow-none dark:border dark:border-neutral-800',
};

const ASPECTS: Record<CardMediaAspect, string> = {
  auto: '',
  square: 'aspect-square',
  video: 'aspect-video',
  wide: 'aspect-[21/9]',
  portrait: 'aspect-[3/4]',
};

export function Card({ variant = 'default', tenant, className, ...props }: CardProps) {
  if (variant === 'interactive') {
    return (
      <div
        className={cn(
          'overflow-hidden rounded-lg bg-neutral-50 transition-shadow motion-reduce:transition-none',
          'shadow-sm hover:shadow-lg focus-within:shadow-lg dark:bg-neutral-900',
          'hover:border-transparent',
          cn('border', tenant?.vertical ? accentBorderClass(tenant) : 'border-neutral-200 dark:border-neutral-800'),
          className,
        )}
        {...props}
      />
    );
  }
  return (
    <div
      className={cn('overflow-hidden rounded-lg bg-neutral-50 dark:bg-neutral-900', VARIANTS[variant](tenant), className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: CardSlotProps) {
  return <div className={cn('flex flex-col gap-1.5 p-4 pb-2', className)} {...props} />;
}

export function CardTitle({ className, ...props }: CardSlotProps) {
  return <h3 className={cn('font-heading text-lg font-semibold leading-tight', className)} {...props} />;
}

export function CardDescription({ className, ...props }: CardSlotProps) {
  return <p className={cn('text-sm text-neutral-600 dark:text-neutral-300', className)} {...props} />;
}

export function CardContent({ className, ...props }: CardSlotProps) {
  return <div className={cn('p-4 pt-2', className)} {...props} />;
}

export function CardFooter({ className, ...props }: CardSlotProps) {
  return <div className={cn('flex items-center gap-2 p-4 pt-0', className)} {...props} />;
}

export function CardMedia({ aspect = 'video', className, alt, ...props }: CardMediaProps) {
  return (
    <div className={cn('w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800', ASPECTS[aspect])}>
      <img alt={alt} loading="lazy" className={cn('h-full w-full object-cover', className)} {...props} />
    </div>
  );
}
