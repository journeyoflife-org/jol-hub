/**
 * Sidebar — secondary navigation rail with grouped sections.
 * Active links are marked `aria-current="page"`.
 *
 * Renders a plain `<div>` (not `<aside>`): the `complementary` landmark
 * must be top-level per ARIA, and this component is typically nested
 * inside `<main>` — the inner `<nav>` provides the landmark semantics.
 */
import { cn } from '../../../lib/utils';
import type { SidebarProps } from './Sidebar.types';

export function Sidebar({ sections, label = 'Šoninė navigacija / Sidebar navigation', className }: SidebarProps) {
  return (
    <div className={cn('w-full lg:w-64', className)}>
      <nav aria-label={label} className="flex flex-col gap-6">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              {section.title}
            </h2>
            <ul className="flex flex-col gap-1">
              {section.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    aria-current={link.active ? 'page' : undefined}
                    className={cn(
                      'block rounded-md px-3 py-2 text-sm focus-ring transition-colors motion-reduce:transition-none',
                      link.active
                        ? 'bg-primary-100 font-medium text-primary-900 dark:bg-primary-900 dark:text-primary-100'
                        : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800',
                    )}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}
