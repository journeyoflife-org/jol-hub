/**
 * TemplateRenderer — single component that renders ANY tenant.
 *
 * Switches on the tenant `vertical` to select a layout family, then renders
 * the page's typed content blocks. This replaces the 12 hard-coded lt-*
 * demo apps: tenants are data (seed-data fixtures), not code.
 *
 * ROLLBACK NOTE (STEP 1): if a legacy lt-* app must be restored, check it
 * out from git history (branch `feat/template-renderer-step1`). Its content
 * remains available as a fixture in `@jol-hub/seed-data` either way.
 */
import { Badge, Card, CardContent } from '@jol-hub/ui';
import type {
  ContentBlock,
  LocalizedText,
  TenantFixture,
  TenantPage,
} from '@jol-hub/seed-data';
import { FAMILY_ACCENT, VERTICAL_ACCENT_OVERRIDE, VERTICAL_FAMILY } from '../lib/layout-families';

/** Pick the display string for localized text (Lithuanian-first). */
function t(text: LocalizedText | undefined): string {
  if (!text) return '';
  return text.lt || text.en || '';
}

interface TemplateRendererProps {
  fixture: TenantFixture;
  page: TenantPage;
  /** Tenant path prefix, e.g. `/parish-st-john-vilnius`. */
  basePath: string;
}

export function TemplateRenderer({ fixture, page, basePath }: TemplateRendererProps) {
  const family = VERTICAL_FAMILY[fixture.vertical];
  const accent = VERTICAL_ACCENT_OVERRIDE[fixture.vertical] ?? FAMILY_ACCENT[family];

  // Tenant-relative links in fixtures (`/shop`, `/#candles`) are anchored
  // under the tenant prefix.
  const href = (target: string): string => (target.startsWith('/') ? `${basePath}${target}` : target);

  // STEP 12 (WCAG 2.4.6): every page needs exactly one h1. The hero block
  // renders its own; pages without a hero get the localized page title.
  const hasHeroHeading = page.contentBlocks.some((block) => block.type === 'hero');

  return (
    <article data-tenant={fixture.slug} data-vertical={fixture.vertical} className="space-y-10">
      {!hasHeroHeading && t(page.title) && (
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary">{t(page.title)}</h1>
      )}
      {page.contentBlocks.map((block, index) => (
        <BlockView key={`${block.type}-${index}`} block={block} accent={accent} href={href} />
      ))}
    </article>
  );
}

interface BlockViewProps {
  block: ContentBlock;
  accent: string;
  href: (target: string) => string;
}

