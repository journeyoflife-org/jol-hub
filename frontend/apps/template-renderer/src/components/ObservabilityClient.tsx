/**
 * Observability client bootstrap — STEP 16.
 *
 * Mounted once in the root layout:
 *   - installs global error handlers (window.onerror, unhandledrejection);
 *   - collects deep performance timings (navigation phases, slowest
 *     resources) batched to `/api/telemetry/perf` every 30 s / on hide.
 *
 * GDPR split (same contract as STEP-13 WebVitals):
 *   - error reporting = essential (security/stability, Art. 6(1)(f)),
 *     identity-free by construction;
 *   - performance sampling = analytics consent required.
 */
'use client';

import { useEffect } from 'react';
import { computeNavigationPhases, createMetricBatcher, slowestResources } from '@jol-hub/observability';
import { initErrorTracking } from '@/lib/error-tracking';

const CONSENT_STORAGE_KEY = 'jol-cookie-consent';

interface PerfSample {
  kind: 'navigation' | 'resources';
  route: string;
  /** Typed at construction (phases / slowest list); opaque for batching. */
  data: unknown;
}

function analyticsConsented(): boolean {
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return false;
    return (JSON.parse(raw) as { analytics?: boolean }).analytics === true;
  } catch {
    return false;
  }
}

export function ObservabilityClient(): null {
  useEffect(() => {
    initErrorTracking();

    if (!analyticsConsented()) return;

    const batcher = createMetricBatcher<PerfSample>({
      maxBatch: 10,
      flushMs: 30_000,
      transport: (batch) =>
        fetch('/api/telemetry/perf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ samples: batch }),
          keepalive: true,
        }).then(() => undefined),
    });

    // Navigation phase breakdown (DNS/TCP/SSL/TTFB/download).
    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    const nav = navEntries[0];
    if (nav) {
      batcher.add({
        kind: 'navigation',
        route: window.location.pathname,
        data: computeNavigationPhases({
          domainLookupStart: nav.domainLookupStart,
          domainLookupEnd: nav.domainLookupEnd,
          connectStart: nav.connectStart,
          secureConnectionStart: nav.secureConnectionStart,
          connectEnd: nav.connectEnd,
          requestStart: nav.requestStart,
          responseStart: nav.responseStart,
          responseEnd: nav.responseEnd,
        }),
      });
    }

    // Slowest resources (bounded; query-stripped by the core).
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const slowest = slowestResources(resources, 5);
    if (slowest.length > 0) {
      batcher.add({ kind: 'resources', route: window.location.pathname, data: { slowest } });
    }

    batcher.start();
    const flushOnHide = () => {
      if (document.visibilityState === 'hidden') void batcher.flushNow();
    };
    document.addEventListener('visibilitychange', flushOnHide);

    return () => {
      document.removeEventListener('visibilitychange', flushOnHide);
      batcher.stop();
      void batcher.flushNow();
    };
  }, []);

  return null;
}
