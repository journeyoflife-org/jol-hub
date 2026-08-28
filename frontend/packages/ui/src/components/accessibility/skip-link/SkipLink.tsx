/**
 * SkipLink — keyboard users bypass repeated navigation (WCAG 2.4.1).
 *
 * Must be the FIRST focusable element in the document (render it at the
 * top of the app shell, before `<Header>`). Visually hidden until focused.
 * Label comes from the message catalog (STEP 4 — no hard-coded strings).
 */
'use client';

import { useTranslations } from '@jol-hub/i18n/use-translations';

import type { SkipLinkProps } from './SkipLink.types';

export function SkipLink({ targetId = 'main-content', label }: SkipLinkProps) {
  const t = useTranslations('accessibility');

  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-neutral-50 focus-ring"
    >
      {label ?? t('skipToContent')}
    </a>
  );
}
