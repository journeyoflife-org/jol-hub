/**
 * MediaUploader — STEP 14 (quarantine-first media pipeline).
 *
 * Uploads NEVER go live: files enter quarantine and pass the backend's
 * malware scan (ClamAV-class) + AI moderation (on-prem Ollama/RAG) before
 * a human can approve them (the moderation queue shows scan/AI state).
 *
 * CLIENT-SIDE VALIDATION (the backend re-checks everything):
 *   - type allowlist: jpg / png / webp / svg;
 *   - size ≤ 2MB (EDITOR_LIMITS.maxImageBytes);
 *   - dimensions readable + sane (≤ 8192px edge — abuse guard);
 *   - ALT TEXT IS REQUIRED — the upload button stays disabled without it
 *     (WCAG 1.1.1 + spec TASK 3).
 *
 * PILOT: with no editor backend the uploader validates and reports
 * "quarantine pending backend" — files are NOT accepted anywhere (no
 * storage surface exists), which is the safe pilot posture.
 */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from '@jol-hub/i18n/use-translations';
import { ALLOWED_IMAGE_TYPES, EDITOR_LIMITS, type MediaLibraryItem } from '@/lib/editor';

const MAX_DIMENSION = 8192;

export interface MediaUploaderProps {
  tenantSlug: string;
  editorConfigured: boolean;
}

type UploadPhase =
  | 'idle'
  | 'invalid'
  | 'ready'        // validated, awaiting alt text + confirm
  | 'uploading'
  | 'quarantined'
  | 'error';

interface Candidate {
  file: File;
  width: number;
  height: number;
  objectUrl: string;
}

