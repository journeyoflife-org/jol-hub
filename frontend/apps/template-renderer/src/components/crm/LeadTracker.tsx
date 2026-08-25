/**
 * LeadTracker — STEP 9 (admin-facing lead dashboard).
 *
 * Recent leads for the tenant with status badges (NEW / IN_PROGRESS /
 * CONVERTED / CLOSED) and a click-through into Bitrix24 (new tab). Data comes
 * from the SAME-ORIGIN proxy (`GET /api/crm/leads`) via the sdk hook with
 * 30s polling (pilot real-time strategy — the backend receives the Bitrix24
 * webhooks; the frontend polls).
 *
 * RBAC (SOC 2 CC6.1): this component MUST only be rendered for tenant
 * admins. The calling page verifies identity and passes `authorized` — the
 * component refuses to render data without it. The backend additionally
 * enforces tenant isolation (RLS), so cross-tenant reads are impossible even
 * if a caller misbehaves.
 */
'use client';

import { useMemo } from 'react';
import { CrmBackendClient, type LeadStatus } from '@jol-hub/bitrix-sdk';
import { useCrmLeads } from '@jol-hub/bitrix-sdk/hooks';
import { useTranslations } from '@jol-hub/i18n/use-translations';

/** Pilot polling cadence (spec: 30s acceptable). */
const DEFAULT_POLL_MS = 30_000;

const STATUS_BADGE: Record<LeadStatus, string> = {
  NEW: 'bg-info-100 text-info-800 dark:bg-info-900 dark:text-info-100',
  IN_PROGRESS: 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-100',
  CONVERTED: 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-100',
  CLOSED: 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
};

export interface LeadTrackerProps {
  tenantSlug: string;
  /** RBAC gate — the caller MUST verify tenant-admin identity first. */
  authorized: boolean;
  locale?: string;
  pollIntervalMs?: number;
}

export function LeadTracker({
  tenantSlug,
  authorized,
  locale = 'lt',
  pollIntervalMs = DEFAULT_POLL_MS,
}: LeadTrackerProps) {
  const t = useTranslations('crm');
  // Same-origin client: the browser only ever talks to /api/crm/* — never to
  // Bitrix24 or the hub backend directly (no tokens, no backend URLs).
  const client = useMemo(() => new CrmBackendClient({ baseUrl: '/api' }), []);
  const { available, data, loading, error, reload } = useCrmLeads(tenantSlug, {
    client,
    pollIntervalMs,
  });

  if (!authorized) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700">
        {t('adminOnly')}
      </p>
    );
  }

  if (!available) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700">
        {t('crmNotConfigured')}
      </p>
    );
  }

  return (
    <section aria-label={t('leadTrackerTitle')}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          {t('leadTrackerTitle')}
        </h2>
        <button
          type="button"
          onClick={reload}
          className="text-sm text-neutral-600 underline dark:text-neutral-300"
        >
          {t('refresh')}
        </button>
      </div>

      {error ? (
        <p className="rounded-md bg-warning-50 p-3 text-sm text-warning-800 dark:bg-warning-900 dark:text-warning-100">
          {t('crmUnavailable')}
        </p>
      ) : loading && !data ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('loading')}</p>
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('noLeads')}</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
              <th className="py-2 pr-3 font-medium">{t('colName')}</th>
              <th className="py-2 pr-3 font-medium">{t('colStatus')}</th>
              <th className="py-2 pr-3 font-medium">{t('colDate')}</th>
              <th className="py-2 font-medium">{t('colLink')}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((lead) => (
              <tr key={lead.id} className="border-b border-neutral-100 dark:border-neutral-900">
                <td className="py-2 pr-3 text-neutral-900 dark:text-neutral-50">{lead.name}</td>
                <td className="py-2 pr-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[lead.status]}`}>
                    {t(`status_${lead.status}`)}
                  </span>
                </td>
                <td className="py-2 pr-3 text-neutral-600 dark:text-neutral-300">
                  {new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(lead.createdAt))}
                </td>
                <td className="py-2">
                  {lead.bitrixUrl ? (
                    <a
                      href={lead.bitrixUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm underline"
                    >
                      {t('openInBitrix')}
                    </a>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
