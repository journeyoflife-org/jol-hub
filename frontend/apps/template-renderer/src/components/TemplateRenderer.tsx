/**
 * TemplateRenderer — single component that renders ANY tenant.
 *
 * Switches on the tenant `vertical` to select a layout family, then renders
 * the page's typed content blocks. This replaces the 12 hard-coded lt-*
 * demo apps: tenants are data (seed-data fixtures), not code.
 *
 * ROLLBACK NOTE (STEP 1): if a legacy lt-* app must be restored, check it
 * out from git history (branch `feat/template-renderer-step1`). Its content
 * remains available as a fixture in `@journeyoflife-org/seed-data` either way.
 */
import { Badge, Card, CardContent } from '@journeyoflife-org/ui';
import type {
  ContentBlock,
  LocalizedText,
  TenantFixture,
  TenantPage,
} from '@journeyoflife-org/seed-data';
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
  const href = (target: string): string =>
    target.startsWith('/') ? `${basePath}${target}` : target;

  // STEP 12 (WCAG 2.4.6): every page needs exactly one h1. The hero block
  // renders its own; pages without a hero get the localized page title.
  const hasHeroHeading = page.contentBlocks.some((block) => block.type === 'hero');

  return (
    <article data-tenant={fixture.slug} data-vertical={fixture.vertical} className="space-y-10">
      {!hasHeroHeading && t(page.title) && (
        <h1 className="font-heading text-primary text-3xl font-bold md:text-4xl">
          {t(page.title)}
        </h1>
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
        <section className={`border-b-2 py-8 ${accent}`}>
          <div className={block.image ? 'grid items-center gap-8 md:grid-cols-2' : 'text-center'}>
            <div className={block.image ? 'text-center md:text-start' : ''}>
              <h1 className="font-heading text-primary mb-2 text-4xl font-bold">
                {t(block.heading)}
              </h1>
              {block.heading.en && <p className="text-xl text-gray-600">{block.heading.en}</p>}
              {block.subheading && (
                <p className="mt-3 text-lg text-gray-700">{t(block.subheading)}</p>
              )}
              {block.body && <p className="mt-2 text-gray-500">{t(block.body)}</p>}
            </div>
            {block.image && (
              // Explicit width/height (CLS) + localized alt (WCAG 1.1.1).
              <img
                src={block.image.src}
                alt={t(block.image.alt)}
                width={block.image.width}
                height={block.image.height}
                loading="eager"
                className="h-auto max-h-80 w-full rounded-xl object-cover shadow-lg"
              />
            )}
          </div>
        </section>
      );

    case 'text':
      return (
        <section>
          {block.heading && (
            <h2 className="font-heading text-primary mb-3 text-2xl font-bold">
              {t(block.heading)}
            </h2>
          )}
          <p className="leading-relaxed text-gray-700">{t(block.body)}</p>
        </section>
      );

    case 'keyValue':
      return (
        <Card>
          <CardContent className="p-6">
            {block.heading && (
              <h2 className="font-heading text-primary mb-4 text-xl font-bold">
                {t(block.heading)}
              </h2>
            )}
            <dl className="grid gap-x-8 gap-y-2 md:grid-cols-2">
              {block.items.map((item) => (
                <div key={t(item.label)} className="flex justify-between gap-4 text-sm">
                  <dt className="text-gray-500">{t(item.label)}</dt>
                  <dd className="text-right font-medium">{item.value}</dd>
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
            <h2 className="font-heading text-primary mb-4 text-2xl font-bold">
              {t(block.heading)}
            </h2>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {block.entries.map((entry) => (
              <Card key={`${t(entry.day)}-${entry.times.join('-')}`}>
                <CardContent className="p-4">
                  <h3 className="font-heading text-primary text-lg">{t(entry.day)}</h3>
                  {entry.day.en && entry.day.en !== entry.day.lt && (
                    <p className="text-xs text-gray-500">{entry.day.en}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {entry.times.map((time) => (
                      <Badge key={time} className="bg-primary text-white">
                        {time}
                      </Badge>
                    ))}
                  </div>
                  {entry.notes && <p className="mt-2 text-sm text-gray-500">{entry.notes}</p>}
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
            <h2 className="font-heading text-primary mb-4 text-2xl font-bold">
              {t(block.heading)}
            </h2>
          )}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {block.items.map((item) => (
              <Card key={t(item.title)}>
                <CardContent className="p-4">
                  <h3 className="text-primary font-medium">{t(item.title)}</h3>
                  {item.title.en && item.title.en !== item.title.lt && (
                    <p className="text-sm text-gray-500">{item.title.en}</p>
                  )}
                  {item.subtitle && (
                    <p className="mt-1 text-sm text-gray-600">{t(item.subtitle)}</p>
                  )}
                  {item.description && (
                    <p className="mt-1 text-sm text-gray-600">{t(item.description)}</p>
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
        <section className="py-4 text-center">
          {block.heading && (
            <h2 className="font-heading text-primary mb-6 text-2xl font-bold">
              {t(block.heading)}
            </h2>
          )}
          <div className="grid gap-4 md:grid-cols-4">
            {block.items.map((item) => (
              <div key={t(item.label)} className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                <p className="text-primary text-3xl font-bold">
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
        <section className="rounded-lg bg-gray-100 px-4 py-8 dark:bg-gray-800">
          {block.heading && (
            <h2 className="font-heading text-primary mb-5 text-center text-2xl font-bold">
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
                    ? 'bg-primary hover:bg-primary-700 inline-flex items-center justify-center rounded-md px-6 py-3 font-medium text-white transition-colors'
                    : 'border-primary text-primary inline-flex items-center justify-center rounded-md border px-6 py-3 font-medium transition-colors hover:bg-gray-100'
                }
              >
                {t(link.label)}
              </a>
            ))}
          </div>
        </section>
      );

    case 'massSchedule':
      return (
        <section>
          {block.heading && (
            <h2 className="font-heading text-primary mb-4 text-2xl font-bold">
              {t(block.heading)}
            </h2>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {block.masses.map((mass) => (
              <Card key={`${t(mass.day)}-${mass.time}`}>
                <CardContent className="p-4">
                  <h3 className="font-heading text-primary text-lg">{t(mass.day)}</h3>
                  {mass.day.en && mass.day.en !== mass.day.lt && (
                    <p className="text-xs text-gray-500">{mass.day.en}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge className="bg-primary text-white">{mass.time}</Badge>
                    {mass.language && (
                      <Badge variant="outline">{mass.language}</Badge>
                    )}
                  </div>
                  {mass.notes && (
                    <p className="mt-2 text-sm text-gray-500">{t(mass.notes)}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      );

    case 'gallery':
      return (
        <section>
          {block.heading && (
            <h2 className="font-heading text-primary mb-4 text-2xl font-bold">
              {t(block.heading)}
            </h2>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {block.images.map((img) => (
              <figure key={img.src} className="overflow-hidden rounded-lg">
                <img
                  src={img.src}
                  alt={t(img.alt)}
                  width={img.width}
                  height={img.height}
                  loading="lazy"
                  className="h-auto w-full object-cover"
                />
                {img.caption && (
                  <figcaption className="mt-1 text-center text-sm text-gray-500">
                    {t(img.caption)}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </section>
      );

    case 'faq':
      return (
        <section>
          {block.heading && (
            <h2 className="font-heading text-primary mb-4 text-2xl font-bold">
              {t(block.heading)}
            </h2>
          )}
          <div className="space-y-3">
            {block.questions.map((qa) => (
              <details
                key={t(qa.question)}
                className="rounded-lg border border-neutral-200 dark:border-neutral-700"
              >
                <summary className="font-heading text-primary cursor-pointer px-4 py-3 font-semibold">
                  {t(qa.question)}
                </summary>
                <div className="px-4 pb-3 text-gray-700">{t(qa.answer)}</div>
              </details>
            ))}
          </div>
        </section>
      );

    case 'sacramentList':
      return (
        <section>
          {block.heading && (
            <h2 className="font-heading text-primary mb-4 text-2xl font-bold">
              {t(block.heading)}
            </h2>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {block.sacraments.map((sac) => (
              <Card key={t(sac.name)}>
                <CardContent className="p-4">
                  <h3 className="text-primary font-semibold">{t(sac.name)}</h3>
                  {sac.description && (
                    <p className="mt-1 text-sm text-gray-600">{t(sac.description)}</p>
                  )}
                  {sac.schedule && (
                    <p className="mt-1 text-sm text-gray-500">
                      <span className="font-medium">Schedule:</span> {t(sac.schedule)}
                    </p>
                  )}
                  {sac.requirements && (
                    <p className="mt-1 text-sm text-gray-500">
                      <span className="font-medium">Requirements:</span>{' '}
                      {t(sac.requirements)}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      );

    case 'clergyRoleList':
      return (
        <section>
          {block.heading && (
            <h2 className="font-heading text-primary mb-4 text-2xl font-bold">
              {t(block.heading)}
            </h2>
          )}
          <dl className="space-y-4">
            {block.roles.map((role) => (
              <div key={t(role.role)} className="border-b border-neutral-200 pb-3 dark:border-neutral-700">
                <dt className="text-primary font-semibold">{t(role.role)}</dt>
                {role.description && (
                  <dd className="mt-1 text-sm text-gray-600">{t(role.description)}</dd>
                )}
                {role.contact && (
                  <dd className="mt-1 text-sm">
                    <a href={`mailto:${role.contact}`} className="text-primary underline">
                      {role.contact}
                    </a>
                  </dd>
                )}
              </div>
            ))}
          </dl>
        </section>
      );

    case 'visitingInfo':
      return (
        <section>
          {block.heading && (
            <h2 className="font-heading text-primary mb-4 text-2xl font-bold">
              {t(block.heading)}
            </h2>
          )}
          <Card>
            <CardContent className="p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="py-2 text-start font-semibold">Day</th>
                    <th className="py-2 text-start font-semibold">Open</th>
                    <th className="py-2 text-start font-semibold">Close</th>
                  </tr>
                </thead>
                <tbody>
                  {block.hours.map((h) => (
                    <tr key={h.day} className="border-b border-neutral-100 dark:border-neutral-800">
                      <td className="py-2">{h.day}</td>
                      <td className="py-2">{h.open}</td>
                      <td className="py-2">{h.close}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {block.admission && (
                <p className="mt-3 text-sm text-gray-600">{t(block.admission)}</p>
              )}
            </CardContent>
          </Card>
        </section>
      );

    case 'mapLocation':
      return (
        <section>
          {block.heading && (
            <h2 className="font-heading text-primary mb-4 text-2xl font-bold">
              {t(block.heading)}
            </h2>
          )}
          <div
            data-lat={block.lat}
            data-lng={block.lng}
            className="space-y-3"
          >
            {block.staticMap && (
              <img
                src={block.staticMap.src}
                alt={t(block.staticMap.alt)}
                width={block.staticMap.width}
                height={block.staticMap.height}
                loading="lazy"
                className="h-auto w-full rounded-lg object-cover"
              />
            )}
            {block.directionsUrl && (
              <a
                href={block.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex items-center gap-1 font-medium underline"
              >
                Get directions →
              </a>
            )}
          </div>
        </section>
      );

    default:
      return null;
  }
}