export function MediaUploader({ tenantSlug, editorConfigured }: MediaUploaderProps) {
  const t = useTranslations('editor');
  const [phase, setPhase] = useState<UploadPhase>('idle');
  const [validationError, setValidationError] = useState('');
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [altText, setAltText] = useState('');
  const [progress, setProgress] = useState(0);
  const [library, setLibrary] = useState<MediaLibraryItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Tenant media library (shows pipeline states incl. quarantine).
  useEffect(() => {
    if (!editorConfigured) return;
    let cancelled = false;
    fetch(`/api/editor/media?tenant=${encodeURIComponent(tenantSlug)}`)
      .then((response) => (response.ok ? response.json() : []))
      .then((items) => {
        if (!cancelled && Array.isArray(items)) setLibrary(items);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [editorConfigured, tenantSlug]);

  const validateAndLoad = useCallback((file: File) => {
    setValidationError('');
    setCandidate(null);
    setAltText('');
    setPhase('idle');

    if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
      setValidationError(t('mediaBadType'));
      setPhase('invalid');
      return;
    }
    if (file.size > EDITOR_LIMITS.maxImageBytes) {
      setValidationError(t('mediaTooLarge'));
      setPhase('invalid');
      return;
    }

    // Dimension check via an object URL (never injected into the DOM).
    const objectUrl = URL.createObjectURL(file);
    const probe = new Image();
    probe.onload = () => {
      URL.revokeObjectURL(objectUrl);
      if (probe.naturalWidth === 0 || probe.naturalWidth > MAX_DIMENSION || probe.naturalHeight > MAX_DIMENSION) {
        setValidationError(t('mediaBadDimensions'));
        setPhase('invalid');
        return;
      }
      const thumb = URL.createObjectURL(file);
      setCandidate({ file, width: probe.naturalWidth, height: probe.naturalHeight, objectUrl: thumb });
      setPhase('ready');
    };
    probe.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setValidationError(t('mediaUnreadable'));
      setPhase('invalid');
    };
    probe.src = objectUrl;
  }, [t]);

  const canUpload = phase === 'ready' && altText.trim().length > 0;

  const upload = async () => {
    if (!candidate || !canUpload) return;
    setPhase('uploading');
    setProgress(10);
    try {
      // Pilot integration point: the FILE itself will travel through the
      // backend's multipart scan endpoint; this call registers metadata +
      // the required alt text and receives the quarantine reference.
      const timer = setInterval(() => setProgress((p) => Math.min(90, p + 20)), 150);
      const response = await fetch('/api/editor/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug,
          fileName: candidate.file.name,
          mimeType: candidate.file.type,
          sizeBytes: candidate.file.size,
          altText: altText.trim(),
        }),
      });
      clearInterval(timer);
      setProgress(100);
      if (response.ok || response.status === 202) {
        setPhase('quarantined');
      } else if (response.status === 503) {
        setPhase('quarantined'); // pilot: validation passed; quarantine pending backend
      } else {
        setPhase('error');
      }
    } catch {
      setPhase('error');
    }
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) validateAndLoad(file);
  };

  const stateBadge = useMemo(() => {
    const labels: Record<MediaLibraryItem['state'], string> = {
      idle: t('mediaStateIdle'),
      validating: t('mediaStateScanning'),
      uploading: t('mediaStateScanning'),
      quarantined: t('mediaStateQuarantined'),
      approved: t('mediaStateApproved'),
      rejected: t('mediaStateRejected'),
    };
    return labels;
  }, [t]);

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label={t('mediaDropLabel')}
        className="focus-ring flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500 dark:border-neutral-700"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
      >
        <span>{t('mediaDropHint')}</span>
        <span className="text-xs">
          {t('mediaLimits')} ({Math.round(EDITOR_LIMITS.maxImageBytes / 1024 / 1024)} MB)
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) validateAndLoad(file);
          }}
        />
      </div>

      {phase === 'invalid' && (
        <p role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-200">
          {validationError}
        </p>
      )}

      {candidate && phase !== 'invalid' && (
        <div className="space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="flex items-start gap-4">
            {/* Thumbnail preview (object URL — never untrusted markup). */}
            <img
              src={candidate.objectUrl}
              alt={altText || t('mediaPreviewAlt')}
              className="h-24 w-24 rounded-md border border-neutral-200 object-cover dark:border-neutral-700"
              width={96}
              height={96}
            />
            <div className="text-sm">
              <p className="font-medium">{candidate.file.name}</p>
              <p className="text-neutral-500 dark:text-neutral-400">
                {candidate.width}×{candidate.height} · {(candidate.file.size / 1024).toFixed(0)} KB
              </p>
            </div>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block">
              {t('altTextLabel')} <span aria-hidden="true" className="text-red-600">*</span>
            </span>
            <input
              className="focus-ring w-full rounded-md border border-neutral-300 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900"
              value={altText}
              maxLength={EDITOR_LIMITS.maxTextLength.altText}
              onChange={(event) => setAltText(event.target.value)}
            />
            <span className="mt-1 block text-xs text-neutral-500 dark:text-neutral-400">{t('altTextHint')}</span>
          </label>

          {phase === 'uploading' && (
            <progress value={progress} max={100} className="w-full" aria-label={t('mediaUploading')} />
          )}

          <button
            type="button"
            disabled={!canUpload}
            onClick={() => void upload()}
            className="focus-ring rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {t('mediaUploadButton')}
          </button>
        </div>
      )}

      {phase === 'quarantined' && (
        <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          {editorConfigured ? t('mediaQuarantined') : t('mediaQuarantinedPilot')}
        </p>
      )}
      {phase === 'error' && (
        <p role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-200">
          {t('mediaError')}
        </p>
      )}

      {/* Library */}
      <section aria-label={t('mediaLibraryTitle')}>
        <h3 className="mb-2 font-heading text-base font-semibold">{t('mediaLibraryTitle')}</h3>
        {!editorConfigured ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('mediaLibraryPilot')}</p>
        ) : library.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('mediaLibraryEmpty')}</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {library.map((item) => (
              <li key={item.id} className="rounded-md border border-neutral-200 p-3 text-sm dark:border-neutral-800">
                <p className="font-medium">{item.fileName}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {stateBadge[item.state]} · {(item.sizeBytes / 1024).toFixed(0)} KB · {item.altText}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
