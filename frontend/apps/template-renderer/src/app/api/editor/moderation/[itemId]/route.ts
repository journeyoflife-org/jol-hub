/**
 * POST /api/editor/moderation/[itemId] — STEP 14 human decision.
 *
 * Body: { tenantSlug, action: approve|reject|request-changes|escalate,
 * reason? }. reject/request-changes REQUIRE a reason (audit quality).
 * Every decision is audit-logged by the backend — who decided what, when,
 * with which reason (SOC 2 CC7.2). The AI result is advisory; this call is
 * the human final decision (or an escalation to JOL platform admins).
 */
import { NextResponse, type NextRequest } from 'next/server';
import { isEditorConfigured, serverEditorClient } from '@/lib/editor-client';
import { decisionBodySchema } from '@/lib/editor/validation';

const ITEM_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

export async function POST(request: NextRequest, { params }: { params: { itemId: string } }) {
  if (!ITEM_ID_PATTERN.test(params.itemId)) {
    return NextResponse.json({ error: 'validation' }, { status: 400 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }
  const parsed = decisionBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation' }, { status: 400 });
  }

  if (!isEditorConfigured()) {
    return NextResponse.json({ error: 'unconfigured' }, { status: 503 });
  }
  const client = serverEditorClient();
  if (!client) return NextResponse.json({ error: 'unconfigured' }, { status: 503 });

  const result = await client.decide(parsed.data.tenantSlug, {
    itemId: params.itemId,
    action: parsed.data.action,
    reason: parsed.data.reason,
    // decidedBy/decidedAt are stamped by the backend from the
    // authenticated caller — never trusted from the client.
    decidedBy: '',
    decidedAt: '',
  });
  if (!result.ok) {
    const status = result.error.kind === 'auth' ? 403 : result.error.kind === 'validation' ? 400 : 502;
    return NextResponse.json({ error: result.error.kind }, { status });
  }
  return new NextResponse(null, { status: 204 });
}
