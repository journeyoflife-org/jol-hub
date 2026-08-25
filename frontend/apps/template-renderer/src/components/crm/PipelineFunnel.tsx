/**
 * PipelineFunnel — STEP 9 (sales pipeline visualization, NORMAL/VIP).
 *
 * Read-only funnel of deal stages from Bitrix24 (via the same-origin proxy
 * `GET /api/crm/deals`). Modifications happen in Bitrix24 only — this
 * component exposes NO mutation surface.
 *
 * PILOT: with no CRM backend configured the hook reports `available: false`
 * and the component renders a quiet notice (no fabricated pipeline).
 */
'use client';

import { useMemo } from 'react';
import { CrmBackendClient, type Deal } from '@jol-hub/bitrix-sdk';
import { useCrmDeals } from '@jol-hub/bitrix-sdk/hooks';
import { formatEur } from '@jol-hub/commerce';
import { useTranslations } from '@jol-hub/i18n/use-translations';

const DEFAULT_POLL_MS = 30_000;

interface StageBucket {
  stageId: string;
  stageName: string;
  count: number;
  totalCents: number;
}

/** Group deals by stage, preserving backend stage order (first appearance). */
function groupByStage(deals: Deal[]): StageBucket[] {
  const buckets: StageBucket[] = [];
  for (const deal of deals) {
    let bucket = buckets.find((candidate) => candidate.stageId === deal.stageId);
    if (!bucket) {
      bucket = {
        stageId: deal.stageId,
        stageName: deal.stageName ?? deal.stageId,
        count: 0,
        totalCents: 0,
      };
      buckets.push(bucket);
    }
    bucket.count += 1;
    bucket.totalCents += deal.amountCents ?? 0;
  }
  return buckets;
}

export interface PipelineFunnelProps {
  tenantSlug: string;
  locale?: string;
  pollIntervalMs?: number;
}

export function PipelineFunnel({ tenantSlug, locale = 'lt', pollIntervalMs = DEFAULT_POLL_MS }: PipelineFunnelProps) {
  const t = useTranslations('crm');
  const client = useMemo(() => new CrmBackendClient({ baseUrl: '/api' }), []);
  const { available, data, loading, error } = useCrmDeals(tenantSlug, { client, pollIntervalMs });

  const stages = useMemo(() => groupByStage(data ?? []), [data]);
  const maxCount = Math.max(1, ...stages.map((stage) => stage.count));

  if (!available) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700">
        {t('crmNotConfigured')}
      </p>
    );
  }

  return (
    <section aria-label={t('pipelineTitle')}>
      <h2 className="mb-3 font-heading text-lg font-semibold text-neutral-900 dark:text-neutral-50">
        {t('pipelineTitle')}
      </h2>

      {error ? (
        <p className="rounded-md bg-warning-50 p-3 text-sm text-warning-800 dark:bg-warning-900 dark:text-warning-100">
          {t('crmUnavailable')}
        </p>
      ) : loading && !data ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('loading')}</p>
      ) : stages.length === 0 ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('noDeals')}</p>
      ) : (
        <ul className="space-y-2">
          {stages.map((stage) => (
            <li key={stage.stageId} className="flex items-center gap-3">
              <span className="w-32 shrink-0 truncate text-sm text-neutral-700 dark:text-neutral-200">
                {stage.stageName}
              </span>
              <div className="h-6 flex-1 rounded bg-neutral-100 dark:bg-neutral-800">
                <div
                  className="flex h-6 items-center rounded bg-primary px-2 text-xs font-medium text-neutral-50"
                  style={{ width: `${Math.max(8, (stage.count / maxCount) * 100)}%` }}
                >
                  {stage.count}
                </div>
              </div>
              <span className="w-24 shrink-0 text-right text-sm text-neutral-600 dark:text-neutral-300">
                {formatEur(stage.totalCents, locale)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">{t('pipelineReadOnly')}</p>
    </section>
  );
}
