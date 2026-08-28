/**
 * LiveRegion — accessible announcement surface (WCAG 4.1.3).
 *
 * Renders a visually hidden `aria-live` region. Screen readers announce
 * content changes without moving focus. Use for async operation results,
 * validation summaries and route changes.
 */
import type { LiveRegionProps } from './LiveRegion.types';

export function LiveRegion({
  politeness = 'polite',
  message = '',
  atomic = true,
  className,
}: LiveRegionProps) {
  return (
    <div
      role={politeness === 'assertive' ? 'alert' : 'status'}
      aria-live={politeness}
      aria-atomic={atomic}
      className={className ?? 'sr-only'}
    >
      {message}
    </div>
  );
}
