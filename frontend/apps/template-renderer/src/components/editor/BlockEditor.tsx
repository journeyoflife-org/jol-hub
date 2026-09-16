/**
 * BlockEditor — STEP 14 (constrained 10% tenant control).
 *
 * Tenants edit ONLY the block types on the closed allowlist (heading,
 * paragraph, image, quote, button, divider, spacer). There is NO raw HTML
 * surface: text lives in structured fields, rich text is text + marks, and
 * preview/publish HTML is escape-first rendered (sanitize.ts) with a final
 * DOMPurify pass (locked ALLOWED_TAGS) — XSS by construction.
 *
 * Behaviors:
 *   - block toolbar: add above/below, delete, move up/down (drag-and-drop
 *     is the dnd-kit integration point once the dependency lands; move
 *     buttons cover the same operations keyboard-accessibly);
 *   - autosave every 30s when dirty (draft, never publishes);
 *   - publish = submit for moderation (202 + queue item, not live);
 *   - revision history (last 10) with structural diff;
 *   - 2h session limit — editing locks, re-auth required (spec TASK 8);
 *   - live constraint + prohibited-pattern findings.
 *
 * PILOT: with no editor backend the editor stays a LOCAL working draft
 * (autosave reports "not configured") — no fabricated persistence.
 */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import { useTranslations } from '@jol-hub/i18n/use-translations';
import {
  ALLOWED_BLOCK_TYPES,
  EDITOR_LIMITS,
  draftTextOf,
  diffBlocks,
  describeChange,
  imageCount,
  isSafeUrl,
  renderDraftHtml,
  scanProhibitedPatterns,
  validateDraft,
  SANITIZED_ALLOWED_TAGS,
  type EditorBlock,
  type EditorBlockType,
  type EditorRevision,
} from '@/lib/editor';

/** DOMPurify attribute allowlist — matches the escape-first emitter. */
const PURIFY_ALLOWED_ATTR = [
  'href', 'rel', 'alt', 'type', 'data-media-id', 'data-spacer', 'data-block',
];

export interface BlockEditorProps {
  tenantSlug: string;
  /** The editable page id (backend content plane reference). */
  pageId: string;
  /** True when BACKEND_API_URL is configured (server passes this down). */
  editorConfigured: boolean;
  basePath: string;
}

type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error' | 'unconfigured' | 'expired';

/** Save-state → i18n key (flat keys — dotted keys bypass the namespace). */
const SAVE_STATE_KEY: Record<SaveState, string> = {
  idle: 'saveIdle',
  dirty: 'saveDirty',
  saving: 'saveSaving',
  saved: 'saveSaved',
  error: 'saveError',
  unconfigured: 'saveUnconfigured',
  expired: 'saveExpired',
};