function BlockView({ block, accent, href }: BlockViewProps) {
  switch (block.type) {
    case 'hero':
      return (
        <section className={`py-8 border-b-2 ${accent}`}>
          <div className={block.image ? 'grid md:grid-cols-2 gap-8 items-center' : 'text-center'}>
            <div className={block.image ? 'text-center md:text-start' : ''}>
              <h1 className="text-4xl font-heading font-bold text-primary mb-2">{t(block.heading)}</h1>
              {block.heading.en && <p className="text-xl text-gray-600">{block.heading.en}</p>}
              {block.subheading && <p className="text-lg text-gray-700 mt-3">{t(block.subheading)}</p>}
              {block.body && <p className="text-gray-500 mt-2">{t(block.body)}</p>}
            </div>
            {block.image && (
              // Explicit width/height (CLS) + localized alt (WCAG 1.1.1).
              <img
                src={block.image.src}
                alt={t(block.image.alt)}
                width={block.image.width}
                height={block.image.height}
                loading="eager"
                className="w-full h-auto max-h-80 object-cover rounded-xl shadow-lg"
              />
            )}
          </div>
        </section>
      );

    case 'text':
      return (
        <section>
          {block.heading && (
            <h2 className="text-2xl font-heading font-bold text-primary mb-3">{t(block.heading)}</h2>
          )}
          <p className="text-gray-700 leading-relaxed">{t(block.body)}</p>
        </section>
      );

    case 'keyValue':
      return (
        <Card>
          <CardContent className="p-6">
            {block.heading && (
              <h2 className="text-xl font-heading font-bold text-primary mb-4">{t(block.heading)}</h2>
            )}
            <dl className="grid md:grid-cols-2 gap-x-8 gap-y-2">
              {block.items.map((item) => (
                <div key={t(item.label)} className="flex justify-between gap-4 text-sm">
                  <dt className="text-gray-500">{t(item.label)}</dt>
                  <dd className="font-medium text-right">{item.value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      );

    case 'schedule':
      return (
        <section>
          {block.heading && (
            <h2 className="text-2xl font-heading font-bold text-primary mb-4">{t(block.heading)}</h2>
          )}
          <div className="grid md:grid-cols-2 gap-4">
            {block.entries.map((entry) => (
              <Card key={`${entry.day}-${entry.times.join('-')}`}>
                <CardContent className="p-4">
                  <h3 className="font-heading text-lg text-primary">{entry.day}</h3>
                  {entry.dayEn && entry.dayEn !== entry.day && (
                    <p className="text-xs text-gray-500">{entry.dayEn}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {entry.times.map((time) => (
                      <Badge key={time} className="bg-primary text-white">
                        {time}
                      </Badge>
                    ))}
                  </div>
                  {entry.notes && <p className="text-sm text-gray-500 mt-2">{entry.notes}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      );

    case 'list':
      return (
        <section>
          {block.heading && (
            <h2 className="text-2xl font-heading font-bold text-primary mb-4">{t(block.heading)}</h2>
          )}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {block.items.map((item) => (
              <Card key={t(item.title)}>
                <CardContent className="p-4">
                  <h3 className="font-medium text-primary">{t(item.title)}</h3>
                  {item.title.en && item.title.en !== item.title.lt && (
                    <p className="text-sm text-gray-500">{item.title.en}</p>
                  )}
                  {item.subtitle && <p className="text-sm text-gray-600 mt-1">{t(item.subtitle)}</p>}
                  {item.description && (
                    <p className="text-sm text-gray-600 mt-1">{t(item.description)}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {typeof item.price === 'number' && (
                      <Badge className="bg-liturgical-gold text-primary">
                        {item.price.toFixed(2)} EUR
                      </Badge>
                    )}
                    {item.tags?.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      );

    case 'stats':
      return (
        <section className="text-center py-4">
          {block.heading && (
            <h2 className="text-2xl font-heading font-bold text-primary mb-6">{t(block.heading)}</h2>
          )}
          <div className="grid md:grid-cols-4 gap-4">
            {block.items.map((item) => (
              <div key={t(item.label)} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                <p className="text-3xl font-bold text-primary">
                  {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                </p>
                <p className="text-sm text-gray-600">{t(item.label)}</p>
              </div>
            ))}
          </div>
        </section>
      );

    case 'cta':
      return (
        <section className="py-8 px-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          {block.heading && (
            <h2 className="text-2xl font-heading font-bold text-primary mb-5 text-center">
              {t(block.heading)}
            </h2>
          )}
          <div className="flex flex-wrap justify-center gap-4">
          {block.links.map((link, linkIndex) => (
            <a
              key={href(link.href)}
              href={href(link.href)}
              className={
                linkIndex === 0
                  ? 'inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-white font-medium hover:bg-primary-700 transition-colors'
                  : 'inline-flex items-center justify-center rounded-md border border-primary px-6 py-3 text-primary font-medium hover:bg-gray-100 transition-colors'
              }
            >
              {t(link.label)}
            </a>
          ))}
          </div>
        </section>
      );

    default: {
      // Exhaustiveness guard: unknown block types render nothing rather than
      // leaking raw fixture payloads.
      const _exhaustive: never = block;
      return null;
    }
  }
}
