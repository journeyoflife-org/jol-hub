/**
 * POST /api/telemetry/perf — STEP 16 deep performance ingress.
 *
 * Companion to STEP-13's /api/perf (Web Vitals): receives batched
 * navigation-phase + slow-resource samples from ObservabilityClient.
 * Same privacy contract: analytics-consent enforced client-side, shape +
 * size enforced here, no personal data in the schema, rate-limited.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { clientIp, isRateLimited } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const navigationPhaseSchema = z.object({
  dnsMs: z.number().int().min(0).max(60_000),
  tcpMs: z.number().int().min(0).max(60_000),
  sslMs: z.number().int().min(0).max(60_000),
  ttfbMs: z.number().int().min(0).max(60_000),
  downloadMs: z.number().int().min(0).max(60_000),
  totalMs: z.number().int().min(0).max(120_000),
});

const resourceSchema = z.object({
  name: z.string().max(512),
  initiatorType: z.string().max(32),
  durationMs: z.number().int().min(0).max(120_000),
  transferBytes: z.number().int().min(0).max(100_000_000),
});

const sampleSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('navigation'), route: z.string().max(256), data: navigationPhaseSchema }),
  z.object({
    kind: z.literal('resources'),
    route: z.string().max(256),
    data: z.object({ slowest: z.array(resourceSchema).max(5) }),
  }),
]);

const bodySchema = z.object({ samples: z.array(sampleSchema).min(1).max(10) });

const BACKEND_API_URL = process.env.BACKEND_API_URL;
const BACKEND_SERVICE_TOKEN = process.env.BACKEND_SERVICE_TOKEN;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = clientIp({ headers: request.headers });
  if (isRateLimited(`telemetry-perf:${ip}`)) {
    return NextResponse.json({ error: 'rate-limited' }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation' }, { status: 400 });
  }

  logger.info('perf telemetry received', {
    event: 'perf-telemetry',
    samples: parsed.data.samples.length,
  });

  if (BACKEND_API_URL) {
    try {
      await fetch(`${BACKEND_API_URL}/api/v1/telemetry/perf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(BACKEND_SERVICE_TOKEN ? { authorization: `Bearer ${BACKEND_SERVICE_TOKEN}` } : {}),
        },
        body: JSON.stringify(parsed.data),
      });
    } catch {
      // Pilot tolerance.
    }
  }

  return new NextResponse(null, { status: 204 });
}
