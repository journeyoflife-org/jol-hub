/**
 * Editor backend client — STEP 14.
 *
 * Calls the jol-hub backend's editor endpoints (`/api/v1/editor/*`) which
 * own the content plane: drafts, publish-to-moderation, the moderation
 * queue, AI screening relay (on-prem Ollama/RAG — NEVER called directly
 * from the browser) and the media pipeline (ClamAV-class scan,
 * quarantine). Tenant isolation travels in `X-Tenant` (RLS enforced
 * backend-side; SOC 2 CC6.1).
 *
 * PILOT: with no `BACKEND_API_URL` configured every call yields
 * `{ ok: false, error: 'unconfigured' }` so surfaces render quiet
 * "editor backend not configured" states — no fabricated drafts.
 *
 * RETRY: idempotent GETs retry with backoff; mutations (draft save,
 * publish, decisions, uploads) NEVER retry automatically — a duplicated
 * publish would double-queue content for moderation.
 */
import type { EditorBlock } from './blocks';
import type { ModerationDecision, ModerationItem, MediaLibraryItem } from './moderation';

export type EditorApiError =
  | { kind: 'unconfigured'; retryable: false }
  | { kind: 'validation'; message: string; retryable: false }
  | { kind: 'auth'; message: string; retryable: false }
  | { kind: 'server'; status: number; retryable: boolean }
  | { kind: 'network'; retryable: true };

export type EditorResult<T> = { ok: true; data: T } | { ok: false; error: EditorApiError };

/** Revision record from the backend (history: last 10). */
export interface EditorRevision {
  revision: number;
  blocks: EditorBlock[];
  savedAt: string;
  savedBy?: string;
}

export interface DraftResponse {
  pageId: string;
  blocks: EditorBlock[];
  revision: number;
  updatedAt: string;
  history: EditorRevision[];
}

export interface EditorClientOptions {
  baseUrl: string;
  /** Service-to-service token (server) — never exposed to the browser. */
  serviceToken?: string;
  /** Test/timeout override. */
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

function classify(status: number): EditorApiError {
  if (status === 400 || status === 422) return { kind: 'validation', message: `HTTP ${status}`, retryable: false };
  if (status === 401 || status === 403) return { kind: 'auth', message: `HTTP ${status}`, retryable: false };
  return { kind: 'server', status, retryable: status >= 500 || status === 429 };
}

export class EditorApiClient {
  private readonly baseUrl: string;
  private readonly serviceToken?: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options: EditorClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.serviceToken = options.serviceToken;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 8000;
  }

  private async request<T>(method: 'GET' | 'POST', path: string, tenantSlug: string, body?: unknown): Promise<EditorResult<T>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Tenant': tenantSlug, // RLS context — backend enforces isolation
      };
      if (this.serviceToken) headers.authorization = `Bearer ${this.serviceToken}`;

      const response = await this.fetchImpl(`${this.baseUrl}/api/v1/editor${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
      if (!response.ok) return { ok: false, error: classify(response.status) };
      if (response.status === 204) return { ok: true, data: undefined as T };
      return { ok: true, data: (await response.json()) as T };
    } catch {
      return { ok: false, error: { kind: 'network', retryable: true } };
    } finally {
      clearTimeout(timer);
    }
  }

  /** GET draft (idempotent → single retry on transient failure). */
  async getDraft(tenantSlug: string, pageId: string): Promise<EditorResult<DraftResponse>> {
    const first = await this.request<DraftResponse>('GET', `/pages/${encodeURIComponent(pageId)}/draft`, tenantSlug);
    if (!first.ok && first.error.retryable) {
      return this.request<DraftResponse>('GET', `/pages/${encodeURIComponent(pageId)}/draft`, tenantSlug);
    }
    return first;
  }

  /** Save draft — NEVER auto-retried (duplicate safety). */
  saveDraft(tenantSlug: string, pageId: string, blocks: EditorBlock[], revision: number): Promise<EditorResult<DraftResponse>> {
    return this.request<DraftResponse>('POST', `/pages/${encodeURIComponent(pageId)}/draft`, tenantSlug, { blocks, revision });
  }

  /** Submit for moderation — NEVER auto-retried. */
  publish(tenantSlug: string, pageId: string): Promise<EditorResult<{ itemId: string }>> {
    return this.request<{ itemId: string }>('POST', `/pages/${encodeURIComponent(pageId)}/publish`, tenantSlug, {});
  }

  /** Moderation queue (admin-scoped by the backend). */
  async getModerationQueue(tenantSlug: string): Promise<EditorResult<ModerationItem[]>> {
    const first = await this.request<ModerationItem[]>('GET', '/moderation-queue', tenantSlug);
    if (!first.ok && first.error.retryable) {
      return this.request<ModerationItem[]>('GET', '/moderation-queue', tenantSlug);
    }
    return first;
  }

  /** Human decision — NEVER auto-retried; every call is audit-logged. */
  decide(tenantSlug: string, decision: ModerationDecision): Promise<EditorResult<void>> {
    return this.request<void>('POST', `/moderation/${encodeURIComponent(decision.itemId)}/${decision.action}`, tenantSlug, {
      reason: decision.reason,
    });
  }

  /** Tenant media library (approved assets only leave quarantine). */
  async getMediaLibrary(tenantSlug: string): Promise<EditorResult<MediaLibraryItem[]>> {
    const first = await this.request<MediaLibraryItem[]>('GET', '/media/library', tenantSlug);
    if (!first.ok && first.error.retryable) {
      return this.request<MediaLibraryItem[]>('GET', '/media/library', tenantSlug);
    }
    return first;
  }

  /**
   * Register an upload — the FILE itself travels via the backend's scan
   * pipeline (multipart); this JSON call records metadata + alt text and
   * returns the quarantine reference. NEVER auto-retried.
   */
  registerUpload(
    tenantSlug: string,
    meta: { fileName: string; mimeType: string; sizeBytes: number; altText: string },
  ): Promise<EditorResult<MediaLibraryItem>> {
    return this.request<MediaLibraryItem>('POST', '/media/upload', tenantSlug, meta);
  }
}