function newBlockId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `blk-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function defaultBlock(type: EditorBlockType): EditorBlock {
  const block: EditorBlock = { id: newBlockId(), type };
  if (type === 'heading' || type === 'paragraph' || type === 'quote') block.text = '';
  if (type === 'button') block.label = '';
  if (type === 'image') block.altText = '';
  if (type === 'spacer') block.size = 1;
  return block;
}

export function BlockEditor({ tenantSlug, pageId, editorConfigured, basePath }: BlockEditorProps) {
  const t = useTranslations('editor');
  const [blocks, setBlocks] = useState<EditorBlock[]>([]);
  const [revision, setRevision] = useState(0);
  const [history, setHistory] = useState<EditorRevision[]>([]);
  const [saveState, setSaveState] = useState<SaveState>(editorConfigured ? 'idle' : 'unconfigured');
  const [preview, setPreview] = useState(false);
  const [publishState, setPublishState] = useState<'idle' | 'pending' | 'queued' | 'error'>('idle');
  const [queueItemId, setQueueItemId] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const dirtyRef = useRef(false);
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;
  const revisionRef = useRef(revision);
  revisionRef.current = revision;
  const mountedAt = useRef(Date.now());

  const findings = useMemo(() => validateDraft(blocks), [blocks]);
  const warnings = useMemo(() => scanProhibitedPatterns(draftTextOf(blocks)), [blocks]);
  const images = imageCount(blocks);

  // -------------------------------------------------------------------------
  // LOAD + AUTOSAVE (30s) + SESSION LIMIT (2h)
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!editorConfigured) return;
    let cancelled = false;
    fetch(`/api/editor/pages/${encodeURIComponent(pageId)}/draft?tenant=${encodeURIComponent(tenantSlug)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setBlocks(Array.isArray(data.blocks) ? data.blocks : []);
        setRevision(data.revision ?? 0);
        setHistory(Array.isArray(data.history) ? data.history.slice(0, EDITOR_LIMITS.maxRevisions) : []);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [editorConfigured, pageId, tenantSlug]);

  const saveDraft = useCallback(async (): Promise<void> => {
    if (!dirtyRef.current || sessionExpired) return;
    if (!editorConfigured) {
      setSaveState('unconfigured'); // local-only draft in the pilot
      return;
    }
    setSaveState('saving');
    try {
      const response = await fetch(`/api/editor/pages/${encodeURIComponent(pageId)}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantSlug, blocks: blocksRef.current, revision: revisionRef.current }),
      });
      if (!response.ok) throw new Error(`save failed: ${response.status}`);
      const data = await response.json();
      dirtyRef.current = false;
      setRevision(data.revision ?? revisionRef.current + 1);
      if (Array.isArray(data.history)) setHistory(data.history.slice(0, EDITOR_LIMITS.maxRevisions));
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  }, [editorConfigured, pageId, tenantSlug, sessionExpired]);

  useEffect(() => {
    const interval = setInterval(() => void saveDraft(), EDITOR_LIMITS.autoSaveMs);
    const timeout = setTimeout(() => {
      setSessionExpired(true);
      void saveDraft(); // spec: save draft, then require re-auth
    }, EDITOR_LIMITS.sessionTimeoutMs);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [saveDraft]);

  // -------------------------------------------------------------------------
  // BLOCK OPERATIONS (immutable)
  // -------------------------------------------------------------------------

  const mutate = useCallback((next: EditorBlock[]) => {
    setBlocks(next);
    dirtyRef.current = true;
    setSaveState('dirty');
  }, []);

  const insertBlock = (type: EditorBlockType, index: number) => {
    if (blocks.length >= EDITOR_LIMITS.maxBlocks) return;
    if (type === 'image' && images >= EDITOR_LIMITS.maxImages) return;
    const next = [...blocks];
    next.splice(index, 0, defaultBlock(type));
    mutate(next);
  };

  const removeBlock = (id: string) => mutate(blocks.filter((block) => block.id !== id));

  const moveBlock = (id: string, delta: -1 | 1) => {
    const index = blocks.findIndex((block) => block.id === id);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(target, 0, item);
    mutate(next);
  };

  const updateBlock = (id: string, patch: Partial<EditorBlock>) =>
    mutate(blocks.map((block) => (block.id === id ? { ...block, ...patch } : block)));

  /** Toggle bold/italic over a textarea selection (structured marks). */
  const toggleMark = (id: string, kind: 'bold' | 'italic', start: number, end: number) => {
    if (end <= start) return;
    const block = blocks.find((b) => b.id === id);
    if (!block) return;
    const marks = block.marks ?? [];
    const identical = marks.findIndex((m) => m.kind === kind && m.start === start && m.end === end);
    const nextMarks = identical >= 0
      ? marks.filter((_, i) => i !== identical)
      : [...marks, { start, end, kind }];
    updateBlock(id, { marks: nextMarks });
  };

  /** Attach a validated link to a selection (unsafe URLs are refused). */
  const applyLink = (id: string, start: number, end: number, href: string) => {
    if (end <= start || !isSafeUrl(href)) return;
    const block = blocks.find((b) => b.id === id);
    if (!block) return;
    updateBlock(id, { links: [...(block.links ?? []), { start, end, href }] });
  };

  // -------------------------------------------------------------------------
  // PUBLISH (→ moderation, never live) + PREVIEW (DOMPurify-locked)
  // -------------------------------------------------------------------------

  const publish = async () => {
    await saveDraft();
    if (!editorConfigured) {
      setPublishState('pending'); // pilot: nothing to queue
      return;
    }
    setPublishState('pending');
    try {
      const response = await fetch(`/api/editor/pages/${encodeURIComponent(pageId)}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantSlug }),
      });
      if (!response.ok) throw new Error('publish failed');
      const data = await response.json();
      setQueueItemId(data.itemId ?? null);
      setPublishState('queued');
    } catch {
      setPublishState('error');
    }
  };

  const previewHtml = useMemo(() => {
    if (!preview) return '';
    const html = renderDraftHtml(blocks);
    if (typeof window === 'undefined' || !DOMPurify.isSupported) return html;
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [...SANITIZED_ALLOWED_TAGS],
      ALLOWED_ATTR: PURIFY_ALLOWED_ATTR,
    });
  }, [preview, blocks]);

  const disabled = sessionExpired;

  return (
    <div className="space-y-6">
      {/* Toolbar: save state, preview toggle, publish */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-neutral-500 dark:text-neutral-400" role="status" aria-live="polite">
          {t(SAVE_STATE_KEY[saveState])} · {t('revisionLabel')} {revision}
        </span>
        <button
          type="button"
          className="focus-ring rounded-md border border-neutral-300 px-3 py-1.5 dark:border-neutral-700"
          onClick={() => setPreview(!preview)}
        >
          {preview ? t('backToEditing') : t('previewMode')}
        </button>
        <button
          type="button"
          className="focus-ring rounded-md border border-neutral-300 px-3 py-1.5 dark:border-neutral-700"
          onClick={() => void saveDraft()}
          disabled={disabled}
        >
          {t('saveNow')}
        </button>
        <button
          type="button"
          className="focus-ring rounded-md bg-primary px-3 py-1.5 font-medium text-white"
          onClick={() => void publish()}
          disabled={disabled || findings.length > 0 || publishState === 'pending'}
        >
          {t('publishForModeration')}
        </button>
      </div>

      {sessionExpired && (
        <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          {t('sessionExpired')}
        </p>
      )}

      {publishState === 'queued' && (
        <p className="rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-900 dark:border-green-700 dark:bg-green-950 dark:text-green-200">
          {t('publishQueued')} {queueItemId ? `(${queueItemId})` : ''}
        </p>
      )}
      {publishState === 'pending' && !editorConfigured && (
        <p className="rounded-md border border-neutral-300 p-3 text-sm text-neutral-600 dark:border-neutral-700 dark:text-neutral-300">
          {t('publishPilotNote')}
        </p>
      )}

      {/* Findings: constraints + prohibited patterns */}
      {(findings.length > 0 || warnings.length > 0) && (
        <ul className="space-y-1 rounded-md border border-neutral-200 p-3 text-sm dark:border-neutral-800">
          {findings.map((finding) => (
            <li key={`${finding.code}-${finding.blockId ?? 'page'}`} className="text-red-700 dark:text-red-400">
              {finding.message}
            </li>
          ))}
          {warnings.map((warning) => (
            <li key={warning.code} className="text-amber-700 dark:text-amber-400">
              {warning.message}
            </li>
          ))}
        </ul>
      )}

      {/* Preview OR block list */}
      {preview ? (
        // DOMPurify-sanitized escape-first HTML — see sanitize.ts.
        <div
          className="prose-neutral space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      ) : (
        <ol className="space-y-3">
          {blocks.map((block, index) => (
            <li key={block.id} className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
              <BlockControls
                block={block}
                index={index}
                total={blocks.length}
                disabled={disabled}
                onChange={updateBlock}
                onToggleMark={toggleMark}
                onApplyLink={applyLink}
                onMove={moveBlock}
                onRemove={removeBlock}
                onInsert={insertBlock}
              />
            </li>
          ))}
          <li>
            <AddBlockMenu disabled={disabled || blocks.length >= EDITOR_LIMITS.maxBlocks} onAdd={(type) => insertBlock(type, blocks.length)} label={t('addBlock')} />
          </li>
        </ol>
      )}

      {/* Revision history (last 10) with structural diff */}
      <section aria-label={t('historyTitle')}>
        <h2 className="mb-2 font-heading text-lg font-semibold">{t('historyTitle')}</h2>
        {history.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('historyEmpty')}</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {history.map((entry) => {
              const changes = diffBlocks(entry.blocks, blocks);
              return (
                <li key={entry.revision} className="rounded-md border border-neutral-200 p-2 dark:border-neutral-800">
                  <span className="font-medium">
                    {t('revisionLabel')} {entry.revision}
                  </span>{' '}
                  <span className="text-neutral-500 dark:text-neutral-400">{entry.savedAt}</span>
                  {changes.length > 0 && (
                    <ul className="mt-1 list-inside list-disc text-neutral-600 dark:text-neutral-300">
                      {changes.slice(0, 5).map((change, i) => (
                        <li key={`${change.blockId}-${i}`}>{describeChange(change)}</li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        {t('moderationNote')} {`${basePath}/editor/moderation`}
      </p>
    </div>
  );
}

// =============================================================================
// Per-block controls (kept in the same client chunk — editor-only route)
// =============================================================================

interface BlockControlsProps {
  block: EditorBlock;
  index: number;
  total: number;
  disabled: boolean;
  onChange: (id: string, patch: Partial<EditorBlock>) => void;
  onToggleMark: (id: string, kind: 'bold' | 'italic', start: number, end: number) => void;
  onApplyLink: (id: string, start: number, end: number, href: string) => void;
  onMove: (id: string, delta: -1 | 1) => void;
  onRemove: (id: string) => void;
  onInsert: (type: EditorBlockType, index: number) => void;
}

function BlockControls({ block, index, total, disabled, onChange, onToggleMark, onApplyLink, onMove, onRemove, onInsert }: BlockControlsProps) {
  const t = useTranslations('editor');
  const textRef = useRef<HTMLTextAreaElement>(null);

  const selection = (): [number, number] => {
    const el = textRef.current;
    return el ? [el.selectionStart ?? 0, el.selectionEnd ?? 0] : [0, 0];
  };

  const toolbar = (
    <div className="mb-2 flex flex-wrap items-center gap-1 text-xs">
      <span className="mr-1 font-medium uppercase tracking-wide text-neutral-500">{block.type}</span>
      <ToolbarButton label={t('moveUp')} disabled={disabled || index === 0} onClick={() => onMove(block.id, -1)} />
      <ToolbarButton label={t('moveDown')} disabled={disabled || index === total - 1} onClick={() => onMove(block.id, 1)} />
      <ToolbarButton label={t('addAbove')} disabled={disabled} onClick={() => onInsert('paragraph', index)} />
      <ToolbarButton label={t('addBelow')} disabled={disabled} onClick={() => onInsert('paragraph', index + 1)} />
      <ToolbarButton label={t('deleteBlock')} disabled={disabled} onClick={() => onRemove(block.id)} />
      {(block.type === 'paragraph' || block.type === 'quote') && (
        <>
          <ToolbarButton label={t('bold')} disabled={disabled} onClick={() => { const [s, e] = selection(); onToggleMark(block.id, 'bold', s, e); }} />
          <ToolbarButton label={t('italic')} disabled={disabled} onClick={() => { const [s, e] = selection(); onToggleMark(block.id, 'italic', s, e); }} />
          <ToolbarButton
            label={t('link')}
            disabled={disabled}
            onClick={() => {
              const [s, e] = selection();
              const href = window.prompt(t('linkPrompt'));
              if (href) onApplyLink(block.id, s, e, href);
            }}
          />
        </>
      )}
    </div>
  );

  return (
    <div>
      {toolbar}
      {block.type === 'heading' && (
        <input
          className="focus-ring w-full rounded-md border border-neutral-300 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900"
          value={block.text ?? ''}
          maxLength={EDITOR_LIMITS.maxTextLength.heading}
          placeholder={t('headingPlaceholder')}
          disabled={disabled}
          onChange={(event) => onChange(block.id, { text: event.target.value })}
        />
      )}
      {(block.type === 'paragraph' || block.type === 'quote') && (
        <textarea
          ref={textRef}
          className="focus-ring w-full rounded-md border border-neutral-300 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900"
          rows={block.type === 'quote' ? 2 : 4}
          value={block.text ?? ''}
          maxLength={EDITOR_LIMITS.maxTextLength[block.type]}
          placeholder={t('textPlaceholder')}
          disabled={disabled}
          onChange={(event) => onChange(block.id, { text: event.target.value })}
        />
      )}
      {block.type === 'image' && (
        <div className="space-y-2 text-sm">
          <label className="block">
            <span className="mb-1 block text-xs text-neutral-500">{t('altTextLabel')}</span>
            <input
              className="focus-ring w-full rounded-md border border-neutral-300 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900"
              value={block.altText ?? ''}
              maxLength={EDITOR_LIMITS.maxTextLength.altText}
              disabled={disabled}
              onChange={(event) => onChange(block.id, { altText: event.target.value })}
            />
          </label>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('imageMediaNote')}</p>
        </div>
      )}
      {block.type === 'button' && (
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <input
            className="focus-ring rounded-md border border-neutral-300 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900"
            value={block.label ?? ''}
            maxLength={EDITOR_LIMITS.maxTextLength.button}
            placeholder={t('buttonLabelPlaceholder')}
            disabled={disabled}
            onChange={(event) => onChange(block.id, { label: event.target.value })}
          />
          <input
            className="focus-ring rounded-md border border-neutral-300 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900"
            value={block.href ?? ''}
            placeholder={t('buttonHrefPlaceholder')}
            disabled={disabled}
            onChange={(event) => onChange(block.id, { href: event.target.value })}
          />
        </div>
      )}
      {block.type === 'spacer' && (
        <select
          className="focus-ring rounded-md border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          value={block.size ?? 1}
          disabled={disabled}
          onChange={(event) => onChange(block.id, { size: Number(event.target.value) as 1 | 2 | 3 | 4 })}
        >
          {[1, 2, 3, 4].map((size) => (
            <option key={size} value={size}>
              {t('spacerSize')} {size}
            </option>
          ))}
        </select>
      )}
      {block.type === 'divider' && (
        <hr className="border-neutral-300 dark:border-neutral-700" />
      )}
    </div>
  );
}

function ToolbarButton({ label, disabled, onClick }: { label: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className="focus-ring rounded border border-neutral-300 px-2 py-0.5 hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-700 dark:hover:bg-neutral-800"
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function AddBlockMenu({ disabled, onAdd, label }: { disabled: boolean; onAdd: (type: EditorBlockType) => void; label: string }) {
  return (
    <div className="flex flex-wrap items-center gap-1 text-xs">
      <span className="mr-1 text-neutral-500">{label}:</span>
      {ALLOWED_BLOCK_TYPES.map((type) => (
        <ToolbarButton key={type} label={type} disabled={disabled} onClick={() => onAdd(type)} />
      ))}
    </div>
  );
}
