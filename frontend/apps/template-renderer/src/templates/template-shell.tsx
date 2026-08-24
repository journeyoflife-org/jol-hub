/**
 * TemplateShell — shared composition base for all vertical templates.
 *
 * Arranges the tenant hero (localized name + vertical identity) and, when
 * fixture content exists, the typed content blocks via TemplateRenderer.
 * Vertical templates differentiate through `variant` (accent/arrangement),
 * keeping block rendering in ONE place.
 *
 * Vertical display labels are taxonomy DATA (localized like tenant names),
 * not UI chrome strings — they move to the message catalog when the
 * taxonomy stabilizes post-pilot.
 */
import { Badge } from '@jol-hub/ui';
import type { Vertical } from '@jol-hub/tenant-resolver';
import { TemplateRenderer } from '@/components/TemplateRenderer';
import { pickLocalized } from '@/lib/i18n-helpers';
import type { TemplateProps } from '@/lib/template-registry';

/** Localized vertical taxonomy labels (data, LT-first like tenant names). */
const VERTICAL_LABELS: Record<Vertical, { lt: string; en: string }> = {
  basilica: { lt: 'Bazilika', en: 'Basilica' },
  cathedral: { lt: 'Katedra', en: 'Cathedral' },
  diocese: { lt: 'Vyskupija', en: 'Diocese' },
  diaconate: { lt: 'Diakonatas', en: 'Diaconate' },
  deanery: { lt: 'Dekanatas', en: 'Deanery' },
  church: { lt: 'Bažnyčia', en: 'Church' },
  protestant: { lt: 'Protestantų bažnyčia', en: 'Protestant church' },
  orthodox: { lt: 'Stačiatikių cerkvė', en: 'Orthodox church' },
  'other-church': { lt: 'Bažnyčia', en: 'Church' },
  funeral: { lt: 'Laidojimo namai', en: 'Funeral home' },
  'cemetery-cleaning': { lt: 'Kapinių priežiūra', en: 'Cemetery care' },
};

/** Vertical accent classes (design-system tokens; memorial = subdued). */
const VARIANT_ACCENT: Record<string, string> = {
  sacred: 'border-liturgical-gold',
  administrative: 'border-primary',
  memorial: 'border-gray-400',
  service: 'border-liturgical-green',
};

export interface TemplateShellProps extends TemplateProps {
  /** Arrangement family — selects the hero accent. */
  variant: keyof typeof VARIANT_ACCENT;
}

export function TemplateShell({
  tenant,
  locale,
  basePath,
  content,
  pageData,
  variant,
}: TemplateShellProps) {
  const name = pickLocalized(tenant.name, locale);
  const label = VERTICAL_LABELS[tenant.vertical];
  const verticalLabel = locale === 'en' ? label.en : label.lt;
  const accent = VARIANT_ACCENT[variant] ?? VARIANT_ACCENT.sacred;

  return (
    <article data-tenant={tenant.slug} data-vertical={tenant.vertical} className="space-y-10">
      <section className={`text-center py-12 border-b-2 ${accent}`}>
        <Badge variant="outline" className="mb-3 uppercase tracking-wide">
          {verticalLabel}
        </Badge>
        <h1 className="text-4xl font-heading font-bold text-primary">{name}</h1>
        {content?.tagline && (
          <p className="text-lg text-gray-600 mt-3">{pickLocalized(content.tagline, locale)}</p>
        )}
      </section>

      {content && pageData ? (
        <TemplateRenderer fixture={content} page={pageData} basePath={basePath} />
      ) : null}
    </article>
  );
}
