/**
 * MobileNav — slide-in drawer with backdrop.
 *
 * `role="dialog"` + `aria-modal`, focus trapped via {@link FocusTrap},
 * Escape closes, focus returns to the trigger on close. Renders nothing
 * when closed (no hidden landmark noise for screen readers).
 */
'use client';

import { X } from 'lucide-react';
import { useTranslations } from '@jol-hub/i18n/use-translations';

import { FocusTrap } from '../../accessibility/focus-trap';
import type { MobileNavProps } from './MobileNav.types';

export function MobileNav({ open, onClose, items, label }: MobileNavProps) {
  const t = useTranslations('navigation');
  if (!open) return null;

  const navLabel = label ?? t('mobileLabel');

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-neutral-950/60"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={navLabel}
        className="absolute inset-y-0 start-0 w-full max-w-xs overflow-y-auto bg-neutral-50 shadow-xl dark:bg-neutral-900"
      >
        <FocusTrap active onEscape={onClose}>
          <div className="flex items-center justify-between border-b border-neutral-200 p-4 dark:border-neutral-800">
            <p className="font-heading font-semibold text-neutral-900 dark:text-neutral-50">{t('menu')}</p>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('closeMenu')}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-neutral-700 hover:bg-neutral-100 focus-ring dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
          <nav aria-label={navLabel}>
            <ul className="flex flex-col gap-1 p-4">
              {items.map((item) => (
                <li key={item.href ?? item.label}>
                  {item.children && item.children.length > 0 ? (
                    <>
                      <p className="px-3 py-2 text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                        {item.label}
                      </p>
                      <ul className="flex flex-col">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <a
                              href={child.href}
                              onClick={onClose}
                              className="block rounded-md px-6 py-2 text-sm text-neutral-700 hover:bg-neutral-100 focus-ring dark:text-neutral-200 dark:hover:bg-neutral-800"
                            >
                              {child.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <a
                      href={item.href ?? '#'}
                      onClick={onClose}
                      aria-current={item.active ? 'page' : undefined}
                      className="block rounded-md px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100 focus-ring dark:text-neutral-50 dark:hover:bg-neutral-800"
                    >
                      {item.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </FocusTrap>
      </div>
    </div>
  );
}
