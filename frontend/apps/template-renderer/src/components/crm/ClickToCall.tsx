/**
 * ClickToCall — STEP 9 (telephony, VIP only).
 *
 * Tracked `tel:` link. The call attempt is surfaced through
 * `onCallAttempted` so the composing page can log it as a CALL activity via
 * the hub backend (never Bitrix24 directly). Missed-call alerting is owned by
 * the backend/telephony layer; this component only renders the tracked entry
 * point.
 *
 * GATING: render only for VIP tenants with telephony (composition concern —
 * the caller checks the tenant package before mounting).
 */
'use client';

import { useCallback } from 'react';
import { useTranslations } from '@jol-hub/i18n/use-translations';

export interface ClickToCallProps {
  /** Dialable number (digits/+/spaces). Shown as-is unless `label` given. */
  phone: string;
  label?: string;
  /** Fired on click — wire to the backend activity logger. */
  onCallAttempted?: (phone: string) => void;
  className?: string;
}

/** tel: hrefs allow digits, +, and separators only (defence against injection). */
function dialHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export function ClickToCall({ phone, label, onCallAttempted, className }: ClickToCallProps) {
  const t = useTranslations('crm');
  const notify = useCallback(() => onCallAttempted?.(phone), [onCallAttempted, phone]);

  return (
    <a
      href={dialHref(phone)}
      onClick={notify}
      aria-label={`${t('callLabel')}: ${phone}`}
      className={
        className ??
        'inline-flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800'
      }
    >
      <span aria-hidden="true">☎</span>
      {label ?? phone}
    </a>
  );
}
