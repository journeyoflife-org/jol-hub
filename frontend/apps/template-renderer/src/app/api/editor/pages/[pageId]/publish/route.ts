/**
 * POST /api/editor/pages/[pageId]/publish — STEP 14 publish-to-moderation.
 *
 * Submitting a draft does NOT publish it: the backend creates a moderation
 * queue item (AI screening + human decision). "NEVER auto-approve content"
 * — the response carries the queue item id, not a published page.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { isEditorConfigured, serverEditorClient } from '@/lib/editor-client';

const PAGE_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;
const TENANT_SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

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
  const body = raw as { tenantSlug?: unknown };
  const tenantSlug = typeof body.tenantSlug === 'string' ? body.tenantSlug : '';
  if (!TENANT_SLUG_PATTERN.test(tenantSlug) || tenantSlug.length > 64) {
    return NextResponse.json({ error: 'validation' }, { status: 400 });
  }

  if (!isEditorConfigured()) {
    return NextResponse.json({ error: 'unconfigured' }, { status: 503 });
  }
  const client = serverEditorClient();
  if (!client) return NextResponse.json({ error: 'unconfigured' }, { status: 503 });

  const result = await client.publish(tenantSlug, params.pageId);
  if (!result.ok) {
    const status = result.error.kind === 'auth' ? 403 : result.error.kind === 'validation' ? 400 : 502;
    return NextResponse.json({ error: result.error.kind }, { status });
  }
  return NextResponse.json(result.data, { status: 202 });
}
