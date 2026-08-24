/**
 * Spinner — accessible loading indicator.
 *
 * Renders `role="status"` with a screen-reader label; animation is
 * disabled under `prefers-reduced-motion` (a static indicator remains).
 */
import { cn } from '../../../lib/utils';
import type { SpinnerProps } from './Spinner.types';

const SIZES = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
} as const;

export function Spinner({ size = 'md', label = 'Kraunama… / Loading…', className }: SpinnerProps) {
  return (
    <span role="status" className={cn('inline-flex items-center justify-center', className)}>
      <span
        aria-hidden="true"
        className={cn(
          'inline-block animate-spin rounded-full border-current border-t-transparent text-primary motion-reduce:animate-none',
          SIZES[size],
        )}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
