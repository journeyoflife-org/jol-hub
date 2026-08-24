/**
 * MainNav — desktop navigation with optional dropdowns.
 *
 * Keyboard support (WAI-ARIA disclosure pattern):
 * - Enter/Space/ArrowDown opens a dropdown and focuses the first item
 * - ArrowDown/ArrowUp move between items, Escape closes and restores focus
 * - Active page is marked with `aria-current="page"`
 */
'use client';

import { useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { cn } from '../../../lib/utils';
import type { MainNavProps, NavItem } from './MainNav.types';

function Dropdown({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLLIElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const childLinks = item.children ?? [];

  const close = (restoreFocus = true): void => {
    setOpen(false);
    if (restoreFocus) buttonRef.current?.focus();
  };

  const handleButtonKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key === 'ArrowDown' || ((event.key === 'Enter' || event.key === ' ') && !open)) {
      event.preventDefault();
      setOpen(true);
      // Focus first item after render.
      setTimeout(() => containerRef.current?.querySelector<HTMLAnchorElement>('a')?.focus(), 0);
    }
  };

  const handleListKeyDown = (event: React.KeyboardEvent<HTMLLIElement>): void => {
    const links = Array.from(containerRef.current?.querySelectorAll<HTMLAnchorElement>('a') ?? []);
    const currentIndex = links.indexOf(document.activeElement as HTMLAnchorElement);

    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      links[Math.min(currentIndex + 1, links.length - 1)]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (currentIndex <= 0) close();
      else links[currentIndex - 1]?.focus();
    }
  };

  return (
    <li ref={containerRef} className="relative" onKeyDown={handleListKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
        onKeyDown={handleButtonKeyDown}
        onBlur={(event) => {
          if (!containerRef.current?.contains(event.relatedTarget as Node)) setOpen(false);
        }}
        className={cn(
          'inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium focus-ring transition-colors motion-reduce:transition-none',
          'text-neutral-100 hover:bg-primary-700',
        )}
      >
        {item.label}
        <ChevronDown aria-hidden="true" className="h-4 w-4" />
      </button>
      {open && (
        <ul className="absolute start-0 top-full z-40 mt-1 min-w-48 rounded-md border border-neutral-200 bg-neutral-50 py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          {childLinks.map((child) => (
            <li key={child.href}>
              <a
                href={child.href}
                className="block px-4 py-2 text-sm text-neutral-900 hover:bg-neutral-100 focus-ring dark:text-neutral-50 dark:hover:bg-neutral-800"
              >
                {child.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export function MainNav({ items, label = 'Pagrindinė navigacija / Main navigation', className }: MainNavProps) {
  return (
    <nav aria-label={label} className={className}>
      <ul className="flex items-center gap-1">
        {items.map((item) =>
          item.children && item.children.length > 0 ? (
            <Dropdown key={item.label} item={item} />
          ) : (
            <li key={item.href ?? item.label}>
              <a
                href={item.href ?? '#'}
                aria-current={item.active ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center rounded-md px-3 py-2 text-sm font-medium focus-ring transition-colors motion-reduce:transition-none',
                  item.active
                    ? 'bg-primary-700 text-neutral-50'
                    : 'text-neutral-100 hover:bg-primary-700',
                )}
              >
                {item.label}
              </a>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
