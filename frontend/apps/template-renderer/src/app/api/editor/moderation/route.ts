/**
 * GET /api/editor/moderation?tenant={slug} — STEP 14 moderation queue.
 *
 * Read-only list of pending changes (page edits + uploads in quarantine)
 * for the tenant. RBAC: the /editor/moderation page gates on the tenant
 * `admin` role; the backend additionally enforces the caller's role on
 * this endpoint. Items include AI screening results (advisory) and malware
 * scan state — GDPR Art. 9 items are surfaced for the legal review queue.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { isEditorConfigured, serverEditorClient } from '@/lib/editor-client';

const TENANT_SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

export async function GET(request: NextRequest) {
  const tenantSlug = request.nextUrl.searchParams.get('tenant') ?? '';
  if (!TENANT_SLUG_PATTERN.test(tenantSlug) || tenantSlug.length > 64) {
    return NextResponse.json({ error: 'validation' }, { status: 400 });
  }

  if (!isEditorConfigured()) {
    return NextResponse.json({ error: 'unconfigured' }, { status: 503 });
  }
  const client = serverEditorClient();
  if (!client) return NextResponse.json({ error: 'unconfigured' }, { status: 503 });

  const result = await client.getModerationQueue(tenantSlug);
  if (!result.ok) {
    const status = result.error.kind === 'auth' ? 403 : 502;
    return NextResponse.json({ error: result.error.kind }, { status });
  }
  return NextResponse.json(result.data);
}
