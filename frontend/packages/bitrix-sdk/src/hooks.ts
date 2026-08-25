/**
 * CRM React hooks — STEP 9.
 *
 * Client-side data access for the hub-backed CRM surface. All hooks resolve
 * their {@link CrmBackendClient} from (in order) the explicit option, then
 * the client registered via {@link provideCrmClient}. With NO client
 * registered (pilot), every hook reports `available: false` and fetches
 * nothing — components render their "CRM not configured" state.
 *
 * Polling: `pollIntervalMs` supports the pilot real-time strategy (the
 * backend receives Bitrix24 webhooks; the frontend polls — 30s acceptable).
 *
 * These hooks live in the SDK (spec) but use only React primitives; the SDK
 * declares `react` as a peer dependency. No JSX here keeps the package .ts.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { CrmBackendClient, type CrmApiError, type CrmResult } from './backend-client';
import type {
  CreateLeadPayload,
  CreateLeadResult,
  CrmEntityType,
  Deal,
  Lead,
  Task,
} from './crm-types';

// -----------------------------------------------------------------------------
// CLIENT REGISTRY
// -----------------------------------------------------------------------------

let registeredClient: CrmBackendClient | null = null;

/** Register the default CRM client used by hooks that get none explicitly. */
export function provideCrmClient(client: CrmBackendClient | null): void {
  registeredClient = client;
}

function resolveClient(explicit?: CrmBackendClient): CrmBackendClient | null {
  return explicit ?? registeredClient;
}

// -----------------------------------------------------------------------------
// SHARED QUERY STATE
// -----------------------------------------------------------------------------

export interface CrmQueryState<T> {
  /** False when no client is configured (pilot) — render a quiet notice. */
  available: boolean;
  data: T | null;
  loading: boolean;
  error: CrmApiError | null;
  reload: () => void;
}

export interface CrmQueryOptions {
  tenantSlug: string;
  client?: CrmBackendClient;
  /** Optional polling interval (ms) for webhook-driven freshness. */
  pollIntervalMs?: number;
}

function useCrmQuery<T>(
  fetcher: (client: CrmBackendClient) => Promise<CrmResult<T>>,
  options: CrmQueryOptions,
  deps: readonly unknown[],
): CrmQueryState<T> {
  const client = resolveClient(options.client);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<CrmApiError | null>(null);
  const [nonce, setNonce] = useState(0);

  // Keep the latest fetcher without re-triggering effects on identity changes.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!client) return;
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      const result = await fetcherRef.current(client);
      if (cancelled) return;
      setLoading(false);
      if (result.ok) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
    };

    void run();
    const interval =
      options.pollIntervalMs && options.pollIntervalMs > 0
        ? setInterval(() => void run(), options.pollIntervalMs)
        : null;

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, nonce, ...deps]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  return { available: client !== null, data, loading, error, reload };
}

// -----------------------------------------------------------------------------
// HOOKS (spec: useCrmLead, useCrmDeals, useCrmTasks, useCreateLead)
// -----------------------------------------------------------------------------

/** Simple in-memory lead cache keyed by `tenant::id` (spec: fetch and cache). */
const leadCache = new Map<string, Lead>();

/** Fetch and cache a single lead. */
export function useCrmLead(id: string | undefined, options: CrmQueryOptions): CrmQueryState<Lead> {
  const cacheKey = id ? `${options.tenantSlug}::${id}` : undefined;
  return useCrmQuery<Lead>(
    async (client) => {
      if (!id) return { ok: false, error: { kind: 'validation', message: 'No lead id.', retryable: false } };
      const cached = leadCache.get(`${options.tenantSlug}::${id}`);
      if (cached) return { ok: true, data: cached };
      const result = await client.getLead(options.tenantSlug, id);
      if (result.ok && cacheKey) leadCache.set(cacheKey, result.data);
      return result;
    },
    options,
    [id, options.tenantSlug],
  );
}

/** Fetch a tenant's deals (dashboard / pipeline). Supports polling. */
export function useCrmDeals(tenantSlug: string, options?: Omit<CrmQueryOptions, 'tenantSlug'>): CrmQueryState<Deal[]> {
  return useCrmQuery<Deal[]>(
    (client) => client.getDeals(tenantSlug),
    { tenantSlug, ...options },
    [tenantSlug],
  );
}

/** Fetch recent leads for a tenant (LeadTracker). Supports polling. */
export function useCrmLeads(tenantSlug: string, options?: Omit<CrmQueryOptions, 'tenantSlug'>): CrmQueryState<Lead[]> {
  return useCrmQuery<Lead[]>(
    (client) => client.getLeads(tenantSlug),
    { tenantSlug, ...options },
    [tenantSlug],
  );
}

/** Fetch tasks attached to an entity. */
export function useCrmTasks(
  entityType: CrmEntityType,
  entityId: string | undefined,
  options: CrmQueryOptions,
): CrmQueryState<Task[]> {
  return useCrmQuery<Task[]>(
    (client) =>
      entityId
        ? client.getTasks(options.tenantSlug, entityType, entityId)
        : Promise.resolve({
            ok: false as const,
            error: { kind: 'validation' as const, message: 'No entity id.', retryable: false },
          }),
    options,
    [entityType, entityId, options.tenantSlug],
  );
}

export interface UseCreateLeadResult {
  create: (payload: CreateLeadPayload) => Promise<CrmResult<CreateLeadResult>>;
  submitting: boolean;
  error: CrmApiError | null;
  reset: () => void;
}

/** Mutation hook for lead creation (contact forms). */
export function useCreateLead(options?: { client?: CrmBackendClient }): UseCreateLeadResult {
  const client = resolveClient(options?.client);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<CrmApiError | null>(null);

  const create = useCallback(
    async (payload: CreateLeadPayload): Promise<CrmResult<CreateLeadResult>> => {
      if (!client) {
        return {
          ok: false,
          error: { kind: 'unconfigured', message: 'CRM is not configured.', retryable: false },
        };
      }
      setSubmitting(true);
      setError(null);
      const result = await client.createLead(payload);
      setSubmitting(false);
      if (!result.ok) setError(result.error);
      return result;
    },
    [client],
  );

  const reset = useCallback(() => setError(null), []);

  return { create, submitting, error, reset };
}
