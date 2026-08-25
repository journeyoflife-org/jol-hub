/**
 * ProductCard + ProductGrid — STEP 8 (shop).
 *
 * E-commerce catalogue for commercial verticals (flowers, coffins, urns,
 * vestments, cleaning supplies). `ProductCard` is presentational + add-to-cart;
 * `ProductGrid` is filterable / sortable / paginated.
 *
 * DATA FLOW (per spec): a SERVER component fetches products via
 * `getProducts()` and passes them here as props — the client never reaches
 * the commerce API directly for the catalogue.
 *
 * GATING: render only when the tenant has the `shop` capability
 * (`useTenantFeature('shop')` / `hasCommerceCapability`). Prices are shown
 * VAT-inclusive with locale-aware EUR formatting.
 */
'use client';

import { useMemo, useState } from 'react';
import { formatEur, type Product } from '@jol-hub/commerce';
import { useTranslations } from '@jol-hub/i18n/use-translations';
import { Badge, Button } from '@jol-hub/ui/components/primitives';
import { useCart } from './cart-context';

const PAGE_SIZE = 8;

type SortKey = 'name' | 'price-asc' | 'price-desc';

function stockBadge(product: Product, t: (key: string) => string) {
  switch (product.stock.kind) {
    case 'out-of-stock':
      return <Badge variant="destructive">{t('outOfStock')}</Badge>;
    case 'low-stock':
      return <Badge variant="secondary">{t('lowStock')}</Badge>;
    case 'backorder':
      return <Badge variant="outline">{t('backorder')}</Badge>;
    default:
      return null;
  }
}

export function ProductCard({ product, locale = 'lt' }: { product: Product; locale?: string }) {
  const t = useTranslations('commerce');
  const { addItem, openCart } = useCart();
  const outOfStock = product.stock.kind === 'out-of-stock';

  return (
    <article
      data-product-id={product.id}
      className="flex h-full flex-col rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
    >
      {product.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className="mb-3 aspect-[4/3] w-full rounded-md object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="mb-3 flex aspect-[4/3] w-full items-center justify-center rounded-md bg-neutral-100 text-neutral-400 dark:bg-neutral-800"
        >
          {product.name.charAt(0)}
        </div>
      )}

      <div className="mb-1 flex items-start justify-between gap-2">
        <h3 className="font-heading text-base font-semibold text-neutral-900 dark:text-neutral-50">
          {product.name}
        </h3>
        {stockBadge(product, t)}
      </div>

      {product.description ? (
        <p className="mb-2 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-300">
          {product.description}
        </p>
      ) : null}

      <div className="mt-auto">
        <p className="mb-3 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          {formatEur(product.price.amount, locale)}
        </p>
        <Button
          disabled={outOfStock}
          className="w-full"
          onClick={() => {
            addItem({
              productId: product.id,
              name: product.name,
              unitPrice: product.price.amount,
            });
            openCart();
          }}
        >
          {outOfStock ? t('outOfStock') : t('addToCart')}
        </Button>
      </div>
    </article>
  );
}

export interface ProductGridProps {
  products: Product[];
  locale?: string;
  /** Show the category filter bar. */
  filterable?: boolean;
}

/** Filterable / sortable / paginated product grid. */
export function ProductGrid({ products, locale = 'lt', filterable = true }: ProductGridProps) {
  const t = useTranslations('commerce');
  const [category, setCategory] = useState<string | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('name');
  const [page, setPage] = useState(1);

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[],
    [products],
  );

  const visible = useMemo(() => {
    let list = category === 'all' ? products : products.filter((p) => p.category === category);
    list = [...list].sort((a, b) => {
      if (sort === 'price-asc') return a.price.amount - b.price.amount;
      if (sort === 'price-desc') return b.price.amount - a.price.amount;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [products, category, sort]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const pageItems = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (products.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500 dark:border-neutral-700">
        {t('noProducts')}
      </p>
    );
  }

  return (
    <div>
      {filterable ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setCategory('all');
              setPage(1);
            }}
            className={
              category === 'all'
                ? 'rounded-full bg-neutral-900 px-3 py-1 text-sm text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'rounded-full border border-neutral-300 px-3 py-1 text-sm dark:border-neutral-700'
            }
          >
            {t('allCategories')}
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setCategory(c);
                setPage(1);
              }}
              className={
                category === c
                  ? 'rounded-full bg-neutral-900 px-3 py-1 text-sm text-white dark:bg-neutral-100 dark:text-neutral-900'
                  : 'rounded-full border border-neutral-300 px-3 py-1 text-sm dark:border-neutral-700'
              }
            >
              {c}
            </button>
          ))}

          <label className="ml-auto flex items-center gap-2 text-sm">
            {t('sortBy')}
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="h-9 rounded-md border border-neutral-300 bg-white px-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="name">{t('sortName')}</option>
              <option value="price-asc">{t('sortPriceAsc')}</option>
              <option value="price-desc">{t('sortPriceDesc')}</option>
            </select>
          </label>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {pageItems.map((product) => (
          <ProductCard key={product.id} product={product} locale={locale} />
        ))}
      </div>

      {totalPages > 1 ? (
        <nav aria-label={t('pagination')} className="mt-6 flex items-center justify-center gap-2">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            {t('prev')}
          </Button>
          <span className="text-sm text-neutral-600 dark:text-neutral-300">
            {page} / {totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            {t('next')}
          </Button>
        </nav>
      ) : null}
    </div>
  );
}
