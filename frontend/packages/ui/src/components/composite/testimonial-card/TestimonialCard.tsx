/**
 * TestimonialCard — quote + attribution, marked up as `<figure>`/
 * `<blockquote>` for correct semantics.
 */
import { cn } from '../../../lib/utils';
import { accentBorderClass } from '../../../lib/tenant-theme';
import type { TestimonialCardProps } from './TestimonialCard.types';

export function TestimonialCard({ quote, author, role, tenant, className }: TestimonialCardProps) {
  return (
    <figure
      className={cn(
        'rounded-lg border-s-4 bg-neutral-50 p-6 shadow-sm dark:bg-neutral-900',
        accentBorderClass(tenant),
        className,
      )}
    >
      <blockquote className="font-heading text-lg italic leading-relaxed text-neutral-800 dark:text-neutral-100">
        “{quote}”
      </blockquote>
      <figcaption className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
        <span className="font-medium text-neutral-900 dark:text-neutral-50">{author}</span>
        {role && <span> — {role}</span>}
      </figcaption>
    </figure>
  );
}
