/**
 * ChatbotEntry — AI-GATED entry shell (public FAQPage shell ONLY, DS §6).
 *
 * HIDDEN BY DEFAULT: without `enabled`, the component renders NOTHING —
 * "hidden, not degraded" (Phase 2.2 batch 3). The absolute launch blocker
 * is O-010 (safety.yml crisis data); until it lands and the AI module's own
 * gate opens, every consumer simply never passes `enabled`. Even when
 * enabled, the shell only links to the public FAQ page — no AI backend
 * contact, no conversation surface, no data collection.
 */
'use client';

import { MessageCircle } from 'lucide-react';
import { useTranslations } from '@jol-hub/i18n/use-translations';

import { cn } from '../../../lib/utils';
import { accentTextClass } from '../../../lib/tenant-theme';
import type { ChatbotEntryProps } from './ChatbotEntry.types';

export function ChatbotEntry({ enabled = false, faqHref, tenant, className }: ChatbotEntryProps) {
  const t = useTranslations('collections');

  // Hidden, not degraded: absent safety data ⇒ absolutely nothing renders.
  if (!enabled) return null;

  return (
    <a
      href={faqHref}
      className={cn(
        'focus-ring inline-flex min-h-[24px] items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 text-sm shadow-sm hover:underline dark:border-neutral-800',
        accentTextClass(tenant),
        className,
      )}
    >
      <MessageCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
      {t('chatbotEntryLabel')}
    </a>
  );
}
