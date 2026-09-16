/**
 * Editor client binding — STEP 14 (SERVER-ONLY).
 *
 * Instantiates the hub-backed editor client (`EditorApiClient`) with
 * `BACKEND_API_URL` (same convention as `lib/content-api.ts` /
 * `lib/bitrix-client.ts`). The base URL and service token NEVER leave the
 * server: the browser only ever talks to the same-origin `/api/editor/*`
 * proxies.
 *
 * SECURITY (SOC 2 CC6.1 / GDPR Art. 9): AI moderation (Ollama/RAG) and
 * malware scanning live behind this boundary — the frontend has no LLM or
 * scanner credentials. Never import this module from a client component.
 *
 * Pilot mode: with no `BACKEND_API_URL`, {@link isEditorConfigured} is
 * false and proxies answer 503 `unconfigured` (validation errors still
 * return 400 first).
 */
import { EditorApiClient } from '@/lib/editor/editor-api';

const BACKEND_API_URL = process.env.BACKEND_API_URL;
const BACKEND_SERVICE_TOKEN = process.env.BACKEND_SERVICE_TOKEN;

/** True when the editor backend path is configured. */
export function isEditorConfigured(): boolean {
  return Boolean(BACKEND_API_URL);
}

/** The server-side editor client, or null in pilot mode. */
export function serverEditorClient(): EditorApiClient | null {
  if (!BACKEND_API_URL) return null;
  return new EditorApiClient({
    baseUrl: BACKEND_API_URL,
    serviceToken: BACKEND_SERVICE_TOKEN || undefined,
  });
}
