/**
 * GET /api/health — STEP 16 (TASK 1, load-balancer probe).
 *
 * Returns { status, version, timestamp, dependencies } where each
 * dependency is one of: ok | degraded | down | unconfigured.
 *
 * Semantics (observability core): `unconfigured` is NOT a fault (pilot
 * planes); an OPTIONAL dependency down (CRM) degrades; only the critical
 * backend content plane failing returns 503. Probes are hard-capped at
 * 1.5 s each — the LB probe must never hang.
 *
 * SECURITY: no credentials, internals or tenant data leave this route;
 * details are public-safe strings only.
 */
import { NextResponse } from 'next/server';
import { aggregateHealth, timed, withTimeout, type DependencyCheck } from '@jol-hub/observability';
import { isAuthConfigured } from '@/lib/auth';
import { isCrmConfigured } from '@/lib/bitrix-client';
import { isEditorConfigured } from '@/lib/editor-client';

export const dynamic = 'force-dynamic';

const APP_VERSION = process.env.APP_VERSION ?? '0.16.0';
const PROBE_TIMEOUT_MS = 1_500;

const BACKEND_API_URL = process.env.BACKEND_API_URL;

async function probeBackend(): Promise<DependencyCheck> {
  if (!BACKEND_API_URL) {
    return { name: 'backend', status: 'unconfigured', critical: true, detail: 'pilot mode' };
  }
  const { result, latencyMs } = await timed(() =>
    withTimeout(
      async () => {
        const response = await fetch(`${BACKEND_API_URL}/api/health`, {
          method: 'GET',
          cache: 'no-store',
        });
        return response.ok ? 'ok' : 'down';
      },
      PROBE_TIMEOUT_MS,
      'timeout' as const,
    ),
  );
  return {
    name: 'backend',
    status: result === 'ok' ? 'ok' : 'down',
    latencyMs,
    critical: true,
    ...(result !== 'ok' ? { detail: result === 'timeout' ? 'probe timeout' : 'unreachable' } : {}),
  };
}

export async function GET(): Promise<NextResponse> {
  const checks: DependencyCheck[] = [
    await probeBackend(),
    // Auth + CRM planes: config presence (no network probe — they are
    // optional integrations; probing external services from a health
    // check would couple LB liveness to third-party availability).
    isAuthConfigured()
      ? { name: 'auth', status: 'ok', critical: false }
      : { name: 'auth', status: 'unconfigured', critical: false, detail: 'jol-auth pending' },
    isCrmConfigured()
      ? { name: 'crm', status: 'ok', critical: false }
      : { name: 'crm', status: 'unconfigured', critical: false, detail: 'bitrix24 pending' },
    // Payments remain closed (ADR-007) — reported, never probed.
    ...(isEditorConfigured()
      ? [{ name: 'editor', status: 'ok' as const, critical: false }]
      : [{ name: 'editor', status: 'unconfigured' as const, critical: false, detail: 'content plane pending' }]),
    { name: 'payments', status: 'unconfigured', critical: false, detail: 'ADR-007 boundary closed' },
  ];

  const report = aggregateHealth(checks, APP_VERSION);
  return NextResponse.json(report, {
    status: report.status === 'down' ? 503 : 200,
    headers: { 'cache-control': 'no-store' },
  });
}
