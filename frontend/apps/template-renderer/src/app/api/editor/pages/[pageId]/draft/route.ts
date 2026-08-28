/**
 * Draft endpoints — STEP 14: /api/editor/pages/[pageId]/draft (GET + POST).
 *
 * Same-origin proxy for the 10%-control draft surface. The browser never
 * sees the hub-backend URL; tenant isolation travels in X-Tenant (backend
 * RLS). POST bodies are re-validated here (zod block allowlist — disallowed
 * types like HTML/iframe/script are rejected at the edge).
 *
 * ORDERING: validation FIRST (400), then the configured check (503) — a
 * malformed draft is always a client error regardless of backend state.
 * RBAC: the /editor pages gate on the `editor` role; the backend re-checks
 * the caller's tenant role before persisting (SOC 2 CC6.1).
 */
import { NextResponse, type NextRequest } from 'next/server';
import { isEditorConfigured, serverEditorClient } from '@/lib/editor-client';
import { draftBodySchema } from '@/lib/editor/validation';

const PAGE_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;
const TENANT_SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

export async function GET(request: NextRequest, { params }: { params: { pageId: string } }) {
  if (!PAGE_ID_PATTERN.test(params.pageId)) {
    return NextResponse.json({ error: 'validation' }, { status: 400 });
  }
  const tenantSlug = request.nextUrl.searchParams.get('tenant') ?? '';
  if (!TENANT_SLUG_PATTERN.test(tenantSlug) || tenantSlug.length > 64) {
    return NextResponse.json({ error: 'validation' }, { status: 400 });
  }
  if (!isEditorConfigured()) {
    return NextResponse.json({ error: 'unconfigured' }, { status: 503 });
  }
  const client = serverEditorClient();
  if (!client) return NextResponse.json({ error: 'unconfigured' }, { status: 503 });

  const result = await client.getDraft(tenantSlug, params.pageId);
  if (!result.ok) {
    const status = result.error.kind === 'auth' ? 403 : result.error.kind === 'validation' ? 400 : 502;
    return NextResponse.json({ error: result.error.kind }, { status });
  }
  return NextResponse.json(result.data);
}

export async function POST(request: NextRequest, { params }: { params: { pageId: string } }) {
  if (!PAGE_ID_PATTERN.test(params.pageId)) {
    return NextResponse.json({ error: 'validation' }, { status: 400 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }
  const parsed = draftBodySchema.safeParse(raw);
  if (!parsed.success || parsed.data.tenantSlug.length === 0) {
    return NextResponse.json({ error: 'validation' }, { status: 400 });
  }

  if (!isEditorConfigured()) {
    return NextResponse.json({ error: 'unconfigured' }, { status: 503 });
  }
  const client = serverEditorClient();
  if (!client) return NextResponse.json({ error: 'unconfigured' }, { status: 503 });

  const result = await client.saveDraft(
    parsed.data.tenantSlug,
    params.pageId,
    parsed.data.blocks,
    parsed.data.revision,
  );
  if (!result.ok) {
    const status = result.error.kind === 'auth' ? 403 : result.error.kind === 'validation' ? 400 : 502;
    return NextResponse.json({ error: result.error.kind }, { status });
  }
  return NextResponse.json(result.data, { status: 201 });
}
