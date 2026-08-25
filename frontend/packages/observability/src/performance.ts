/**
 * Client performance metrics core — STEP 16.
 *
 * Complements the STEP-13 Web Vitals RUM (`next/web-vitals` → /api/perf)
 * with the deeper timings the spec requires: navigation phase breakdown
 * (DNS/TCP/SSL/TTFB/download), slow-resource detection and API latency.
 *
 * Pure collectors — the browser bindings (PerformanceEntry lookups) live
 * in the renderer's client component; everything here is testable in Node.
 */

export interface NavigationPhaseTimings {
  dnsMs: number;
  tcpMs: number;
  sslMs: number;
  ttfbMs: number;
  downloadMs: number;
  totalMs: number;
}

export interface ResourceSummary {
  name: string;
  initiatorType: string;
  durationMs: number;
  transferBytes: number;
}

export interface ApiLatencySample {
  path: string;
  method: string;
  status: number;
  durationMs: number;
}

/**
 * Derive phase timings from Navigation Timing Level 2 numbers. All inputs
 * are milliseconds since navigation start; negative gaps clamp to 0
 * (clock skew between resource entries is common).
 */
export function computeNavigationPhases(t: {
  domainLookupStart: number;
  domainLookupEnd: number;
  connectStart: number;
  secureConnectionStart: number;
  connectEnd: number;
  requestStart: number;
  responseStart: number;
  responseEnd: number;
}): NavigationPhaseTimings {
  const clamp = (value: number) => Math.max(0, Math.round(value));
  return {
    dnsMs: clamp(t.domainLookupEnd - t.domainLookupStart),
    tcpMs: clamp(t.connectEnd - Math.max(t.connectStart, t.secureConnectionStart || t.connectStart)),
    sslMs: clamp(t.secureConnectionStart > 0 ? t.connectEnd - t.secureConnectionStart : 0),
    ttfbMs: clamp(t.responseStart - t.requestStart),
    downloadMs: clamp(t.responseEnd - t.responseStart),
    totalMs: clamp(t.responseEnd),
  };
}

/**
 * Pick the slowest resources by type class. Keeps the payload bounded
 * (batching rule: small, batched, consent-gated on the client).
 */
export function slowestResources(
  entries: Array<{ name: string; initiatorType?: string; duration?: number; transferSize?: number }>,
  limit = 5,
): ResourceSummary[] {
  return entries
    .filter((entry) => (entry.duration ?? 0) > 0)
    .sort((a, b) => (b.duration ?? 0) - (a.duration ?? 0))
    .slice(0, limit)
    .map((entry) => ({
      // Strip query strings/fragments — keeps grouping stable, no PII.
      name: entry.name.split(/[?#]/)[0] ?? entry.name,
      initiatorType: entry.initiatorType ?? 'other',
      durationMs: Math.round(entry.duration ?? 0),
      transferBytes: Math.max(0, entry.transferSize ?? 0),
    }));
}

// =============================================================================
// Metric batching — send every 30 s or on unload (spec TASK 1/3)
// =============================================================================

export interface MetricBatcherOptions<T> {
  /** Delivery callback for each flushed batch. */
  transport: (batch: T[]) => void | Promise<void>;
  maxBatch?: number;
  flushMs?: number;
}

/**
 * Generic timed batcher. `add()` buffers; flushes happen on size, on the
 * interval and via `flushNow()` (wired to visibilitychange/pagehide with
 * keepalive on the client).
 */
export function createMetricBatcher<T>(options: MetricBatcherOptions<T>) {
  const maxBatch = options.maxBatch ?? 20;
  const buffer: T[] = [];
  let timer: ReturnType<typeof setInterval> | null = null;

  async function flushNow(): Promise<void> {
    if (buffer.length === 0) return;
    const batch = buffer.splice(0, buffer.length);
    try {
      await options.transport(batch);
    } catch {
      // Telemetry must never break the page.
    }
  }

  return {
    add(sample: T): void {
      buffer.push(sample);
      if (buffer.length >= maxBatch) void flushNow();
    },
    flushNow,
    start(): void {
      if (timer === null) timer = setInterval(() => void flushNow(), options.flushMs ?? 30_000);
    },
    stop(): void {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    },
    pending(): number {
      return buffer.length;
    },
  };
}
