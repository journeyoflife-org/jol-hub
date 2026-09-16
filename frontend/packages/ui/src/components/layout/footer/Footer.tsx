/**
 * Footer — 4-column layout: brand / navigation / contact / legal.
 * Social links carry mandatory aria-labels; copyright year is dynamic.
 */
'use client';

import { useTranslations } from '@jol-hub/i18n/use-translations';

import { cn } from '../../../lib/utils';
import type { FooterProps } from './Footer.types';

export function Footer({
  brand,
  navigation,
  contact,
  legal,
  social = [],
  copyrightHolder,
  className,
}: FooterProps) {
  const tNav = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const year = new Date().getFullYear();

  return (
    <footer className={cn('bg-neutral-900 text-neutral-200', className)}>
      <div className="container mx-auto grid grid-cols-1 gap-8 px-4 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div>{brand}</div>

        <nav aria-label={tNav('footerLabel')}>
          <h2 className="mb-3 font-heading text-lg font-semibold text-neutral-50">{tNav('navigationTitle')}</h2>
          <ul className="space-y-2 text-sm">
            {navigation.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="underline-offset-4 hover:underline focus-ring rounded-sm">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="mb-3 font-heading text-lg font-semibold text-neutral-50">{tNav('contactTitle')}</h2>
          <ul className="space-y-2 text-sm">
            {contact.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {social.length > 0 && (
            <ul className="mt-4 flex gap-3">
              {social.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    aria-label={item.label}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 focus-ring"
                  >
                    {item.icon}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label={tNav('legal')}>
          <h2 className="mb-3 font-heading text-lg font-semibold text-neutral-50">{tNav('legal')}</h2>
          <ul className="space-y-2 text-sm">
            {legal.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="underline-offset-4 hover:underline focus-ring rounded-sm">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-neutral-800 py-4 text-center text-sm text-neutral-400">
        © {year} {copyrightHolder}. {tCommon('copyright')}
      </div>
    </footer>
  );
}
