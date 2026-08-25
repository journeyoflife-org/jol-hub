/**
 * SubscriptionCtaModule — call-to-action banner (STEP 6 module).
 *
 * Content (from PageConfig): `heading`, `description`, `ctaLabel`, `ctaHref`.
 * A simple, accessible CTA section. Renders nothing without a heading+CTA.
 */
import type { ModuleProps } from './types';

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export default function SubscriptionCtaModule({ content, basePath }: ModuleProps) {
  const heading = asString(content.heading);
  const ctaLabel = asString(content.ctaLabel);
  if (!heading || !ctaLabel) return null;

  const description = asString(content.description);
  const ctaHref = asString(content.ctaHref) ?? `${basePath}/contact`;

  return (
    <section className="rounded-lg bg-primary px-6 py-10 text-center">
      <h2 className="font-heading text-2xl font-bold text-neutral-50">{heading}</h2>
      {description && <p className="mt-2 text-neutral-100">{description}</p>}
      <a
        href={ctaHref}
        className="focus-ring mt-6 inline-flex items-center justify-center rounded-md bg-neutral-50 px-6 py-3 font-medium text-primary transition-colors hover:bg-neutral-100"
      >
        {ctaLabel}
      </a>
    </section>
  );
}
