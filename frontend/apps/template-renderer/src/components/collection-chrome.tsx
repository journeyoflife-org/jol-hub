/**
 * Collection chrome — STEP 6.
 *
 * Shared server-rendered UI for the news/events/services list pages: page
 * header, accessible pagination, category filter and empty state. Everything
 * is i18n-driven (no literals) and works without client JS (links + GET
 * forms), matching the SSR / progressive-enhancement contract.
 */
import { getMessages, translate, translateWithValues } from '@jol-hub/i18n';
import type { SupportedLocale } from '@jol-hub/i18n';
import { collectionHref } from '@/lib/collection-view';

export interface CollectionPageHeaderProps {
  title: string;
  /** Optional intro line under the heading. */
  description?: string;
}

export function CollectionPageHeader({ title, description }: CollectionPageHeaderProps) {
  return (
    <header className="container mx-auto px-4 pt-10 pb-6">
      <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary">{title}</h1>
      {description && <p className="mt-2 text-gray-600">{description}</p>}
    </header>
  );
}

export interface PaginationProps {
  basePath: string;
  route: string;
  page: number;
  totalPages: number;
  locale: SupportedLocale;
  /** Current filter params to carry across page changes. */
  preserve?: Record<string, string | undefined>;
}

/** Accessable pagination (nav + aria-current on the active page). */
export function Pagination({ basePath, route, page, totalPages, locale, preserve }: PaginationProps) {
  if (totalPages <= 1) return null;
  const messages = getMessages(locale);
  const pageInfo = translateWithValues(messages, locale, 'collections.pageInfo', {
    page,
    totalPages,
  });

  const hrefFor = (target: number) =>
    collectionHref(basePath, route, { ...preserve, page: target > 1 ? target : undefined });

  return (
    <nav
      aria-label={pageInfo}
      className="container mx-auto px-4 flex items-center justify-between gap-4 py-6"
    >
      {page > 1 ? (
        <a href={hrefFor(page - 1)} className="text-primary underline focus-ring rounded">
          {translate(messages, 'collections.previousPage')}
        </a>
      ) : (
        <span aria-hidden="true" className="text-gray-400">
          {translate(messages, 'collections.previousPage')}
        </span>
      )}

      <span className="text-sm text-gray-600">{pageInfo}</span>

      {page < totalPages ? (
        <a href={hrefFor(page + 1)} className="text-primary underline focus-ring rounded">
          {translate(messages, 'collections.nextPage')}
        </a>
      ) : (
        <span aria-hidden="true" className="text-gray-400">
          {translate(messages, 'collections.nextPage')}
        </span>
      )}
    </nav>
  );
}

export interface CategoryFilterProps {
  basePath: string;
  route: string;
  categories: string[];
  active?: string;
  locale: SupportedLocale;
  /** Extra params to preserve when switching category. */
  preserve?: Record<string, string | undefined>;
}

/** Category filter as a set of toggle links (server-side navigation). */
export function CategoryFilter({
  basePath,
  route,
  categories,
  active,
  locale,
  preserve,
}: CategoryFilterProps) {
  if (categories.length === 0) return null;
  const messages = getMessages(locale);

  const linkClass = (selected: boolean) =>
    `inline-block rounded-full border px-3 py-1 text-sm focus-ring ${
      selected
        ? 'border-primary bg-primary text-white'
        : 'border-gray-300 text-gray-700 hover:border-primary'
    }`;

  return (
    <div className="container mx-auto px-4 pb-4">
      <span className="sr-only">{translate(messages, 'collections.categoryLabel')}</span>
      <div className="flex flex-wrap gap-2">
        <a href={collectionHref(basePath, route, { ...preserve, category: undefined })} className={linkClass(!active)} aria-current={active ? undefined : 'true'}>
          {translate(messages, 'collections.allCategories')}
        </a>
        {categories.map((category) => (
          <a
            key={category}
            href={collectionHref(basePath, route, { ...preserve, category })}
            className={linkClass(active === category)}
            aria-current={active === category ? 'true' : undefined}
          >
            {category}
          </a>
        ))}
      </div>
    </div>
  );
}

export interface CollectionEmptyStateProps {
  messageKey: string;
  locale: SupportedLocale;
}

/** Accessible empty state (polite, informative — GDPR Art. 12 clarity). */
export function CollectionEmptyState({ messageKey, locale }: CollectionEmptyStateProps) {
  const messages = getMessages(locale);
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <p className="text-gray-600">{translate(messages, messageKey)}</p>
    </div>
  );
}
