/**
 * Media endpoints — STEP 14: /api/editor/media (GET library, POST upload).
 *
 * GET  ?tenant={slug}   — tenant media library (approved assets; quarantined
 *                         items are listed with their pipeline state).
 * POST                  — register an upload: metadata + REQUIRED alt text.
 *                         The backend responds with a quarantine reference;
 *                         the file then passes malware scanning
 *                         (ClamAV-class) and AI moderation (on-prem
 *                         Ollama/RAG) BEFORE it can be approved. Nothing is
 *                         served publicly from quarantine.
 *
 * VALIDATION: type allowlist (jpg/png/webp/svg), ≤2MB, alt text required —
 * enforced here AND client-side (MediaUploader) AND by the backend scan
 * pipeline. GDPR Art. 9: uploads flagged with special-category indicators
 * route to the legal review queue backend-side.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { isEditorConfigured, serverEditorClient } from '@/lib/editor-client';
import { uploadBodySchema } from '@/lib/editor/validation';

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

  const result = await client.getMediaLibrary(tenantSlug);
  if (!result.ok) {
    const status = result.error.kind === 'auth' ? 403 : 502;
    return NextResponse.json({ error: result.error.kind }, { status });
  }
  return NextResponse.json(result.data);
}

export async function POST(request: NextRequest) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }
  const parsed = uploadBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation' }, { status: 400 });
  }

  if (!isEditorConfigured()) {
    return NextResponse.json({ error: 'unconfigured' }, { status: 503 });
  }
  const client = serverEditorClient();
  if (!client) return NextResponse.json({ error: 'unconfigured' }, { status: 503 });

  const result = await client.registerUpload(parsed.data.tenantSlug, {
    fileName: parsed.data.fileName,
    mimeType: parsed.data.mimeType,
    sizeBytes: parsed.data.sizeBytes,
    altText: parsed.data.altText,
  });
  if (!result.ok) {
    const status = result.error.kind === 'auth' ? 403 : result.error.kind === 'validation' ? 400 : 502;
    return NextResponse.json({ error: result.error.kind }, { status });
  }
  return NextResponse.json(result.data, { status: 202 });
}
