/**
 * Breadcrumbs — navigation trail with schema.org `BreadcrumbList` JSON-LD
 * and correct ARIA: current page is text (not a link) with
 * `aria-current="page"`.
 */
import { cn } from '../../../lib/utils';
import type { BreadcrumbItem, BreadcrumbsProps } from './Breadcrumbs.types';

function jsonLd(items: BreadcrumbItem[]): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href && index < items.length - 1 ? { item: item.href } : {}),
    })),
  });
}

export function Breadcrumbs({ items, label = 'Breadcrumb', className }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label={label} className={className}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(items) }}
      />
      <ol className="flex flex-wrap items-center gap-1 text-sm text-neutral-600 dark:text-neutral-300">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 && (
                <span aria-hidden="true" className="text-neutral-400 dark:text-neutral-600">
                  /
                </span>
              )}
              {isLast || !item.href ? (
                <span aria-current={isLast ? 'page' : undefined} className={cn(isLast && 'font-medium text-neutral-900 dark:text-neutral-50')}>
                  {item.label}
                </span>
              ) : (
                <a href={item.href} className="underline-offset-4 hover:underline focus-ring rounded-sm">
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
