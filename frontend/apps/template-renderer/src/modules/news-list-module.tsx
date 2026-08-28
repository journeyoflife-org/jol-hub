/**
 * NewsListModule — latest news preview (STEP 6 module).
 *
 * Async server module: fetches the tenant's news collection (RLS-scoped via
 * content-api) and renders the latest N cards. In the pilot the collection
 * is empty → the module collapses (returns null) so composed pages stay clean.
 */
import { NewsCard, SectionHeader } from '@jol-hub/ui/components/composite';
import { getMessages, translate, isSupportedLocale, formatDate } from '@jol-hub/i18n';
import { DEFAULT_LOCALE } from '@jol-hub/i18n/config';
import { getNews } from '@/lib/collections';
import { themeVerticalFor } from '@/lib/template-registry';
import { tenantThemeFor, type ModuleProps } from './types';

export default async function NewsListModule({ tenant, locale, content, basePath }: ModuleProps) {
  const items = await getNews(tenant);
  if (items.length === 0) return null;

  const limit = typeof content.limit === 'number' && content.limit > 0 ? content.limit : 3;
  const latest = items.slice(0, limit);

  const effectiveLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
  const messages = getMessages(effectiveLocale, { vertical: themeVerticalFor(tenant.vertical) });

  return (
    <div className="space-y-6">
      <SectionHeader
        title={translate(messages, 'navigation.news')}
        headingLevel={2}
        action={{ label: translate(messages, 'common.viewAll'), href: `${basePath}/news` }}
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {latest.map((item) => (
          <NewsCard
            key={item.slug}
            title={item.title}
            publishedAt={item.publishedAt}
            dateLabel={formatDate(item.publishedAt, effectiveLocale)}
            author={item.author}
            category={item.category}
            excerpt={item.excerpt}
            readTime={item.readTime}
            href={`${basePath}/news/${item.slug}`}
            tenant={tenantThemeFor(tenant)}
          />
        ))}
      </div>
    </div>
  );
}
