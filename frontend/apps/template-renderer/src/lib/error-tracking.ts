/**
 * Client error-tracking binding — STEP 16.
 *
 * Wires the observability core into the browser:
 *   - global handlers: `window.onerror` + `unhandledrejection`;
 *   - breadcrumbs: click + navigation trail (redacted, bounded);
 *   - reporting: classify → redact → POST /api/telemetry/errors
 *     (keepalive, deduplicated per fingerprint window).
 *
 * GDPR: error reports are ESSENTIAL telemetry (security + stability,
 * Art. 6(1)(f)) — they carry no identity by design. Breadcrumb capture
 * (behavioral trail) additionally requires analytics consent.
 */
'use client';

import {
  classifyError,
  createBreadcrumbBuffer,
  redactText,
  type BreadcrumbType,
  type ClassifiedError,
  type ErrorContext,
} from '@jol-hub/observability';

const CONSENT_STORAGE_KEY = 'jol-cookie-consent';
const DEDUPE_WINDOW_MS = 10_000;

const breadcrumbs = createBreadcrumbBuffer(20);
const recentlyReported = new Map<string, number>();
let initialized = false;

/** True when the visitor granted analytics consent (breadcrumb trail). */
function analyticsConsented(): boolean {
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { analytics?: boolean };
    return parsed.analytics === true;
  } catch {
    return false;
  }
}

/** Record a breadcrumb (only with analytics consent). */
export function addBreadcrumb(type: BreadcrumbType, message: string): void {
  if (!analyticsConsented()) return;
  breadcrumbs.push(type, redactText(message));
}

/** Classify + report an error to the ingestion route. Never throws. */
export async function reportError(error: unknown, context: ErrorContext = {}): Promise<void> {
  try {
    const classified: ClassifiedError = classifyError(error, {
      route: context.route ?? (typeof window !== 'undefined' ? window.location.pathname : undefined),
      ...context,
    });

    // Dedupe: the same fingerprint once per window (flapping protection).
    const last = recentlyReported.get(classified.fingerprint) ?? 0;
    if (Date.now() - last < DEDUPE_WINDOW_MS) return;
    recentlyReported.set(classified.fingerprint, Date.now());
    if (recentlyReported.size > 50) recentlyReported.clear();

    const body = {
      ...classified,
      breadcrumbs: analyticsConsented() ? breadcrumbs.snapshot() : [],
    };

    await fetch('/api/telemetry/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true, // survives page unload
    });
  } catch {
    // Telemetry must never become the incident.
  }
}

/** Install global handlers once (idempotent). */
export function initErrorTracking(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  window.addEventListener('error', (event) => {
    void reportError(event.error ?? event.message, { route: window.location.pathname });
  });

  window.addEventListener('unhandledrejection', (event) => {
    void reportError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)), {
      route: window.location.pathname,
    });
  });

  // Breadcrumbs — consent-gated behavioral trail.
  document.addEventListener(
    'click',
    (event) => {
      const target = event.target as HTMLElement | null;
      const label =
        target?.getAttribute('aria-label') ??
        target?.closest?.('button,a')?.textContent?.trim().slice(0, 40) ??
        'unknown';
      addBreadcrumb('click', label);
    },
    { passive: true },
  );

  window.addEventListener('popstate', () => {
    addBreadcrumb('navigation', window.location.pathname);
  });
}
