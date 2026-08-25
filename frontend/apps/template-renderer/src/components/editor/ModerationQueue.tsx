/**
 * ModerationQueue — STEP 14 (tenant admin / JOL admin surface).
 *
 * Lists pending changes (page edits + quarantined uploads) with the AI
 * screening result (ADVISORY — the human makes the final call), malware
 * scan state and GDPR Art. 9 routing. Actions: approve, reject with
 * reason, request changes with reason, escalate to JOL. Every decision is
 * audit-logged by the backend (SOC 2 CC7.2).
 *
 * Real-time: the backend receives scan/AI callbacks; the queue POLLS every
 * 30s (pilot strategy — same posture as the CRM layer, STEP 9).
 *
 * RBAC: the hosting page gates on the tenant `admin` role (or platform
 * superadmin); this component refuses to fetch without `authorized`.
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from '@jol-hub/i18n/use-translations';
import {
  decisionRequiresReason,
  diffBlocks,
  describeChange,
  isArt9Item,
  type EditorBlock,
  type ModerationDecision,
  type ModerationItem,
} from '@/lib/editor';

const POLL_MS = 30_000;

export interface ModerationQueueProps {
  tenantSlug: string;
  editorConfigured: boolean;
  /** Server-verified RBAC — the queue stays empty without it. */
  authorized: boolean;
  /** Current reviewer identity for the decision payload (audit trail). */
  reviewer: string;
}

type DecideState = 'idle' | 'busy' | 'done' | 'error';

