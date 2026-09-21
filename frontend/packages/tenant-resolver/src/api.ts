/**
 * Tenant API client — fetches from GET /api/v1/tenants/ with LRU cache
 * and circuit-breaker for resilience.
 *
 * Wave 1 Task 2: API becomes source of truth; fixtures remain fallback.
 *
 * Design:
 * - LRU cache (5 min TTL) avoids per-request API calls
 * - Circuit-breaker: 3 consecutive failures → open for 60s
 * - Returns null on any failure → caller falls back to fixtures
 * - No mTLS at fetch level (handled at ingress/nginx)
 *
 * SECURITY: This module is server-only. Never import in client components.
 */
import { LruCache } from './lru';

/** API response shape — must match backend TenantListView. */
export interface ApiTenant {
  slug: string;
  name: { lt: string; en: string };
  vertical: string;
  locale: string;
  schema: string;
  domain: string | null;
  country: string;
}

/** Configuration from environment. */
const TENANT_API_URL = process.env.BACKEND_API_URL ?? null;
const API_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CIRCUIT_BREAK_THRESHOLD = 3;
const CIRCUIT_RESET_MS = 60 * 1000; // 60 seconds

/** Response cache — single entry keyed by 'tenants'. */
const apiCache = new LruCache<ApiTenant[]>(1, API_CACHE_TTL_MS);

/** Circuit-breaker state (module-level singleton). */
let circuitOpen = false;
let circuitResetAt = 0;
let failureCount = 0;

/** Test/ops hook: reset circuit-breaker state. */
export function resetCircuitBreaker(): void {
  circuitOpen = false;
  circuitResetAt = 0;
  failureCount = 0;
}

/** Test/ops hook: clear API cache. */
export function clearApiCache(): void {
  apiCache.clear();
}

/** Test/ops hook: inject a custom fetch implementation. */
let fetchImpl: typeof globalThis.fetch = globalThis.fetch;
export function setFetchImpl(impl: typeof globalThis.fetch): void {
  fetchImpl = impl;
}

/**
 * Fetch tenants from the backend API.
 *
 * Returns null if:
 * - BACKEND_API_URL is not configured
 * - Circuit-breaker is open
 * - API returns non-2xx
 * - Network error
 *
 * On success, caches the response for 5 minutes.
 */
export async function fetchTenantsFromAPI(): Promise<ApiTenant[] | null> {
  if (!TENANT_API_URL) return null;

  // Circuit-breaker check
  if (circuitOpen) {
    if (Date.now() < circuitResetAt) return null;
    // Reset period elapsed — try again
    circuitOpen = false;
    failureCount = 0;
  }

  // Cache hit
  const cached = apiCache.get('tenants');
  if (cached !== undefined) return cached;

  try {
    const response = await fetchImpl(`${TENANT_API_URL}/api/v1/tenants/`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    if (!response.ok) {
      throw new Error(`Tenant API returned ${response.status}`);
    }

    const tenants: ApiTenant[] = await response.json();
    apiCache.set('tenants', tenants);
    failureCount = 0;
    return tenants;
  } catch (error) {
    failureCount++;
    if (failureCount >= CIRCUIT_BREAK_THRESHOLD) {
      circuitOpen = true;
      circuitResetAt = Date.now() + CIRCUIT_RESET_MS;
      console.warn(
        `[tenant-resolver] API circuit-breaker open after ${failureCount} failures, ` +
        `falling back to fixtures for ${CIRCUIT_RESET_MS / 1000}s`
      );
    }
    return null;
  }
}

/** Whether the API source is configured. */
export function isApiConfigured(): boolean {
  return TENANT_API_URL !== null;
}
