/**
 * TestimonialModule — quoted endorsement (STEP 6 module).
 *
 * Content (from PageConfig): `quote` (required), `author`, `role`. Renders
 * nothing without a quote. Tenant data is never used as a testimonial source
 * (no fabricated endorsements).
 */
import { TestimonialCard } from '@jol-hub/ui/components/composite';
import { tenantThemeFor, type ModuleProps } from './types';

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export default function TestimonialModule({ tenant, content }: ModuleProps) {
  const quote = asString(content.quote);
  if (!quote) return null;

  return (
    <TestimonialCard
      quote={quote}
      author={asString(content.author) ?? ''}
      role={asString(content.role)}
      tenant={tenantThemeFor(tenant)}
    />
  );
}
