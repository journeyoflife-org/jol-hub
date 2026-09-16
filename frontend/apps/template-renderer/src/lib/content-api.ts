/**
 * Content API client — STEP 5 link: tenant → content.
 *
 * SERVER-ONLY. Fetches tenant content from the backend over the internal
 * Proxmox network (`BACKEND_API_URL`), propagating the RLS context:
 *
 *   X-Tenant-Schema: t_<id>          (ADR-001 — PostgreSQL schema + RLS)
 *   Authorization:   Bearer <token>  (service-to-service)
 *
 * Pilot mode: with no `BACKEND_API_URL` configured every fetch resolves to
 * `null`, and callers fall back to seed-data fixtures — the chain keeps
 * working end to end before the backend content service ships.
 *
 * Error taxonomy (callers map to UX):
 *   404 → ContentApiError('not-found')      → custom 404
 *   403 → ContentApiError('forbidden')      → subscription upgrade prompt
 *   5xx → ContentApiError('server-error')   → error page with retry
 *
 * Caching: Next.js data cache with per-content-type revalidation, plus an
 * in-flight request map for cross-call deduplication within a render pass.
 */
import type { Tenant } from '@jol-hub/tenant-resolver';
import {
  ContentBlockSchema,
  TenantPageSchema,
  type ContentBlock,
  type TenantPage,
} from '@jol-hub/seed-data';

/** Internal backend base URL (never a public origin). */
const BACKEND_API_URL = process.env.BACKEND_API_URL;
/** Service token for server-to-server auth. */
const BACKEND_SERVICE_TOKEN = process.env.BACKEND_SERVICE_TOKEN;

/** Revalidation windows per content type (seconds). */
const REVALIDATE = {
  page: 300,
  block: 600,
  // News is ISR (60s); events/services are time/commercial-sensitive and
  // fetch with no-store (rendered fresh per request — see RENDERING.md).
  news: 60,
} as const;

/** Dynamic collection kinds (STEP 6). */
export type CollectionKind = 'news' | 'events' | 'services';

export type ContentApiErrorKind = 'not-found' | 'forbidden' | 'server-error';

/** Typed fetch failure — callers decide the UX per `kind`. */
export class ContentApiError extends Error {
  constructor(
    public readonly kind: ContentApiErrorKind,
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ContentApiError';
  }
}

/** True when the backend content service is wired up. */
export function isContentApiConfigured(): boolean {
  return Boolean(BACKEND_API_URL);
}

/**
 * Request headers for backend calls. `x-tenant-schema` is the RLS context —
 * it only ever travels server-to-server and is never emitted to browsers.
 */
function backendHeaders(tenant: Tenant): Record<string, string> {
  const headers: Record<string, string> = {
    accept: 'application/json',
    'x-tenant-schema': tenant.schema,
    'x-tenant-id': tenant.slug,
  };
  if (BACKEND_SERVICE_TOKEN) {
    headers.authorization = `Bearer ${BACKEND_SERVICE_TOKEN}`;
  }
  return headers;
}

/** In-flight dedupe: identical concurrent GETs share one network request. */
const inflight = new Map<string, Promise<unknown>>();

async function fetchJson(url: string, init: RequestInit, key: string): Promise<unknown> {
  const pending = inflight.get(key);
  if (pending) return pending;

  const request = fetch(url, init).then(async (response) => {
    if (response.status === 404) {
      throw new ContentApiError('not-found', `Content not found: ${url}`, 404);
    }
    if (response.status === 403) {
      throw new ContentApiError('forbidden', `Content access denied: ${url}`, 403);
    }
    if (!response.ok) {
      throw new ContentApiError(
        'server-error',
        `Content backend error ${response.status}: ${url}`,
        response.status,
      );
    }
    return (await response.json()) as unknown;
  });

  inflight.set(key, request);
  try {
    return await request;
  } finally {
    inflight.delete(key);
  }
}

/** Tenant-relative route must be URL-safe inside a path segment list. */
function encodeRoute(route: string): string {
  return route
    .replace(/^\//, '')
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

/**
 * Fetch a page for a tenant route.
 * Returns `null` when the content service is not configured (pilot:
 * fixture fallback) — throws {@link ContentApiError} otherwise on failure.
 */
export async function fetchTenantPage(
  tenant: Tenant,
  route: string,
): Promise<TenantPage | null> {
  if (!BACKEND_API_URL) return null;

  const url = `${BACKEND_API_URL}/api/v1/tenants/${encodeURIComponent(tenant.slug)}/pages/${encodeRoute(route) || 'index'}`;
  const raw = await fetchJson(
    url,
    {
      headers: backendHeaders(tenant),
      next: { revalidate: REVALIDATE.page },
    },
    url,
  );

  const parsed = TenantPageSchema.safeParse(raw);
  if (!parsed.success) {
    // Malformed backend payload must never render as garbage — treat as 5xx.
    throw new ContentApiError('server-error', `Invalid page payload for ${tenant.slug}${route}`);
  }
  return parsed.data;
}

/**
 * Fetch a single content block by id.
 * Same contract as {@link fetchTenantPage} (null in pilot mode).
 */
export async function fetchTenantContentBlock(
  tenant: Tenant,
  blockId: string,
): Promise<ContentBlock | null> {
  if (!BACKEND_API_URL) return null;

  const url = `${BACKEND_API_URL}/api/v1/tenants/${encodeURIComponent(tenant.slug)}/content/${encodeURIComponent(blockId)}`;
  const raw = await fetchJson(
    url,
    {
      headers: backendHeaders(tenant),
      next: { revalidate: REVALIDATE.block },
    },
    url,
  );

  const parsed = ContentBlockSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ContentApiError('server-error', `Invalid block payload ${blockId} for ${tenant.slug}`);
  }
  return parsed.data;
}

/**
 * Fetch a dynamic collection (news / events / services).
 * Returns `null` when the content service is not configured (pilot) so the
 * caller renders an accessible empty state. News is ISR-cached (60s);
 * events/services are `no-store` (time- and price-sensitive).
 */
export async function fetchTenantCollection(
  tenant: Tenant,
  kind: CollectionKind,
): Promise<unknown[] | null> {
  if (!BACKEND_API_URL) return null;

  const url = `${BACKEND_API_URL}/api/v1/tenants/${encodeURIComponent(tenant.slug)}/collections/${kind}`;
  const init: RequestInit =
    kind === 'news'
      ? { headers: backendHeaders(tenant), next: { revalidate: REVALIDATE.news } }
      : { headers: backendHeaders(tenant), cache: 'no-store' };
  const raw = await fetchJson(url, init, url);
  return Array.isArray(raw) ? raw : [];
}

/**
 * Fetch a single collection item by slug (news article / event / service).
 * Same pilot contract as {@link fetchTenantCollection}.
 */
export async function fetchTenantCollectionItem(
  tenant: Tenant,
  kind: CollectionKind,
  slug: string,
): Promise<unknown | null> {
  if (!BACKEND_API_URL) return null;

  const url = `${BACKEND_API_URL}/api/v1/tenants/${encodeURIComponent(tenant.slug)}/collections/${kind}/${encodeURIComponent(slug)}`;
  const init: RequestInit =
    kind === 'news'
      ? { headers: backendHeaders(tenant), next: { revalidate: REVALIDATE.page } }
      : { headers: backendHeaders(tenant), cache: 'no-store' };
  return fetchJson(url, init, url);
}
