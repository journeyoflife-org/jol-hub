/**
 * News detail — `/{locale}/{tenant}/news/{slug}` (STEP 6).
 *
 * Rendering strategy (see RENDERING.md): ISR (`revalidate = 300`).
 *
 * Resolution: closed lookups only. An invalid slug or a missing article both
 * resolve to the SAME bare 404 (no enumeration, no echoing of the attempted
 * value — GDPR Art. 9 / SOC 2 CC6.1). Fixtures carry no `/news/<slug>`
 * sub-pages (they are flat), so detail views are always collection-driven.
 *
 * SEO: NewsArticle + BreadcrumbList JSON-LD, published/modified dates,
 * canonical/hreflang/OG.
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMessages, translate, formatDate } from '@jol-hub/i18n';
import { LOCALE_HREFLANG } from '@jol-hub/i18n';
import { clampDescription } from '@jol-hub/seo';
import { JsonLd, articleEntity, breadcrumbEntity } from '@/lib/json-ld';
import { tenantDisplayName } from '@/lib/page-seo';
import { absoluteUrl, buildSeoAlternates } from '@/lib/seo';
import { getNews, getNewsItem } from '@/lib/collections';
import { themeVerticalFor } from '@/lib/template-registry';
import { normalizeSlugParam } from '@/lib/slug';
import { resolveTenantRoute } from '@/lib/route-dispatch';

// ISR: detail pages can tolerate a slightly longer window than the list.
export const revalidate = 300;

interface TenantNewsDetailParams {
  locale: string;
  tenant: string;
  slug: string;
}

export async function generateMetadata({
  params,
}: {
  params: TenantNewsDetailParams;
}): Promise<Metadata> {
  const { tenant, fixture, locale } = resolveTenantRoute(params);
  const slug = normalizeSlugParam(params.slug);
  if (!slug) return {};
  const item = await getNewsItem(tenant, slug);
  if (!item) return {};

  const name = tenantDisplayName(tenant, fixture, locale);
  // STEP 11 SEO enhancement: article-type OG with published/modified times,
  // absolute canonical + reciprocal hreflang, description clamped to the
  // 150–160 char SERP window.
  const seo = buildSeoAlternates(tenant.slug, `/news/${item.slug}`, locale);
  const description = clampDescription(item.excerpt || item.title);

  return {
    title: item.title,
    description,
    alternates: { canonical: seo.canonical, languages: seo.languages },
    openGraph: {
      title: item.title,
      description,
      type: 'article',
      locale: LOCALE_HREFLANG[locale],
      siteName: name,
      url: seo.canonical,
      publishedTime: item.publishedAt,
      modifiedTime: item.updatedAt ?? undefined,
    },
    twitter: { card: 'summary', title: item.title, description },
    robots: { index: true, follow: true },
  };
}

export default async function TenantNewsDetailPage({ params }: { params: TenantNewsDetailParams }) {
  const { tenant, fixture, locale, basePath } = resolveTenantRoute(params);
  const slug = normalizeSlugParam(params.slug);
  if (!slug) notFound();

  const item = await getNewsItem(tenant, slug);
  if (!item) notFound();

  const messages = getMessages(locale, { vertical: themeVerticalFor(tenant.vertical) });
  const tenantName = tenantDisplayName(tenant, fixture, locale);
  // STEP 11: structured-data URLs are ABSOLUTE (protocol + public domain).
  const articleUrl = absoluteUrl(`${basePath}/news/${item.slug}`);

  // Related reading: other items, most recent first (pilot: empty → hidden).
  const others = (await getNews(tenant))
    .filter((entry) => entry.slug !== item.slug)
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, 3);

  const bodyParagraphs = (item.body ?? '')
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbEntity([
            { name: translate(messages, 'navigation.home'), url: absoluteUrl(basePath) },
            { name: translate(messages, 'navigation.news'), url: absoluteUrl(`${basePath}/news`) },
            { name: item.title, url: articleUrl },
          ]),
          articleEntity({
            headline: item.title,
            url: articleUrl,
            datePublished: item.publishedAt,
            dateModified: item.updatedAt,
            authorName: item.author,
            description: item.excerpt || undefined,
            publisherName: tenantName,
          }),
        ]}
      />

      <article className="container mx-auto px-4 max-w-3xl py-12">
        <a href={`${basePath}/news`} className="text-sm text-primary underline focus-ring rounded">
          {translate(messages, 'collections.backToList')}
        </a>

        <header className="mt-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary">
            {item.title}
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            <time dateTime={item.publishedAt}>{formatDate(item.publishedAt, locale)}</time>
            {item.author && <span> · {item.author}</span>}
            {item.category && <span> · {item.category}</span>}
          </p>
        </header>

        {item.excerpt && <p className="text-lg text-gray-700 leading-relaxed">{item.excerpt}</p>}

        <div className="mt-6 space-y-4 text-gray-800 leading-relaxed">
          {bodyParagraphs.map((paragraph, index) => (
            <p key={`${index}`}>{paragraph}</p>
          ))}
        </div>

        {others.length > 0 && (
          <aside className="mt-12 border-t pt-8" aria-label={translate(messages, 'collections.relatedArticles')}>
            <h2 className="text-xl font-heading font-bold text-primary mb-4">
              {translate(messages, 'collections.relatedArticles')}
            </h2>
            <ul className="space-y-2">
              {others.map((entry) => (
                <li key={entry.slug}>
                  <a
                    href={`${basePath}/news/${entry.slug}`}
                    className="text-primary underline focus-ring rounded"
                  >
                    {entry.title}
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </article>
    </>
  );
}
