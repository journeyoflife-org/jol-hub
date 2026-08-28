/**
 * Mock backend API — STEP 15 (MSW handlers for integration tests).
 *
 * Deterministic canned responses for the hub-backend surfaces the renderer
 * proxies to (editor, CRM, perf). Tests NEVER hit a real backend: MSW
 * intercepts at the network layer (node), matching the integration-test
 * spec ("mock external APIs").
 *
 * The base URL is a reserved test host — the route modules read
 * `BACKEND_API_URL`, which tests stub to this origin before import.
 */
import { http, HttpResponse } from 'msw';

export const MOCK_BACKEND_URL = 'http://backend.test';

/** Canned draft response (revision 3, two blocks, one history entry). */
export const MOCK_DRAFT = {
  pageId: 'tenant-editable',
  blocks: [
    { id: 'seed-1', type: 'heading', text: 'Sveiki atvykę' },
    { id: 'seed-2', type: 'paragraph', text: 'Parapijos naujienos.' },
  ],
  revision: 3,
  updatedAt: '2026-01-15T10:00:00.000Z',
  history: [
    {
      revision: 2,
      blocks: [{ id: 'seed-1', type: 'heading', text: 'Sveiki' }],
      savedAt: '2026-01-14T09:00:00.000Z',
      savedBy: 'editor@example.com',
    },
  ],
};

export const MOCK_MODERATION_QUEUE = [
  {
    id: 'mod-1',
    tenantSlug: 'test-church',
    type: 'page-edit',
    status: 'pending',
    submittedBy: 'editor@example.com',
    submittedAt: '2026-01-16T08:00:00.000Z',
    pageId: 'tenant-editable',
    pagePath: '/about',
    before: [{ id: 'seed-1', type: 'heading', text: 'Sveiki' }],
    after: [{ id: 'seed-1', type: 'heading', text: 'Sveiki atvykę' }],
    ai: {
      approved: true,
      flags: [],
      model: 'llm-prod-lt01/moderation-v1',
      completedAt: '2026-01-16T08:01:00.000Z',
    },
    scan: { clean: null },
  },
  {
    id: 'mod-2',
    tenantSlug: 'test-church',
    type: 'media-upload',
    status: 'art9-review',
    submittedAt: '2026-01-16T08:30:00.000Z',
    mediaId: 'media-9',
    fileName: 'procession.jpg',
    ai: {
      approved: false,
      flags: [
        {
          category: 'art9-sensitive-content',
          severity: 'medium',
          reasoning: 'Religious ceremony with identifiable attendees.',
        },
      ],
    },
    scan: { clean: true, engine: 'clamav' },
  },
];

export const MOCK_MEDIA_LIBRARY = [
  {
    id: 'media-1',
    tenantSlug: 'test-church',
    fileName: 'church-front.webp',
    mimeType: 'image/webp',
    sizeBytes: 204_800,
    altText: 'Bažnyčios fasadas',
    state: 'approved',
    uploadedAt: '2026-01-10T12:00:00.000Z',
  },
];

/**
 * Default MSW handlers — happy path. Individual tests override specific
 * routes via `server.use(...)` (MSW request-handler precedence).
 */
export const backendHandlers = [
  http.get(`${MOCK_BACKEND_URL}/api/v1/editor/pages/:pageId/draft`, () =>
    HttpResponse.json(MOCK_DRAFT),
  ),
  http.post(`${MOCK_BACKEND_URL}/api/v1/editor/pages/:pageId/draft`, () =>
    HttpResponse.json(MOCK_DRAFT, { status: 201 }),
  ),
  http.post(`${MOCK_BACKEND_URL}/api/v1/editor/pages/:pageId/publish`, () =>
    HttpResponse.json({ itemId: 'mod-1' }, { status: 202 }),
  ),
  http.get(`${MOCK_BACKEND_URL}/api/v1/editor/moderation-queue`, () =>
    HttpResponse.json(MOCK_MODERATION_QUEUE),
  ),
  http.post(`${MOCK_BACKEND_URL}/api/v1/editor/moderation/:itemId/:action`, () =>
    new HttpResponse(null, { status: 204 }),
  ),
  http.get(`${MOCK_BACKEND_URL}/api/v1/editor/media/library`, () =>
    HttpResponse.json(MOCK_MEDIA_LIBRARY),
  ),
  http.post(`${MOCK_BACKEND_URL}/api/v1/editor/media/upload`, () =>
    HttpResponse.json({ ...MOCK_MEDIA_LIBRARY[0], id: 'media-new', state: 'quarantined' }, { status: 202 }),
  ),
  http.post(`${MOCK_BACKEND_URL}/api/v1/perf/web-vitals`, () =>
    new HttpResponse(null, { status: 204 }),
  ),
];