export function ModerationQueue({ tenantSlug, editorConfigured, authorized, reviewer }: ModerationQueueProps) {
  const t = useTranslations('editor');
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [decideState, setDecideState] = useState<DecideState>('idle');

  const load = useCallback(async () => {
    if (!authorized || !editorConfigured) return;
    try {
      const response = await fetch(`/api/editor/moderation?tenant=${encodeURIComponent(tenantSlug)}`);
      if (!response.ok) return;
      const data = await response.json();
      if (Array.isArray(data)) setItems(data);
    } catch {
      // Queue polling must never surface errors — retry next cycle.
    }
  }, [authorized, editorConfigured, tenantSlug]);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(interval);
  }, [load]);

  const decide = async (item: ModerationItem, action: ModerationDecision['action']) => {
    const reason = (reasons[item.id] ?? '').trim();
    if (decisionRequiresReason(action) && !reason) return;
    setDecideState('busy');
    try {
      const response = await fetch(`/api/editor/moderation/${encodeURIComponent(item.id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantSlug, action, reason: reason || undefined }),
      });
      setDecideState(response.ok || response.status === 204 ? 'done' : 'error');
      if (response.ok || response.status === 204) {
        setItems((current) => current.filter((entry) => entry.id !== item.id));
        setExpanded(null);
      }
    } catch {
      setDecideState('error');
    }
  };

  if (!authorized) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('moderationUnauthorized')}</p>;
  }
  if (!editorConfigured) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('moderationPilot')}</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        {t('moderationIntro')} · {t('moderationAuditNote')} ({reviewer})
      </p>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500 dark:border-neutral-700">
          {t('moderationEmpty')}
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const art9 = isArt9Item(item);
            const isOpen = expanded === item.id;
            return (
              <li key={item.id} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs uppercase dark:bg-neutral-800">
                    {item.type === 'page-edit' ? t('itemPageEdit') : t('itemMediaUpload')}
                  </span>
                  <StatusBadge status={item.status} />
                  {art9 && (
                    <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      {t('art9Badge')}
                    </span>
                  )}
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">{item.submittedAt}</span>
                  <button
                    type="button"
                    className="focus-ring ml-auto rounded border border-neutral-300 px-2 py-0.5 text-xs dark:border-neutral-700"
                    aria-expanded={isOpen}
                    onClick={() => setExpanded(isOpen ? null : item.id)}
                  >
                    {isOpen ? t('collapse') : t('expand')}
                  </button>
                </div>

                {/* AI screening — ADVISORY ONLY */}
                {item.ai && (
                  <div className="mt-3 rounded-md border border-neutral-200 p-3 text-sm dark:border-neutral-800">
                    <p className="mb-1 font-medium">
                      {t('aiTitle')} — {item.ai.approved ? t('aiRecommendApprove') : t('aiRecommendFlag')}
                    </p>
                    {item.ai.flags.length === 0 ? (
                      <p className="text-neutral-500 dark:text-neutral-400">{t('aiNoFlags')}</p>
                    ) : (
                      <ul className="list-inside list-disc space-y-1">
                        {item.ai.flags.map((flag, index) => (
                          <li key={`${flag.category}-${index}`}>
                            <span className="font-medium">
                              {flag.category} ({flag.severity})
                            </span>{' '}
                            — {flag.reasoning}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{t('aiAdvisoryNote')}</p>
                  </div>
                )}

                {/* Malware scan state */}
                {item.scan && (
                  <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    {t('scanLabel')}: {item.scan.clean === null ? t('scanPending') : item.scan.clean ? t('scanClean') : t('scanInfected')}
                    {item.scan.engine ? ` (${item.scan.engine})` : ''}
                  </p>
                )}

                {isOpen && (
                  <div className="mt-3 space-y-3">
                    <DiffView item={item} />
                    <label className="block text-sm">
                      <span className="mb-1 block text-xs text-neutral-500">{t('decisionReasonLabel')}</span>
                      <textarea
                        className="focus-ring w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                        rows={2}
                        value={reasons[item.id] ?? ''}
                        onChange={(event) => setReasons((current) => ({ ...current, [item.id]: event.target.value }))}
                      />
                    </label>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <button type="button" disabled={decideState === 'busy'} onClick={() => void decide(item, 'approve')} className="focus-ring rounded-md bg-green-700 px-3 py-1.5 font-medium text-white disabled:opacity-40">
                        {t('approve')}
                      </button>
                      <button type="button" disabled={decideState === 'busy' || !(reasons[item.id] ?? '').trim()} onClick={() => void decide(item, 'reject')} className="focus-ring rounded-md bg-red-700 px-3 py-1.5 font-medium text-white disabled:opacity-40">
                        {t('reject')}
                      </button>
                      <button type="button" disabled={decideState === 'busy' || !(reasons[item.id] ?? '').trim()} onClick={() => void decide(item, 'request-changes')} className="focus-ring rounded-md border border-neutral-300 px-3 py-1.5 dark:border-neutral-700">
                        {t('requestChanges')}
                      </button>
                      <button type="button" disabled={decideState === 'busy'} onClick={() => void decide(item, 'escalate')} className="focus-ring rounded-md border border-neutral-300 px-3 py-1.5 dark:border-neutral-700">
                        {t('escalate')}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {decideState === 'error' && (
        <p role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-200">
          {t('decisionError')}
        </p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: ModerationItem['status'] }) {
  const t = useTranslations('editor');
  // Flat i18n keys — dotted keys would bypass the `editor` namespace.
  const labelKey: Record<ModerationItem['status'], string> = {
    pending: 'statusPending',
    scanning: 'statusScanning',
    approved: 'statusApproved',
    rejected: 'statusRejected',
    'changes-requested': 'statusChangesRequested',
    escalated: 'statusEscalated',
    'art9-review': 'statusArt9Review',
  };
  const styles: Record<ModerationItem['status'], string> = {
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    scanning: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'changes-requested': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    escalated: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'art9-review': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  };
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${styles[status]}`}>{t(labelKey[status])}</span>;
}

/** Before/after comparison — structural diff for page edits. */
function DiffView({ item }: { item: ModerationItem }) {
  const t = useTranslations('editor');
  if (item.type === 'media-upload') {
    return (
      <p className="text-sm text-neutral-600 dark:text-neutral-300">
        {t('diffMedia')}: {item.fileName ?? item.mediaId ?? '—'}
      </p>
    );
  }
  const before = Array.isArray(item.before) ? (item.before as EditorBlock[]) : [];
  const after = Array.isArray(item.after) ? (item.after as EditorBlock[]) : [];
  const changes = diffBlocks(before, after);
  if (changes.length === 0) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('diffNoChanges')}</p>;
  }
  return (
    <ul className="list-inside list-disc space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
      {changes.map((change, index) => (
        <li key={`${change.blockId}-${index}`}>{describeChange(change)}</li>
      ))}
    </ul>
  );
}
