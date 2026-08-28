/**
 * Health check core — STEP 16 (TASK 1/8).
 *
 * Dependency probing primitives + aggregation rules for /api/health.
 * Probe implementations (fetch-based) live in the renderer route; this
 * module owns the contract and the status math.
 *
 * Semantics:
 *   - ok          — dependency responded within timeout;
 *   - unconfigured — dependency intentionally absent in this environment
 *                    (pilot); NOT a fault;
 *   - degraded    — optional dependency down (CRM, payments) — site still
 *                    serves content;
 *   - down        — critical dependency unreachable (backend content plane);
 *
 * Overall: any `down` → 503 `down`; else any `degraded` → 200 `degraded`;
 * else 200 `ok`. Load balancers alert on 503 only.
 */

export type DependencyStatus = 'ok' | 'degraded' | 'down' | 'unconfigured';

export interface DependencyCheck {
  name: string;
  status: DependencyStatus;
  latencyMs?: number;
  /** Public-safe detail (never internals/credentials). */
  detail?: string;
  /** Down state of this dependency fails the whole health check. */
  critical: boolean;
}

export interface HealthReport {
  status: 'ok' | 'degraded' | 'down';
  version: string;
  timestamp: string;
  dependencies: Record<string, Omit<DependencyCheck, 'name' | 'critical'>>;
}

/** Aggregate individual checks into the overall report. */
export function aggregateHealth(
  checks: readonly DependencyCheck[],
  version: string,
  timestamp = new Date().toISOString(),
): HealthReport {
  const criticalDown = checks.some((check) => check.critical && check.status === 'down');
  const anyDegraded = checks.some((check) => check.status === 'degraded');

  const dependencies: HealthReport['dependencies'] = {};
  for (const check of checks) {
    dependencies[check.name] = {
      status: check.status,
      ...(check.latencyMs !== undefined ? { latencyMs: check.latencyMs } : {}),
      ...(check.detail ? { detail: check.detail } : {}),
    };
  }

  return {
    status: criticalDown ? 'down' : anyDegraded ? 'degraded' : 'ok',
    version,
    timestamp,
    dependencies,
  };
}

/**
 * Race a probe against a timeout. On timeout the `fallback` resolves —
 * callers pass a sentinel (e.g. a `timeout` status) so the health check
 * never hangs the load balancer probe.
 */
export async function withTimeout<T>(probe: () => Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race<T>([
      probe(),
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

/** Measure a probe's latency in whole milliseconds. */
export async function timed<T>(probe: () => Promise<T>): Promise<{ result: T; latencyMs: number }> {
  const start = Date.now();
  const result = await probe();
  return { result, latencyMs: Date.now() - start };
}
