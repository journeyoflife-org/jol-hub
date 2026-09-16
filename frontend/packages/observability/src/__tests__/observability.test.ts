/**
 * Observability core tests — STEP 16 (node:test).
 *
 * The redaction battery is compliance evidence (GDPR Art. 5 / SOC 2
 * CC7.2): every class of PII/secret must be defused before a log line is
 * serialized. Fingerprinting + health aggregation lock the grouping and
 * status semantics the dashboards/alerts depend on.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  redactText,
  redactValue,
  isSensitiveKey,
  REDACTED,
  createLogger,
  levelFromEnv,
  createBatchingSink,
  type LogRecord,
  categorizeError,
  assessSeverity,
  fingerprintError,
  classifyError,
  createBreadcrumbBuffer,
  computeNavigationPhases,
  slowestResources,
  createMetricBatcher,
  aggregateHealth,
  withTimeout,
} from '../index';

// =============================================================================
// Redaction battery
// =============================================================================

test('redact: emails are removed from free text', () => {
  const out = redactText('contact vardenis.pavardenis@parapija.lt for info');
  assert.ok(!out.includes('parapija.lt'));
  assert.ok(out.includes('[REDACTED:email]'));
});

test('redact: phone numbers (LT + intl shapes) are removed', () => {
  for (const phone of ['+370 600 12345', '8 612 34567', '+49 30 901820']) {
    const out = redactText(`call ${phone} now`);
    assert.ok(!out.includes(phone), `phone leaked: ${phone}`);
  }
});

test('redact: card numbers are removed', () => {
  const out = redactText('card 4111 1111 1111 1111 charged');
  assert.ok(!out.includes('4111'));
  assert.ok(out.includes('[REDACTED:card]'));
});

test('redact: JWTs and bearer tokens are removed', () => {
  const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyLTEifQ.abcDEF123_-x';
  assert.ok(!redactText(`session ${jwt}`).includes('eyJ'));
  const bearer = redactText('Authorization: Bearer abcdef123456789xyz');
  assert.ok(!bearer.includes('abcdef123456789xyz'));
});

test('redact: AWS access keys are removed', () => {
  assert.ok(!redactText('key AKIAIOSFODNN7EXAMPLE ok').includes('AKIAIOSFODNN7EXAMPLE'));
});

test('redact: traceability fields survive (UUIDs + ISO timestamps)', () => {
  const uuid = '5caeae26-ad49-4225-875e-4dcf0490a335';
  const stamp = '2026-08-25T18:00:51.864Z';
  const out = redactText(`request ${uuid} at ${stamp} from a@b.lt`);
  assert.ok(out.includes(uuid), 'UUID must survive redaction');
  assert.ok(out.includes(stamp), 'ISO timestamp must survive redaction');
  assert.ok(!out.includes('a@b.lt'));
});

test('redact: sensitive keys redact their values wholesale', () => {
  for (const key of ['password', 'apiToken', 'NEXTAUTH_SECRET', 'authorization', 'x-api-key', 'sessionCookie', 'cardNumber']) {
    assert.equal(isSensitiveKey(key), true, key);
  }
  for (const key of ['tenant', 'requestId', 'status', 'route']) {
    assert.equal(isSensitiveKey(key), false, key);
  }
});

test('redact: deep values are redacted recursively', () => {
  const input = {
    tenant: 'test-church',
    user: { email: 'a@b.lt', password: 'hunter2' },
    items: [{ token: 'xyz', note: 'reach me at c@d.lt' }],
  };
  const out = redactValue(input) as Record<string, unknown>;
  const json = JSON.stringify(out);
  assert.ok(!json.includes('hunter2'));
  assert.ok(!json.includes('a@b.lt'));
  assert.ok(!json.includes('c@d.lt'));
  assert.ok(json.includes(REDACTED));
  assert.ok(json.includes('test-church')); // non-PII survives
});

test('redact: Error objects redact message and stack', () => {
  const out = redactValue(new Error('auth failed for a@b.lt')) as { message: string };
  assert.ok(!out.message.includes('a@b.lt'));
});

test('redact: circular structures do not crash', () => {
  const a: Record<string, unknown> = { name: 'x' };
  a.self = a;
  const out = JSON.stringify(redactValue(a));
  assert.ok(out.includes('[CIRCULAR]'));
});

// =============================================================================
// Logger
// =============================================================================

function collectLogger(minLevel?: 'debug' | 'info') {
  const lines: Array<{ line: string; record: LogRecord }> = [];
  const logger = createLogger({
    service: 'test',
    minLevel: minLevel ?? 'info',
    sink: (line, record) => lines.push({ line, record }),
    now: () => new Date('2026-08-25T12:00:00Z'),
  });
  return { logger, lines };
}

test('logger: emits one-line JSON with required fields', () => {
  const { logger, lines } = collectLogger();
  logger.info('request handled', { status: 200 });
  assert.equal(lines.length, 1);
  const parsed = JSON.parse(lines[0]!.line) as Record<string, unknown>;
  assert.equal(parsed.level, 'info');
  assert.equal(parsed.msg, 'request handled');
  assert.equal(parsed.service, 'test');
  assert.equal(parsed.status, 200);
  assert.equal(parsed.time, '2026-08-25T12:00:00.000Z');
  assert.ok(!lines[0]!.line.includes('\n'));
});

test('logger: level gating suppresses debug at info minimum', () => {
  const { logger, lines } = collectLogger('info');
  logger.debug('never in production');
  assert.equal(lines.length, 0);
  logger.warn('kept');
  assert.equal(lines.length, 1);
});

test('logger: PII in fields never reaches the sink', () => {
  const { logger, lines } = collectLogger();
  logger.error('signup failed', { email: 'user@example.lt', password: 'secret1' });
  const line = lines[0]!.line;
  assert.ok(!line.includes('user@example.lt'));
  assert.ok(!line.includes('secret1'));
});

test('logger: child bindings merge and redact', () => {
  const { logger, lines } = collectLogger();
  const child = logger.child({ tenant: 'test-church', requestId: 'req-1' });
  child.info('handled');
  const parsed = JSON.parse(lines[0]!.line) as Record<string, unknown>;
  assert.equal(parsed.tenant, 'test-church');
  assert.equal(parsed.requestId, 'req-1');
});

test('logger: levelFromEnv never allows debug in production', () => {
  assert.equal(levelFromEnv({ NODE_ENV: 'production' }), 'info');
  assert.equal(levelFromEnv({ NODE_ENV: 'development' }), 'debug');
  assert.equal(levelFromEnv({ NODE_ENV: 'production', LOG_LEVEL: 'warn' }), 'warn');
});

test('logger: batching flushes immediately on error, buffers info', async () => {
  const batches: LogRecord[][] = [];
  const batching = createBatchingSink({ transport: (records) => void batches.push(records), maxSize: 5 });
  const logger = createLogger({ service: 'client', minLevel: 'debug', sink: batching.sink, now: () => new Date() });

  logger.info('buffered');
  assert.equal(batches.length, 0);
  assert.equal(batching.bufferSize(), 1);

  logger.error('urgent'); // triggers immediate flush of both
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(batches.length, 1);
  assert.equal(batches[0]!.length, 2);
  assert.equal(batching.bufferSize(), 0);
});

// =============================================================================
// Error tracking
// =============================================================================

test('errors: category matrix', () => {
  assert.equal(categorizeError(new Error('x'), { componentStack: 'at <App>' }), 'rendering');
  assert.equal(categorizeError(new Error('x'), { status: 401 }), 'auth');
  assert.equal(categorizeError(new Error('x'), { status: 403 }), 'auth');
  assert.equal(categorizeError(new Error('Failed to fetch')), 'network');
  assert.equal(categorizeError(new Error('payment declined at checkout')), 'commerce');
  assert.equal(categorizeError(new Error('request blocked: rate limit exceeded')), 'security');
  assert.equal(categorizeError(new Error('something odd')), 'unknown');
  assert.equal(categorizeError(new Error('x'), { status: 500 }), 'network');
});

test('errors: severity by impact', () => {
  assert.equal(assessSeverity('commerce', new Error('x')), 'critical');
  assert.equal(assessSeverity('auth', new Error('x')), 'critical');
  assert.equal(assessSeverity('rendering', new Error('x')), 'error');
  assert.equal(assessSeverity('unknown', new Error('x')), 'warning');
});

test('errors: fingerprint groups similar errors (volatile parts normalized)', () => {
  // Realistic duplicates: same defect, different ids/numbers/urls.
  const a = fingerprintError(new Error('draft save failed (rev 12, item abcdef1234567890)'));
  const b = fingerprintError(new Error('draft save failed (rev 87, item 0fedcba987654321)'));
  assert.equal(a, b);
  const different = fingerprintError(new Error('media upload rejected'));
  assert.notEqual(a, different);
});

test('errors: classify returns bounded fields', () => {
  const classified = classifyError(new Error('x'.repeat(2000)), { componentStack: 'y'.repeat(5000) });
  assert.ok(classified.message.length <= 512);
  assert.ok((classified.componentStack ?? '').length <= 2048);
});

test('breadcrumbs: ring buffer keeps the newest N', () => {
  const buffer = createBreadcrumbBuffer(3, () => new Date('2026-08-25T12:00:00Z'));
  buffer.push('navigation', '/lt/x');
  buffer.push('click', 'add-block');
  buffer.push('api', 'POST /api/editor/...');
  buffer.push('click', 'publish');
  assert.equal(buffer.size(), 3);
  const snap = buffer.snapshot();
  // Oldest entry ('/lt/x') was evicted — newest N kept in order.
  assert.equal(snap[0]!.message, 'add-block');
  assert.equal(snap[2]!.message, 'publish');
  const drained = buffer.drain();
  assert.equal(drained.length, 3);
  assert.equal(buffer.size(), 0);
});

// =============================================================================
// Performance core
// =============================================================================

test('perf: navigation phases compute from timing numbers', () => {
  const phases = computeNavigationPhases({
    domainLookupStart: 0,
    domainLookupEnd: 12,
    connectStart: 12,
    secureConnectionStart: 20,
    connectEnd: 40,
    requestStart: 41,
    responseStart: 130,
    responseEnd: 160,
  });
  assert.equal(phases.dnsMs, 12);
  assert.equal(phases.sslMs, 20);
  assert.equal(phases.ttfbMs, 89);
  assert.equal(phases.downloadMs, 30);
  assert.equal(phases.totalMs, 160);
});

test('perf: negative gaps clamp to zero (clock skew)', () => {
  const phases = computeNavigationPhases({
    domainLookupStart: 10,
    domainLookupEnd: 5,
    connectStart: 0,
    secureConnectionStart: 0,
    connectEnd: 0,
    requestStart: 10,
    responseStart: 8,
    responseEnd: 8,
  });
  assert.equal(phases.dnsMs, 0);
  assert.equal(phases.ttfbMs, 0);
});

test('perf: slowest resources sorted, limited, query-stripped', () => {
  const entries = [
    { name: 'https://cdn/img.webp?v=1', initiatorType: 'img', duration: 900, transferSize: 50_000 },
    { name: 'https://cdn/app.js', initiatorType: 'script', duration: 200, transferSize: 30_000 },
    { name: 'https://cdn/late.jpg', initiatorType: 'img', duration: 1500, transferSize: 90_000 },
  ];
  const top = slowestResources(entries, 2);
  assert.equal(top.length, 2);
  assert.equal(top[0]!.name, 'https://cdn/late.jpg');
  assert.equal(top[1]!.name, 'https://cdn/img.webp'); // query stripped
});

test('perf: metric batcher flushes on size', async () => {
  const batches: number[][] = [];
  const batcher = createMetricBatcher<number>({ transport: (b) => void batches.push(b), maxBatch: 2 });
  batcher.add(1);
  batcher.add(2);
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(batches.length, 1);
  assert.deepEqual(batches[0], [1, 2]);
});

// =============================================================================
// Health
// =============================================================================

test('health: aggregation ok / degraded / down', () => {
  const ok = aggregateHealth(
    [
      { name: 'backend', status: 'ok', critical: true },
      { name: 'crm', status: 'unconfigured', critical: false },
    ],
    '1.0.0',
    't',
  );
  assert.equal(ok.status, 'ok');

  const degraded = aggregateHealth(
    [
      { name: 'backend', status: 'ok', critical: true },
      { name: 'crm', status: 'degraded', critical: false },
    ],
    '1.0.0',
    't',
  );
  assert.equal(degraded.status, 'degraded');

  const down = aggregateHealth(
    [
      { name: 'backend', status: 'down', critical: true },
      { name: 'crm', status: 'ok', critical: false },
    ],
    '1.0.0',
    't',
  );
  assert.equal(down.status, 'down');

  // Non-critical down degrades but does not fail the probe.
  const optionalDown = aggregateHealth(
    [
      { name: 'backend', status: 'ok', critical: true },
      { name: 'payments', status: 'down', critical: false },
    ],
    '1.0.0',
    't',
  );
  assert.notEqual(optionalDown.status, 'down');
});

test('health: withTimeout resolves the fallback for slow probes', async () => {
  const result = await withTimeout(
    () => new Promise<string>((resolve) => setTimeout(() => resolve('slow'), 50)),
    10,
    'timeout',
  );
  assert.equal(result, 'timeout');

  const fast = await withTimeout(() => Promise.resolve('fast'), 100, 'timeout');
  assert.equal(fast, 'fast');
});
