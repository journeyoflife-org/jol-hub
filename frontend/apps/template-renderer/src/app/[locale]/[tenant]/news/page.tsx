/**
 * News list — `/{locale}/{tenant}/news` (STEP 6).
 *
 * Rendering strategy (see RENDERING.md): ISR (`revalidate = 60`) — news
 * changes frequently but tolerates a short staleness window; realized at the
 * data cache (root layout lang constraint).
 *
 * Content link (fixture-first): a fixture `/news` page renders via
 * TemplateRenderer; otherwise the dynamic collection is listed. Filters
 * (category, VIP search) + pagination are `searchParams`-driven, so the page
 * stays fully server-rendered and progressively enhanced.
 *
 * SEO: ItemList + BreadcrumbList JSON-LD, canonical/hreflang/OG.
 */
import type { Metadata } from 'next';
import { getMessages, translate, formatDate } from '@jol-hub/i18n';
import type { SupportedLocale } from '@jol-hub/i18n';
import { NewsCard } from '@jol-hub/ui/components/composite';
import { getNews, paginate } from '@/lib/collections';
import type { NewsItem } from '@/lib/collections';
import { JsonLd, breadcrumbEntity, itemListEntity } from '@/lib/json-ld';
import { absoluteUrl } from '@/lib/seo';
import { buildTenantMetadata, tenantDisplayName } from '@/lib/page-seo';
import { themeVerticalFor } from '@/lib/template-registry';
import {
  CollectionPageHeader,
  CategoryFilter,
  CollectionEmptyState,
  Pagination,
} from '@/components/collection-chrome';
import { readPage, readString, collectionHref, type SearchParams } from '@/lib/collection-view';
import { renderFixtureRoute, resolveTenantRoute } from '@/lib/route-dispatch';

// ISR: news refreshes within a minute. See RENDERING.md.
export const revalidate = 60;

const PAGE_SIZE = 10;

interface TenantNewsListParams {
  locale: string;
  tenant: string;
}

function newsLabel(locale: SupportedLocale): string {
  return translate(getMessages(locale), 'navigation.news');
}

function sortDesc(items: NewsItem[]): NewsItem[] {
  return [...items].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

export async function generateMetadata({
  params,
}: {
  params: TenantNewsListParams;
}): Promise<Metadata> {
  const { tenant, fixture, locale } = resolveTenantRoute(params);
  const name = tenantDisplayName(tenant, fixture, locale);
  return buildTenantMetadata({
    tenant,
    fixture,
    locale,
    route: '/news',
    title: newsLabel(locale),
    description: name,
  });
}

export default async function TenantNewsListPage({
  params,
  searchParams,
}: {
  params: TenantNewsListParams;
  searchParams?: SearchParams;
}) {
  const { tenant, fixture, locale, basePath } = resolveTenantRoute(params);
  const messages = getMessages(locale, { vertical: themeVerticalFor(tenant.vertical) });

  const jsonLdBreadcrumb = (
    <JsonLd
      data={breadcrumbEntity([
        { name: translate(messages, 'navigation.home'), url: absoluteUrl(basePath) },
        { name: newsLabel(locale), url: absoluteUrl(`${basePath}/news`) },
      ])}
    />
  );

  // Fixture-first fidelity: a fixture news page wins when present.
  const fixtureNews = renderFixtureRoute(fixture, '/news', basePath);
  if (fixtureNews) {
    return (
      <>
        {jsonLdBreadcrumb}
        {fixtureNews}
      </>
    );
  }

  const all = sortDesc(await getNews(tenant));
  const categories = Array.from(new Set(all.map((item) => item.category).filter(Boolean))) as string[];

  const activeCategory = readString(searchParams, 'category');
  const isVip = tenant.packageTier === 'vip';
  const query = isVip ? readString(searchParams, 'q')?.toLowerCase() : undefined;
  const page = readPage(searchParams);

  let filtered = all;
  if (activeCategory) filtered = filtered.filter((item) => item.category === activeCategory);
  if (query) {
    filtered = filtered.filter(
      (item) =>
        item.title.toLowerCase().includes(query) || item.excerpt.toLowerCase().includes(query),
    );
  }

  const paged = paginate(filtered, page, PAGE_SIZE);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbEntity([
            { name: translate(messages, 'navigation.home'), url: absoluteUrl(basePath) },
            { name: newsLabel(locale), url: absoluteUrl(`${basePath}/news`) },
          ]),
          itemListEntity(
            paged.items.map((item) => ({
              name: item.title,
              url: absoluteUrl(`${basePath}/news/${item.slug}`),
            })),
          ),
        ]}
      />

      <CollectionPageHeader title={newsLabel(locale)} />

      <CategoryFilter
        basePath={basePath}
        route="/news"
        categories={categories}
        active={activeCategory}
        locale={locale}
        preserve={query ? { q: query } : undefined}
      />

      {isVip && (
        <form
          method="get"
          action={`${basePath}/news`}
          role="search"
          className="container mx-auto px-4 pb-4 flex gap-2"
        >
          <label htmlFor="news-search" className="sr-only">
            {translate(messages, 'collections.searchLabel')}
          </label>
          <input
            id="news-search"
            type="search"
            name="q"
            defaultValue={query ?? ''}
            placeholder={translate(messages, 'collections.searchLabel')}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus-ring"
          />
          {activeCategory && <input type="hidden" name="category" value={activeCategory} />}
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white focus-ring"
          >
            {translate(messages, 'collections.searchLabel')}
          </button>
        </form>
      )}

      {paged.items.length === 0 ? (
        <CollectionEmptyState messageKey="collections.emptyNews" locale={locale} />
      ) : (
        <div className="container mx-auto px-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {paged.items.map((item) => (
            <NewsCard
              key={item.slug}
              title={item.title}
              publishedAt={item.publishedAt}
              dateLabel={formatDate(item.publishedAt, locale)}
              author={item.author}
              category={item.category}
              excerpt={item.excerpt}
              readTime={item.readTime}
              href={collectionHref(basePath, `/news/${item.slug}`, {})}
              tenant={{ vertical: themeVerticalFor(tenant.vertical) }}
            />
          ))}
        </div>
      )}

      <Pagination
        basePath={basePath}
        route="/news"
        page={paged.page}
        totalPages={paged.totalPages}
        locale={locale}
        preserve={{ category: activeCategory, q: query }}
      />
    </>
  );
}
