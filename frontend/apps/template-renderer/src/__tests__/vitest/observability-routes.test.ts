/**
 * Observability route integration tests — STEP 15 pattern (MSW + real
 * route handlers).
 *
 *   /api/health            — pilot report shape, LB status semantics
 *   /api/telemetry/errors  — validation, re-redaction, backend forwarding
 *   /api/telemetry/perf    — schema enforcement
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { NextRequest } from 'next/server';
import { MOCK_BACKEND_URL } from '@jol-hub/testing';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function jsonReq(method: 'GET' | 'POST', path: string, body?: unknown): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

// =============================================================================
// /api/health
// =============================================================================

describe('health endpoint', () => {
  it('health.should.report pilot dependencies without failing the probe', async () => {
    vi.stubEnv('BACKEND_API_URL', '');
    vi.resetModules();
    const { GET } = await import('@/app/api/health/route');
    const response = await GET();
    expect(response.status).toBe(200);
    const report = await response.json();
    expect(report.status).toBe('ok');
    expect(report.dependencies.backend.status).toBe('unconfigured');
    expect(report.dependencies.payments.status).toBe('unconfigured');
    expect(typeof report.version).toBe('string');
    // No credentials/internals leak (detail strings are public-safe).
    expect(JSON.stringify(report)).not.toContain('Bearer');
    vi.unstubAllEnvs();
  });

  it('health.should.return 503 when the critical backend is down', async () => {
    server.use(
      http.get(`${MOCK_BACKEND_URL}/api/health`, () =>
        new HttpResponse(null, { status: 500 }),
      ),
    );
    vi.stubEnv('BACKEND_API_URL', MOCK_BACKEND_URL);
    vi.resetModules();
    const { GET } = await import('@/app/api/health/route');
    const response = await GET();
    expect(response.status).toBe(503);
    const report = await response.json();
    expect(report.status).toBe('down');
    expect(report.dependencies.backend.status).toBe('down');
    vi.unstubAllEnvs();
  });

  it('health.should.pass when the backend probe succeeds', async () => {
    server.use(
      http.get(`${MOCK_BACKEND_URL}/api/health`, () => HttpResponse.json({ ok: true })),
    );
    vi.stubEnv('BACKEND_API_URL', MOCK_BACKEND_URL);
    vi.resetModules();
    const { GET } = await import('@/app/api/health/route');
    const response = await GET();
    expect(response.status).toBe(200);
    const report = await response.json();
    expect(report.dependencies.backend.status).toBe('ok');
    expect(typeof report.dependencies.backend.latencyMs).toBe('number');
    vi.unstubAllEnvs();
  });
});

// =============================================================================
// /api/telemetry/errors
// =============================================================================

const VALID_REPORT = {
  category: 'rendering',
  severity: 'error',
  fingerprint: 'rendering::hydration failed::frames',
  message: 'Hydration failed because of a mismatch',
  route: '/lt/parish-st-john-vilnius',
  breadcrumbs: [{ type: 'click', message: 'add-block', time: '2026-08-25T12:00:00.000Z' }],
};

describe('telemetry errors ingress', () => {
  it('errors.should.accept a valid report with 204', async () => {
    vi.resetModules();
    const { POST } = await import('@/app/api/telemetry/errors/route');
    const response = await POST(jsonReq('POST', '/api/telemetry/errors', VALID_REPORT));
    expect(response.status).toBe(204);
  });

  it('errors.should.reject unknown categories (closed schema)', async () => {
    vi.resetModules();
    const { POST } = await import('@/app/api/telemetry/errors/route');
    const response = await POST(
      jsonReq('POST', '/api/telemetry/errors', { ...VALID_REPORT, category: 'exotic' }),
    );
    expect(response.status).toBe(400);
  });

  it('errors.should.reject oversized stacks (abuse guard)', async () => {
    vi.resetModules();
    const { POST } = await import('@/app/api/telemetry/errors/route');
    const response = await POST(
      jsonReq('POST', '/api/telemetry/errors', { ...VALID_REPORT, stack: 'x'.repeat(5000) }),
    );
    expect(response.status).toBe(400);
  });

  it('errors.should.answer 400 for invalid JSON', async () => {
    vi.resetModules();
    const { POST } = await import('@/app/api/telemetry/errors/route');
    const response = await POST(
      new NextRequest('http://localhost/api/telemetry/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{broken',
      }),
    );
    expect(response.status).toBe(400);
  });

  it('errors.should.forward redacted reports to the backend plane', async () => {
    let received: unknown = null;
    server.use(
      http.post(`${MOCK_BACKEND_URL}/api/v1/telemetry/errors`, async ({ request }) => {
        received = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    vi.stubEnv('BACKEND_API_URL', MOCK_BACKEND_URL);
    vi.resetModules();
    const { POST } = await import('@/app/api/telemetry/errors/route');
    const response = await POST(
      jsonReq('POST', '/api/telemetry/errors', {
        ...VALID_REPORT,
        // PII smuggled in the message must be defused before forwarding.
        message: 'failed for user@example.lt on +370 600 12345',
      }),
    );
    expect(response.status).toBe(204);
    const body = received as { message: string };
    expect(body.message).not.toContain('user@example.lt');
    expect(body.message).not.toContain('+370 600 12345');
    expect(body.message).toContain('[REDACTED:email]');
    vi.unstubAllEnvs();
  });
});

// =============================================================================
// /api/telemetry/perf
// =============================================================================

const VALID_SAMPLE = {
  samples: [
    {
      kind: 'navigation',
      route: '/lt/parish-st-john-vilnius',
      data: { dnsMs: 5, tcpMs: 12, sslMs: 8, ttfbMs: 90, downloadMs: 30, totalMs: 150 },
    },
  ],
};

describe('telemetry perf ingress', () => {
  it('perf.should.accept valid navigation samples', async () => {
    vi.resetModules();
    const { POST } = await import('@/app/api/telemetry/perf/route');
    const response = await POST(jsonReq('POST', '/api/telemetry/perf', VALID_SAMPLE));
    expect(response.status).toBe(204);
  });

  it('perf.should.reject negative or absurd values', async () => {
    vi.resetModules();
    const { POST } = await import('@/app/api/telemetry/perf/route');
    const bad = {
      samples: [
        {
          kind: 'navigation',
          route: '/x',
          data: { dnsMs: -5, tcpMs: 0, sslMs: 0, ttfbMs: 0, downloadMs: 0, totalMs: 0 },
        },
      ],
    };
    const response = await POST(jsonReq('POST', '/api/telemetry/perf', bad));
    expect(response.status).toBe(400);
  });

  it('perf.should.reject empty batches', async () => {
    vi.resetModules();
    const { POST } = await import('@/app/api/telemetry/perf/route');
    const response = await POST(jsonReq('POST', '/api/telemetry/perf', { samples: [] }));
    expect(response.status).toBe(400);
  });
});
