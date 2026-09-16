/**
 * Separator — accessible divider (WAI-ARIA `separator` role semantics via
 * native `<hr>` for horizontal, `role="separator"` for vertical).
 */
import { cn } from '../../../lib/utils';
import type { SeparatorProps } from './Separator.types';

export function Separator({ orientation = 'horizontal', decorative = true, className }: SeparatorProps) {
  const ariaRole = decorative ? undefined : 'separator';

  if (orientation === 'vertical') {
    return (
      <span
        role={ariaRole}
        aria-orientation={decorative ? undefined : 'vertical'}
        className={cn('inline-block h-full w-px self-stretch bg-neutral-200 dark:bg-neutral-800', className)}
      />
    );
  }

  return (
    <hr
      role={ariaRole}
      aria-orientation={decorative ? undefined : 'horizontal'}
      className={cn('h-px w-full border-0 bg-neutral-200 dark:bg-neutral-800', className)}
    />
  );
}
