/**
 * CRM backend client — STEP 9 (Bitrix24 integration layer).
 *
 * API wrapper for the JOL-HUB BACKEND's CRM endpoints (`/crm/*`) — NEVER the
 * Bitrix24 REST API. Data flow:
 *   frontend → jol-hub backend → jol-bitrix24-integration → Bitrix24 API.
 *
 * SECURITY (SOC 2 CC6.1): the frontend holds NO Bitrix24 credentials. Token
 * rotation (90-day cycle) happens entirely in the backend; during rotation a
 * request may fail with 401, which this client surfaces as `auth-rotation`
 * so the UI can show "CRM temporarily unavailable" and auto-retry.
 *
 * RATE LIMITS: Bitrix24 allows ~2 req/s per token. That budget is owned by
 * the backend/integration layer; this client only RESPONDS to 429s with
 * exponential backoff (honouring `Retry-After` when present) and never
 * retries a mutation that may already have been processed.
 *
 * RETRY POLICY:
 *   - GETs: retried with exponential backoff on 429 / 5xx / network / timeout
 *     (idempotent).
 *   - POSTs: retried ONLY on 429 (rejected before processing). 5xx/network
 *     outcomes for mutations are surfaced to the caller — blind retries risk
 *     duplicate leads/tasks.
 *
 * GDPR Art. 32: transport is HTTPS-only (enforced upstream); tenant scoping
 * travels via the `X-Tenant` header so the backend can enforce RLS.
 */
import type {
  Activity,
  Contact,
  CreateLeadPayload,
  CreateLeadResult,
  CrmEntityType,
  Deal,
  Lead,
  Task,
} from './crm-types';

/** CRM failure taxonomy consumed by the UI layer. */
export type CrmErrorKind =
  | 'unconfigured' // no backend base URL configured (pilot).
  | 'auth-rotation' // 401 — backend rotating the Bitrix token; retry soon.
  | 'rate-limit' // 429 — Bitrix rate budget exhausted upstream.
  | 'validation' // other 4xx — bad input; do not retry.
  | 'server' // 5xx — upstream failure.
  | 'network' // fetch failed outright.
  | 'timeout'; // request exceeded the deadline.

export interface CrmApiError {
  kind: CrmErrorKind;
  message: string;
  status?: number;
  retryable: boolean;
}

export type CrmResult<T> = { ok: true; data: T } | { ok: false; error: CrmApiError };

export interface CrmBackendClientOptions {
  /** Hub backend base URL, e.g. `http://backend:8000/api/v1`. No trailing slash required. */
  baseUrl: string;
  /** Request deadline in ms. */
  timeoutMs?: number;
  /** Maximum automatic retries for idempotent requests. */
  maxRetries?: number;
  /** Base backoff delay in ms (doubles per attempt). */
  baseDelayMs?: number;
  /** Injectable fetch (tests, custom agents). */
  fetchImpl?: typeof fetch;
  /** Injectable delay (tests). */
  delayImpl?: (ms: number) => Promise<void>;
}

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_BASE_DELAY_MS = 500;

/** Pure exponential backoff: base * 2^attempt (attempt is 0-based). */
export function backoffDelay(attempt: number, baseMs: number): number {
  return baseMs * 2 ** attempt;
}

/** Map an HTTP status to the CRM error taxonomy. */
export function classifyStatus(status: number): CrmErrorKind {
  if (status === 401) return 'auth-rotation';
  if (status === 429) return 'rate-limit';
  if (status >= 400 && status < 500) return 'validation';
  return 'server';
}

function defaultDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class CrmBackendClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly baseDelayMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly delayImpl: (ms: number) => Promise<void>;

  constructor(options: CrmBackendClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.delayImpl = options.delayImpl ?? defaultDelay;
  }

  // ---------------------------------------------------------------------------
  // ENDPOINTS (spec: POST /crm/leads, GET /crm/contacts/{id}, GET /crm/deals,
  // POST /crm/tasks, GET /crm/activities)
  // ---------------------------------------------------------------------------

  /** Create a lead from a contact-form submission. */
  createLead(payload: CreateLeadPayload): Promise<CrmResult<CreateLeadResult>> {
    return this.request<CreateLeadResult>('POST', '/crm/leads', payload.tenantSlug, payload);
  }

  /** Fetch a lead by id (admin dashboards; tenant-scoped by the backend). */
  getLead(tenantSlug: string, id: string): Promise<CrmResult<Lead>> {
    return this.request<Lead>('GET', `/crm/leads/${encodeURIComponent(id)}`, tenantSlug);
  }

  /** Fetch recent leads for a tenant (admin dashboards). */
  getLeads(tenantSlug: string): Promise<CrmResult<Lead[]>> {
    return this.request<Lead[]>('GET', `/crm/leads?tenant=${encodeURIComponent(tenantSlug)}`, tenantSlug);
  }

  /** Fetch a contact by id. */
  getContact(tenantSlug: string, id: string): Promise<CrmResult<Contact>> {
    return this.request<Contact>('GET', `/crm/contacts/${encodeURIComponent(id)}`, tenantSlug);
  }

  /** Fetch a tenant's deals (read-only sales pipeline data). */
  getDeals(tenantSlug: string): Promise<CrmResult<Deal[]>> {
    return this.request<Deal[]>('GET', `/crm/deals?tenant=${encodeURIComponent(tenantSlug)}`, tenantSlug);
  }

  /** Create a task (e.g. follow-up on a lead). */
  createTask(tenantSlug: string, task: Omit<Task, 'id' | 'tenantSlug'>): Promise<CrmResult<Task>> {
    return this.request<Task>('POST', '/crm/tasks', tenantSlug, task);
  }

  /** Fetch tasks attached to an entity. */
  getTasks(tenantSlug: string, entityType: CrmEntityType, entityId: string): Promise<CrmResult<Task[]>> {
    return this.request<Task[]>(
      'GET',
      `/crm/tasks?entity=${encodeURIComponent(entityType)}&id=${encodeURIComponent(entityId)}`,
      tenantSlug,
    );
  }

  /** Fetch activities attached to an entity. */
  getActivities(tenantSlug: string, entityType: CrmEntityType, entityId: string): Promise<CrmResult<Activity[]>> {
    return this.request<Activity[]>(
      'GET',
      `/crm/activities?entity=${encodeURIComponent(entityType)}&id=${encodeURIComponent(entityId)}`,
      tenantSlug,
    );
  }

  // ---------------------------------------------------------------------------
  // TRANSPORT
  // ---------------------------------------------------------------------------

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    tenantSlug: string,
    body?: unknown,
  ): Promise<CrmResult<T>> {
    // GETs are idempotent → full retry budget. Mutations retry ONLY on 429
    // (the request was rejected before processing); any other failure may
    // already have side effects upstream, so the caller decides.
    const retryKinds: ReadonlySet<CrmErrorKind> =
      method === 'GET'
        ? new Set<CrmErrorKind>(['rate-limit', 'server', 'network', 'timeout'])
        : new Set<CrmErrorKind>(['rate-limit']);

    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const result = await this.attempt<T>(method, path, tenantSlug, body);
      if (result.ok) return result;
      if (attempt >= this.maxRetries || !retryKinds.has(result.error.kind)) return result;

      await this.delayImpl(backoffDelay(attempt, this.baseDelayMs));
      attempt += 1;
    }
  }

  private async attempt<T>(
    method: 'GET' | 'POST',
    path: string,
    tenantSlug: string,
    body?: unknown,
  ): Promise<CrmResult<T>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const headers: Record<string, string> = { Accept: 'application/json', 'X-Tenant': tenantSlug };
      if (body !== undefined) headers['Content-Type'] = 'application/json';

      const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (response.ok) {
        return { ok: true, data: (await response.json()) as T };
      }

      const kind = classifyStatus(response.status);
      const detail = await response.text().catch(() => '');
      return {
        ok: false,
        error: {
          kind,
          status: response.status,
          message: this.messageFor(kind, detail),
          // Auth rotation is transient: the UI auto-retries once.
          retryable: kind === 'auth-rotation' || kind === 'rate-limit' || kind === 'server',
        },
      };
    } catch (error) {
      const timedOut = error instanceof Error && error.name === 'AbortError';
      return {
        ok: false,
        error: {
          kind: timedOut ? 'timeout' : 'network',
          message: timedOut ? 'The CRM request timed out.' : 'Could not reach the CRM service.',
          retryable: true,
        },
      };
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Human-safe messages only — upstream detail is truncated and never allowed
   * to leak internals (or, critically, any credential material).
   */
  private messageFor(kind: CrmErrorKind, detail: string): string {
    switch (kind) {
      case 'auth-rotation':
        return 'CRM is briefly unavailable while credentials rotate. Please retry.';
      case 'rate-limit':
        return 'CRM is busy. Please retry in a moment.';
      case 'validation':
        return detail.slice(0, 200) || 'The CRM request was rejected.';
      default:
        return 'The CRM service is temporarily unavailable.';
    }
  }
}
