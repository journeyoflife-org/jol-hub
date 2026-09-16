/**
 * POST /api/crm/leads — STEP 9 lead-creation proxy.
 *
 * Same-origin entry point for the CRM-aware contact form. The browser never
 * sees the hub-backend URL or any Bitrix24 credential: this handler validates
 * the payload, then forwards through the SERVER-only CRM client
 * (`lib/bitrix-client.ts`) to `POST /api/v1/crm/leads`, which hands the lead
 * to jol-bitrix24-integration.
 *
 * COMPLIANCE:
 *   - GDPR Art. 6/7: `consent: true` is REQUIRED (zod literal) — no consent,
 *     no lead.
 *   - GDPR Art. 9 / RLS: tenantSlug is validated against SLUG_PATTERN and
 *     forwarded as X-Tenant; the backend enforces the tenant boundary.
 *   - Injection: UTM fields are re-sanitized server-side (defence in depth —
 *     the client already sanitizes).
 *   - Logging: errors are logged WITHOUT personal data (kind/status only).
 */
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { SLUG_PATTERN } from '@jol-hub/tenant-resolver';
import { sanitizeUtmValue, type UtmParams } from '@jol-hub/bitrix-sdk';
import { isCrmConfigured, serverCrmClient } from '@/lib/bitrix-client';

/**
 * GET /api/crm/leads?tenant={slug} — recent leads for the admin LeadTracker.
 * Tenant-scoped by the backend (RLS); the caller must enforce RBAC before
 * surfacing this data.
 */
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

  const result = await client.getLeads(tenantSlug);
  if (result.ok) {
    return NextResponse.json(result.data);
  }
  console.error('[crm/leads] lead list failed', { kind: result.error.kind, status: result.error.status });
  if (result.error.kind === 'auth-rotation') {
    return NextResponse.json({ error: 'auth-rotation', retryable: true }, { status: 503 });
  }
  if (result.error.kind === 'rate-limit') {
    return NextResponse.json({ error: 'rate-limit', retryable: true }, { status: 429 });
  }
  return NextResponse.json({ error: 'unavailable' }, { status: 502 });
}

const UtmSchema = z.object({
  source: z.string().max(200).optional(),
  medium: z.string().max(200).optional(),
  campaign: z.string().max(200).optional(),
  term: z.string().max(200).optional(),
  content: z.string().max(200).optional(),
});

const LeadBodySchema = z.object({
  tenantSlug: z.string().regex(SLUG_PATTERN).max(64),
  name: z.string().trim().min(1).max(200),
  email: z.union([z.string().trim().email().max(254), z.literal('')]).optional(),
  phone: z.string().trim().max(50).optional(),
  message: z.string().trim().max(5000).optional(),
  /** GDPR: lead creation is consent-gated. */
  consent: z.literal(true),
  utm: UtmSchema.optional(),
});

/** Re-sanitize client-provided UTM values (defence in depth). */
function sanitizeUtm(utm: UtmParams | undefined): UtmParams | undefined {
  if (!utm) return undefined;
  const clean: UtmParams = {};
  for (const field of ['source', 'medium', 'campaign', 'term', 'content'] as const) {
    const value = sanitizeUtmValue(utm[field]);
    if (value !== undefined) clean[field] = value;
  }
  return Object.keys(clean).length > 0 ? clean : undefined;
}

export async function POST(request: NextRequest) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }

  // Validation BEFORE the configuration check: malformed input is always a
  // 400, independent of backend availability.
  const parsed = LeadBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation' }, { status: 400 });
  }

  if (!isCrmConfigured()) {
    return NextResponse.json({ error: 'unconfigured' }, { status: 503 });
  }

  const body = parsed.data;
  const client = serverCrmClient();
  if (!client) {
    return NextResponse.json({ error: 'unconfigured' }, { status: 503 });
  }

  const result = await client.createLead({
    tenantSlug: body.tenantSlug,
    name: body.name,
    email: body.email || undefined,
    phone: body.phone || undefined,
    message: body.message || undefined,
    source: 'WEBSITE',
    consent: true,
    utm: sanitizeUtm(body.utm),
  });

  if (result.ok) {
    return NextResponse.json(result.data, { status: 201 });
  }

  // Admin-facing log WITHOUT personal data (SOC 2 / GDPR minimization).
  console.error('[crm/leads] lead creation failed', {
    kind: result.error.kind,
    status: result.error.status,
  });

  switch (result.error.kind) {
    case 'auth-rotation':
      // Token rotation window — the UI auto-retries once.
      return NextResponse.json({ error: 'auth-rotation', retryable: true }, { status: 503 });
    case 'rate-limit':
      return NextResponse.json({ error: 'rate-limit', retryable: true }, { status: 429 });
    case 'validation':
      return NextResponse.json({ error: 'validation' }, { status: 400 });
    default:
      return NextResponse.json({ error: 'unavailable' }, { status: 502 });
  }
}
