/**
 * Skeleton — loading placeholder.
 *
 * Decorative (`aria-hidden`): the surrounding live region or button state
 * communicates loading to assistive technology. Pulse animation is
 * disabled under `prefers-reduced-motion`.
 */
import { cn } from '../../../lib/utils';
import type { SkeletonProps } from './Skeleton.types';

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-md bg-neutral-200 motion-reduce:animate-none dark:bg-neutral-800',
        className
      )}
    />
  );
}
