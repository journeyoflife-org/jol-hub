/**
 * GET /api/crm/deals?tenant={slug} — STEP 9 sales-pipeline proxy.
 *
 * Read-only deal data for the NORMAL/VIP pipeline visualization. Forwards
 * through the SERVER-only CRM client; the browser never sees the hub-backend
 * URL or any Bitrix24 credential. Deal mutations happen in Bitrix24 only —
 * this endpoint is strictly read-only.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { SLUG_PATTERN } from '@jol-hub/tenant-resolver';
import { isCrmConfigured, serverCrmClient } from '@/lib/bitrix-client';

export async function GET(request: NextRequest) {
  const tenantSlug = request.nextUrl.searchParams.get('tenant') ?? '';
  if (!SLUG_PATTERN.test(tenantSlug) || tenantSlug.length > 64) {
    return NextResponse.json({ error: 'validation' }, { status: 400 });
  }

  if (!isCrmConfigured()) {
    return NextResponse.json({ error: 'unconfigured' }, { status: 503 });
  }

  const client = serverCrmClient();
  if (!client) {
    return NextResponse.json({ error: 'unconfigured' }, { status: 503 });
  }

  const result = await client.getDeals(tenantSlug);
  if (result.ok) {
    return NextResponse.json(result.data);
  }

  console.error('[crm/deals] deal list failed', { kind: result.error.kind, status: result.error.status });
  if (result.error.kind === 'auth-rotation') {
    return NextResponse.json({ error: 'auth-rotation', retryable: true }, { status: 503 });
  }
  if (result.error.kind === 'rate-limit') {
    return NextResponse.json({ error: 'rate-limit', retryable: true }, { status: 429 });
  }
  return NextResponse.json({ error: 'unavailable' }, { status: 502 });
}
