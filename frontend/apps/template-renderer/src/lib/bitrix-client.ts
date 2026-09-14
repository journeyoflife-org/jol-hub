/**
 * CRM client binding — STEP 9.
 *
 * SERVER-ONLY instantiation of the hub-backed CRM client
 * (`@jol-hub/bitrix-sdk` → `CrmBackendClient`). The base URL comes from
 * `BACKEND_API_URL` (same convention as `lib/content-api.ts`) and NEVER
 * leaves the server: browser code talks to the same-origin
 * `/api/crm/*` route handlers, which forward through this client.
 *
 * SECURITY (SOC 2 CC6.1 / STEP 9 rules):
 *   - No Bitrix24 tokens exist anywhere in this path — the backend owns the
 *     90-day rotation; the frontend only ever sees hub-backend responses.
 *   - Never import this module from a client component.
 *
 * Pilot mode: with no `BACKEND_API_URL` configured, {@link isCrmConfigured}
 * is false and callers render quiet "CRM not configured" behaviour.
 */
import { CrmBackendClient } from '@jol-hub/bitrix-sdk';

const BACKEND_API_URL = process.env.BACKEND_API_URL;

/** True when the CRM backend path is configured (pilot: false). */
export function isCrmConfigured(): boolean {
  return Boolean(BACKEND_API_URL);
}

/**
 * The server-side CRM client, or null in pilot mode. Throws if used without
 * configuration — callers must check {@link isCrmConfigured} first.
 */
export function serverCrmClient(): CrmBackendClient | null {
  if (!BACKEND_API_URL) return null;
  return new CrmBackendClient({ baseUrl: `${BACKEND_API_URL}/api/v1` });
}
