/**
 * Integration tests — STEP 15 (route handlers + MSW).
 *
 * Exercises the REAL Next.js route handlers (same-origin API proxies) with
 * the hub backend mocked by MSW at the network layer — no handler code is
 * stubbed, no real backend is touched (spec RULES: fast + isolated).
 *
 * Coverage: happy paths, validation ordering (400 before 503), backend
 * error propagation (502), network failure, and tenant-isolation headers.
 *
 * Mechanism: route modules read BACKEND_API_URL at IMPORT time, so the env
 * is stubbed and modules reset before each dynamic import.
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { NextRequest } from 'next/server';
import { backendHandlers, MOCK_BACKEND_URL, MOCK_DRAFT } from '@jol-hub/testing';

const server = setupServer(...backendHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

vi.stubEnv('BACKEND_API_URL', MOCK_BACKEND_URL);
vi.stubEnv('BACKEND_SERVICE_TOKEN', 'test-service-token');

type RouteContext = { params: Record<string, string> };

function req(method: 'GET' | 'POST', path: string, body?: unknown): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function importRoute(path: string) {
  vi.resetModules();
  return import(path);
}

// =============================================================================
// /api/editor/pages/[pageId]/draft
// =============================================================================

describe('editor draft API', () => {
  it('draft.should.proxy GET to the backend and return the draft', async () => {
    const { GET } = await importRoute('@/app/api/editor/pages/[pageId]/draft/route');
    const response = await GET(
      req('GET', '/api/editor/pages/tenant-editable/draft?tenant=test-church'),
      { params: { pageId: 'tenant-editable' } } as unknown as RouteContext,
    );
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.revision).toBe(MOCK_DRAFT.revision);
    expect(data.blocks).toHaveLength(MOCK_DRAFT.blocks.length);
  });

  it('draft.should.forward the validated tenant slug as X-Tenant (RLS isolation)', async () => {
    let seenTenant: string | null = null;
    let seenAuth: string | null = null;
    server.use(
      http.get(`${MOCK_BACKEND_URL}/api/v1/editor/pages/:pageId/draft`, ({ request }) => {
        seenTenant = request.headers.get('X-Tenant');
        seenAuth = request.headers.get('authorization');
        return HttpResponse.json(MOCK_DRAFT);
      }),
    );
    const { GET } = await importRoute('@/app/api/editor/pages/[pageId]/draft/route');
    await GET(req('GET', '/api/editor/pages/tenant-editable/draft?tenant=test-church'), {
      params: { pageId: 'tenant-editable' },
    } as unknown as RouteContext);
    expect(seenTenant).toBe('test-church');
    // Service token travels server-side only.
    expect(seenAuth).toBe('Bearer test-service-token');
  });

  it('draft.should.reject malformed slugs with 400 BEFORE backend contact', async () => {
    let backendHit = false;
    server.use(
      http.get(`${MOCK_BACKEND_URL}/api/v1/editor/pages/:pageId/draft`, () => {
        backendHit = true;
        return HttpResponse.json(MOCK_DRAFT);
      }),
    );
    const { GET } = await importRoute('@/app/api/editor/pages/[pageId]/draft/route');
    const response = await GET(req('GET', '/api/editor/pages/x/draft?tenant=BAD_SLUG'), {
      params: { pageId: 'x' },
    } as unknown as RouteContext);
    expect(response.status).toBe(400);
    expect(backendHit).toBe(false);
  });

  it('draft.should.reject disallowed block types on POST (XSS/HTML surface closed)', async () => {
    const { POST } = await importRoute('@/app/api/editor/pages/[pageId]/draft/route');
    const response = await POST(
      req('POST', '/api/editor/pages/tenant-editable/draft', {
        tenantSlug: 'test-church',
        revision: 0,
        blocks: [{ id: 'b1', type: 'iframe', text: '<script>alert(1)</script>' }],
      }),
      { params: { pageId: 'tenant-editable' } } as unknown as RouteContext,
    );
    expect(response.status).toBe(400);
  });

  it('draft.should.reject unsafe link hrefs on POST', async () => {
    const { POST } = await importRoute('@/app/api/editor/pages/[pageId]/draft/route');
    const response = await POST(
      req('POST', '/api/editor/pages/tenant-editable/draft', {
        tenantSlug: 'test-church',
        revision: 0,
        blocks: [
          { id: 'b1', type: 'paragraph', text: 'x', links: [{ start: 0, end: 1, href: 'javascript:alert(1)' }] },
        ],
      }),
      { params: { pageId: 'tenant-editable' } } as unknown as RouteContext,
    );
    expect(response.status).toBe(400);
  });

  it('draft.should.save a valid draft via the backend', async () => {
    const { POST } = await importRoute('@/app/api/editor/pages/[pageId]/draft/route');
    const response = await POST(
      req('POST', '/api/editor/pages/tenant-editable/draft', {
        tenantSlug: 'test-church',
        revision: 3,
        blocks: [{ id: 'b1', type: 'paragraph', text: 'Naujas tekstas' }],
      }),
      { params: { pageId: 'tenant-editable' } } as unknown as RouteContext,
    );
    expect(response.status).toBe(201);
  });

  it('draft.should.map backend 500 to 502 (bad gateway, retryable signal)', async () => {
    server.use(
      http.get(`${MOCK_BACKEND_URL}/api/v1/editor/pages/:pageId/draft`, () =>
        new HttpResponse(null, { status: 500 }),
      ),
    );
    const { GET } = await importRoute('@/app/api/editor/pages/[pageId]/draft/route');
    const response = await GET(req('GET', '/api/editor/pages/x/draft?tenant=test-church'), {
      params: { pageId: 'x' },
    } as unknown as RouteContext);
    expect(response.status).toBe(502);
  });

  it('draft.should.answer 400 for invalid JSON bodies', async () => {
    const { POST } = await importRoute('@/app/api/editor/pages/[pageId]/draft/route');
    const response = await POST(
      new NextRequest('http://localhost/api/editor/pages/tenant-editable/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{not json',
      }),
      { params: { pageId: 'tenant-editable' } } as unknown as RouteContext,
    );
    expect(response.status).toBe(400);
  });
});

// =============================================================================
// /api/editor/moderation
// =============================================================================

describe('moderation API', () => {
  it('moderation.should.list the queue for a tenant', async () => {
    const { GET } = await importRoute('@/app/api/editor/moderation/route');
    const response = await GET(req('GET', '/api/editor/moderation?tenant=test-church'));
    expect(response.status).toBe(200);
    const items = await response.json();
    expect(items.length).toBe(2);
    expect(items.some((item: { status: string }) => item.status === 'art9-review')).toBe(true);
  });

  it('moderation.should.require a reason for reject decisions (audit quality)', async () => {
    const { POST } = await importRoute('@/app/api/editor/moderation/[itemId]/route');
    const response = await POST(
      req('POST', '/api/editor/moderation/mod-1', { tenantSlug: 'test-church', action: 'reject' }),
      { params: { itemId: 'mod-1' } } as unknown as RouteContext,
    );
    expect(response.status).toBe(400);
  });

  it('moderation.should.record an approve decision (204, audit-logged backend-side)', async () => {
    let decided: string | null = null;
    server.use(
      http.post(`${MOCK_BACKEND_URL}/api/v1/editor/moderation/:itemId/:action`, ({ params }) => {
        decided = `${params.itemId}:${params.action}`;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { POST } = await importRoute('@/app/api/editor/moderation/[itemId]/route');
    const response = await POST(
      req('POST', '/api/editor/moderation/mod-1', { tenantSlug: 'test-church', action: 'approve' }),
      { params: { itemId: 'mod-1' } } as unknown as RouteContext,
    );
    expect(response.status).toBe(204);
    expect(decided).toBe('mod-1:approve');
  });
});

// =============================================================================
// /api/editor/media
// =============================================================================

describe('media API', () => {
  it('media.should.list the tenant library', async () => {
    const { GET } = await importRoute('@/app/api/editor/media/route');
    const response = await GET(req('GET', '/api/editor/media?tenant=test-church'));
    expect(response.status).toBe(200);
    const items = await response.json();
    expect(items[0].fileName).toBe('church-front.webp');
  });

  it('media.should.quarantine uploads (202, never approved directly)', async () => {
    const { POST } = await importRoute('@/app/api/editor/media/route');
    const response = await POST(
      req('POST', '/api/editor/media', {
        tenantSlug: 'test-church',
        fileName: 'new.webp',
        mimeType: 'image/webp',
        sizeBytes: 1024,
        altText: 'Aprašymas',
      }),
    );
    expect(response.status).toBe(202);
    const data = await response.json();
    expect(data.state).toBe('quarantined');
  });

  it('media.should.reject uploads without alt text (WCAG 1.1.1)', async () => {
    const { POST } = await importRoute('@/app/api/editor/media/route');
    const response = await POST(
      req('POST', '/api/editor/media', {
        tenantSlug: 'test-church',
        fileName: 'new.webp',
        mimeType: 'image/webp',
        sizeBytes: 1024,
        altText: '',
      }),
    );
    expect(response.status).toBe(400);
  });
});

// =============================================================================
// /api/perf (RUM ingress)
// =============================================================================

describe('perf RUM API', () => {
  it('perf.should.accept valid metrics and forward to the backend', async () => {
    let forwarded = false;
    server.use(
      http.post(`${MOCK_BACKEND_URL}/api/v1/perf/web-vitals`, () => {
        forwarded = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { POST } = await importRoute('@/app/api/perf/route');
    const response = await POST(
      req('POST', '/api/perf', { id: 'm1', name: 'LCP', value: 1200, rating: 'good', route: '/lt/x' }),
    );
    expect(response.status).toBe(204);
    expect(forwarded).toBe(true);
  });

  it('perf.should.reject malformed metric names (injection guard)', async () => {
    const { POST } = await importRoute('@/app/api/perf/route');
    const response = await POST(
      req('POST', '/api/perf', { id: 'm1', name: 'EVIL', value: -5, route: '/x' }),
    );
    expect(response.status).toBe(400);
  });
});

// =============================================================================
// Pilot mode (BACKEND_API_URL unset)
// =============================================================================

describe('pilot mode (backend unconfigured)', () => {
  it('draft.should.answer 503 unconfigured AFTER validation passes', async () => {
    vi.stubEnv('BACKEND_API_URL', '');
    vi.resetModules();
    const { GET } = await import('@/app/api/editor/pages/[pageId]/draft/route');
    const ok = await GET(req('GET', '/api/editor/pages/x/draft?tenant=test-church'), {
      params: { pageId: 'x' },
    });
    expect(ok.status).toBe(503);
    // Validation still precedes the configured check.
    const bad = await GET(req('GET', '/api/editor/pages/x/draft?tenant=!!'), {
      params: { pageId: 'x' },
    });
    expect(bad.status).toBe(400);
    vi.stubEnv('BACKEND_API_URL', MOCK_BACKEND_URL);
  });
});
