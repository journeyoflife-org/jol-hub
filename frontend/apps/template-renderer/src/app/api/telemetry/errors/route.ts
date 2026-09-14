/**
 * POST /api/telemetry/errors — STEP 16 client error ingress.
 *
 * Receives classified client errors (error boundary + global handlers),
 * RE-REDACTS server-side (defense in depth — the client is untrusted),
 * emits a structured log record and forwards to the backend telemetry
 * plane when configured. Pilot mode accepts + logs and answers 204.
 *
 * GDPR: essential stability/security telemetry (Art. 6(1)(f)); payloads
 * carry no identity — no IP is stored, only rate-limit counters. Rate
 * limited per IP (abuse guard, in-memory like the other pilots).
 *
 * SECURITY EVENT LOGGING (RULES): every accepted report is logged with
 * category/severity/fingerprint — error spikes feed the P0 alert rule.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { redactValue } from '@jol-hub/observability';
import { logger } from '@/lib/logger';
import { clientIp, isRateLimited } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const ERROR_CATEGORIES = ['network', 'auth', 'commerce', 'rendering', 'security', 'unknown'] as const;
const SEVERITIES = ['critical', 'error', 'warning'] as const;

const breadcrumbSchema = z.object({
  type: z.enum(['navigation', 'click', 'api', 'form', 'console']),
  message: z.string().max(256),
  time: z.string().max(64),
});

const errorReportSchema = z.object({
  category: z.enum(ERROR_CATEGORIES),
  severity: z.enum(SEVERITIES),
  fingerprint: z.string().min(1).max(512),
  message: z.string().max(512),
  stack: z.string().max(4096).optional(),
  componentStack: z.string().max(2048).optional(),
  route: z.string().max(256).optional(),
  breadcrumbs: z.array(breadcrumbSchema).max(20).optional(),
});

const BACKEND_API_URL = process.env.BACKEND_API_URL;
const BACKEND_SERVICE_TOKEN = process.env.BACKEND_SERVICE_TOKEN;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = clientIp({ headers: request.headers });
  if (isRateLimited(`telemetry:${ip}`)) {
    return NextResponse.json({ error: 'rate-limited' }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }

  const parsed = errorReportSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation' }, { status: 400 });
  }
  const report = parsed.data;

  // Re-redact server-side: the client is untrusted input.
  const safe = redactValue(report) as typeof report;

  // Structured security/stability event (SOC 2 CC7.2 evidence).
  logger.error('client error reported', {
    event: 'client-error',
    category: safe.category,
    severity: safe.severity,
    fingerprint: safe.fingerprint,
    message: safe.message,
    route: safe.route,
  });

  // Forward to the backend telemetry plane when configured (best effort).
  if (BACKEND_API_URL) {
    try {
      await fetch(`${BACKEND_API_URL}/api/v1/telemetry/errors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(BACKEND_SERVICE_TOKEN ? { authorization: `Bearer ${BACKEND_SERVICE_TOKEN}` } : {}),
        },
        body: JSON.stringify(safe),
      });
    } catch {
      // Pilot tolerance: ingestion failure must not surface to the client.
    }
  }

  return new NextResponse(null, { status: 204 });
}
