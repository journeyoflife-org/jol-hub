/**
 * POST /api/perf — STEP 13 Web Vitals RUM ingress.
 *
 * Same-origin collection point for the consent-gated `WebVitals` reporter.
 * Validates the payload (zod), strips anything unexpected, and forwards to
 * the backend analytics plane (`BACKEND_API_URL`) when configured; pilot
 * mode (no backend) answers 204 so reporting never errors visibly.
 *
 * PRIVACY (GDPR Art. 5/6): the payload carries NO personal data — metric
 * name/value/rating/id and a page path. The client only sends after
 * analytics consent; this route additionally enforces shape and size
 * limits. No tenant schema/RLS context is needed (public metrics).
 */
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

const WEB_VITAL_NAMES = ['TTFB', 'FCP', 'LCP', 'CLS', 'FID', 'INP'] as const;

const MetricSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.enum(WEB_VITAL_NAMES),
  value: z.number().finite().min(0).max(1e9),
  rating: z.enum(['good', 'needs-improvement', 'poor']).optional(),
  route: z.string().min(1).max(256),
});

const BACKEND_API_URL = process.env.BACKEND_API_URL;
const BACKEND_SERVICE_TOKEN = process.env.BACKEND_SERVICE_TOKEN;

export async function POST(request: NextRequest) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }

  const parsed = MetricSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation' }, { status: 400 });
  }

  // Pilot: no analytics backend yet — accept and drop (204 keeps RUM quiet).
  if (!BACKEND_API_URL) {
    return new NextResponse(null, { status: 204 });
  }

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (BACKEND_SERVICE_TOKEN) headers.authorization = `Bearer ${BACKEND_SERVICE_TOKEN}`;
    await fetch(`${BACKEND_API_URL}/api/v1/perf/web-vitals`, {
      method: 'POST',
      headers,
      body: JSON.stringify(parsed.data),
    });
  } catch {
    // RUM forwarding must never surface as a client error; the next metric
    // retries implicitly. Failures are observable via backend ingestion gaps.
  }

  return new NextResponse(null, { status: 204 });
}
