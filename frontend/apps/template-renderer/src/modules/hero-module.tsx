/**
 * HeroModule — page hero (STEP 6 module).
 *
 * Content (from PageConfig): optional `title`, `subtitle`, `ctaButtons`.
 * Falls back to the tenant's own name/tagline (real data — never fabricated).
 */
import { Hero } from '@jol-hub/ui/components/composite';
import type { HeroCta } from '@jol-hub/ui/components/composite';
import { pickLocalized } from '@/lib/i18n-helpers';
import { tenantThemeFor, type ModuleProps } from './types';

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export default function HeroModule({ tenant, locale, content }: ModuleProps) {
  const title = asString(content.title) ?? pickLocalized(tenant.name, locale);
  // `tagline` lives on fixtures, not the registry Tenant — subtitle is
  // config-provided only (never fabricated).
  const subtitle = asString(content.subtitle);

  const ctaButtons: HeroCta[] = Array.isArray(content.ctaButtons)
    ? (content.ctaButtons as Array<{ label?: unknown; href?: unknown; emphasis?: unknown }>)
        .filter((cta) => asString(cta.label) && asString(cta.href))
        .map((cta) => ({
          label: asString(cta.label) as string,
          href: asString(cta.href) as string,
          emphasis: cta.emphasis === 'secondary' ? 'secondary' : 'primary',
        }))
    : [];

  return (
    <Hero
      title={title}
      subtitle={subtitle}
      ctaButtons={ctaButtons.length > 0 ? ctaButtons : undefined}
      tenant={tenantThemeFor(tenant)}
    />
  );
}
