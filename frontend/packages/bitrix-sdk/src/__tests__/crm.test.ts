/**
 * bitrix-sdk STEP-9 tests - UTM sanitization, error taxonomy, backoff and
 * retry semantics of the hub-backed CRM client.
 *
 * Run via `pnpm --filter @jol-hub/bitrix-sdk test` (tsx --test).
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { CrmBackendClient, backoffDelay, classifyStatus } from '../backend-client';
import { captureUtm, sanitizeUtmValue, UTM_MAX_LENGTH } from '../utm';

// =============================================================================
// UTM SANITIZATION
// =============================================================================

test('sanitizeUtmValue strips control chars and tag delimiters', () => {
  assert.equal(sanitizeUtmValue('news\u0001letter'), 'newsletter');
  assert.equal(sanitizeUtmValue('a<b>c'), 'abc');
  assert.equal(sanitizeUtmValue('  spaced  '), 'spaced');
});

test('sanitizeUtmValue caps length and drops empty results', () => {
  const long = 'x'.repeat(UTM_MAX_LENGTH + 50);
  assert.equal(sanitizeUtmValue(long)?.length, UTM_MAX_LENGTH);
  assert.equal(sanitizeUtmValue(''), undefined);
  assert.equal(sanitizeUtmValue('   '), undefined);
  assert.equal(sanitizeUtmValue(null), undefined);
  assert.equal(sanitizeUtmValue(undefined), undefined);
});

test('captureUtm extracts only present, non-empty fields', () => {
  const utm = captureUtm('utm_source=google&utm_medium=cpc&utm_campaign=&other=1');
  assert.deepEqual(utm, { source: 'google', medium: 'cpc' });
});

test('captureUtm sanitizes hostile values', () => {
  const utm = captureUtm('utm_source=%3Cscript%3Ealert(1)%3C%2Fscript%3E');
  assert.equal(utm.source, 'scriptalert(1)/script');
});

// =============================================================================
// ERROR TAXONOMY + BACKOFF
// =============================================================================

test('classifyStatus maps statuses to the CRM taxonomy', () => {
  assert.equal(classifyStatus(401), 'auth-rotation');
  assert.equal(classifyStatus(429), 'rate-limit');
  assert.equal(classifyStatus(400), 'validation');
  assert.equal(classifyStatus(404), 'validation');
  assert.equal(classifyStatus(500), 'server');
  assert.equal(classifyStatus(503), 'server');
});

test('backoffDelay doubles per attempt', () => {
  assert.equal(backoffDelay(0, 500), 500);
  assert.equal(backoffDelay(1, 500), 1000);
  assert.equal(backoffDelay(2, 500), 2000);
});

// =============================================================================
// CLIENT BEHAVIOUR (fake fetch)
// =============================================================================

interface FakeResponse {
  ok: boolean;
  status: number;
  body: unknown;
}

function fakeFetch(sequence: FakeResponse[]) {
  const calls: { url: string; init: RequestInit }[] = [];
  const impl = (async (url: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    // Consume the queued response; keep the LAST one for subsequent calls so
    // "give up" scenarios can repeat the same failure.
    const response = sequence[0] ?? { ok: false, status: 500, body: {} };
    if (sequence.length > 1) sequence.shift();
    return {
      ok: response.ok,
      status: response.status,
      json: async () => response.body,
      text: async () => (typeof response.body === 'string' ? response.body : JSON.stringify(response.body)),
    } as Response;
  }) as typeof fetch;
  return { impl, calls };
}

const NO_DELAY = async () => {};

function makeClient(impl: typeof fetch) {
  return new CrmBackendClient({
    baseUrl: 'http://backend:8000/api/v1',
    fetchImpl: impl,
    delayImpl: NO_DELAY,
    maxRetries: 2,
    baseDelayMs: 1,
  });
}

test('GET success returns data and sends X-Tenant header', async () => {
  const { impl, calls } = fakeFetch([{ ok: true, status: 200, body: [] }]);
  const client = makeClient(impl);
  const result = await client.getDeals('siauliai-funeral');
  assert.equal(result.ok, true);
  assert.equal(calls.length, 1);
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers['X-Tenant'], 'siauliai-funeral');
  assert.match(calls[0]?.url ?? '', /\/crm\/deals\?tenant=siauliai-funeral$/);
});

test('GET retries on 5xx then succeeds', async () => {
  const { impl, calls } = fakeFetch([
    { ok: false, status: 503, body: {} },
    { ok: true, status: 200, body: [{ id: 'd1' }] },
  ]);
  const client = makeClient(impl);
  const result = await client.getDeals('t');
  assert.equal(result.ok, true);
  assert.equal(calls.length, 2);
});

test('GET retries on 429 then succeeds', async () => {
  const { impl, calls } = fakeFetch([
    { ok: false, status: 429, body: {} },
    { ok: false, status: 429, body: {} },
    { ok: true, status: 200, body: [] },
  ]);
  const client = makeClient(impl);
  const result = await client.getDeals('t');
  assert.equal(result.ok, true);
  assert.equal(calls.length, 3);
});

test('GET gives up after maxRetries and surfaces server error', async () => {
  const { impl, calls } = fakeFetch([{ ok: false, status: 500, body: {} }]);
  const client = makeClient(impl);
  const result = await client.getDeals('t');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.kind, 'server');
    assert.equal(result.error.retryable, true);
  }
  assert.equal(calls.length, 3); // 1 initial + 2 retries
});

test('401 maps to auth-rotation, is NOT auto-retried, but retryable', async () => {
  const { impl, calls } = fakeFetch([{ ok: false, status: 401, body: {} }]);
  const client = makeClient(impl);
  const result = await client.getDeals('t');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.kind, 'auth-rotation');
    assert.equal(result.error.retryable, true);
    assert.match(result.error.message, /retry/i);
  }
  assert.equal(calls.length, 1); // no blind auto-retry; the UI owns the retry UX
});

test('POST is NOT retried on 5xx (duplicate-lead safety)', async () => {
  const { impl, calls } = fakeFetch([{ ok: false, status: 500, body: {} }]);
  const client = makeClient(impl);
  const result = await client.createLead({
    tenantSlug: 't',
    name: 'A',
    source: 'WEBSITE',
    consent: true,
  });
  assert.equal(result.ok, false);
  assert.equal(calls.length, 1);
});

test('POST IS retried on 429 (rejected before processing)', async () => {
  const { impl, calls } = fakeFetch([
    { ok: false, status: 429, body: {} },
    { ok: true, status: 201, body: { reference: 'L-1', leadId: '1' } },
  ]);
  const client = makeClient(impl);
  const result = await client.createLead({
    tenantSlug: 't',
    name: 'A',
    source: 'WEBSITE',
    consent: true,
  });
  assert.equal(result.ok, true);
  assert.equal(calls.length, 2);
});

test('validation 4xx surfaces truncated detail and never retries', async () => {
  const { impl, calls } = fakeFetch([{ ok: false, status: 400, body: 'bad email' }]);
  const client = makeClient(impl);
  const result = await client.getContact('t', '42');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.kind, 'validation');
    assert.equal(result.error.retryable, false);
    assert.match(result.error.message, /bad email/);
  }
  assert.equal(calls.length, 1);
});

test('aborted request maps to timeout kind', async () => {
  const impl = (async () => {
    const error = new Error('aborted');
    error.name = 'AbortError';
    throw error;
  }) as typeof fetch;
  const client = makeClient(impl);
  const result = await client.getDeals('t');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.kind, 'timeout');
    assert.equal(result.error.retryable, true);
  }
});

test('network failure maps to network kind and retries for GET', async () => {
  let count = 0;
  const impl = (async () => {
    count += 1;
    if (count < 3) throw new Error('ECONNREFUSED');
    return { ok: true, status: 200, json: async () => [], text: async () => '' } as Response;
  }) as typeof fetch;
  const client = makeClient(impl);
  const result = await client.getDeals('t');
  assert.equal(result.ok, true);
  assert.equal(count, 3);
});
