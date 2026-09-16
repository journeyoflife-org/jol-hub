/**
 * LRU cache unit tests (STEP 5 performance contract: resolution cacheable,
 * 5 min TTL, bounded memory).
 *
 * Run: pnpm --filter @jol-hub/tenant-resolver test
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { LruCache } from '../lru';

describe('LruCache', () => {
  it('stores and retrieves values', () => {
    const cache = new LruCache<string>(4, 60_000);
    cache.set('a', 'alpha');
    assert.equal(cache.get('a'), 'alpha');
    assert.equal(cache.size, 1);
  });

  it('returns undefined for unknown keys', () => {
    const cache = new LruCache<string>(4, 60_000);
    assert.equal(cache.get('missing'), undefined);
  });

  it('expires entries after the TTL', () => {
    let now = 0;
    const cache = new LruCache<string>(4, 5_000, () => now);
    cache.set('a', 'alpha');
    assert.equal(cache.get('a'), 'alpha');

    now = 4_999; // just before expiry
    assert.equal(cache.get('a'), 'alpha');

    now = 5_000; // at expiry (>= comparison)
    assert.equal(cache.get('a'), undefined);
    assert.equal(cache.size, 0);
  });

  it('evicts the least-recently-used entry when full', () => {
    const cache = new LruCache<string>(2, 60_000);
    cache.set('a', 'alpha');
    cache.set('b', 'beta');
    cache.set('c', 'gamma'); // evicts 'a'
    assert.equal(cache.get('a'), undefined);
    assert.equal(cache.get('b'), 'beta');
    assert.equal(cache.get('c'), 'gamma');
  });

  it('get() refreshes recency (hit entries survive eviction)', () => {
    const cache = new LruCache<string>(2, 60_000);
    cache.set('a', 'alpha');
    cache.set('b', 'beta');
    cache.get('a'); // 'a' becomes newest; 'b' is now LRU
    cache.set('c', 'gamma'); // evicts 'b'
    assert.equal(cache.get('a'), 'alpha');
    assert.equal(cache.get('b'), undefined);
    assert.equal(cache.get('c'), 'gamma');
  });

  it('overwriting an existing key does not grow the size', () => {
    const cache = new LruCache<string>(2, 60_000);
    cache.set('a', 'alpha');
    cache.set('a', 'alpha-2');
    assert.equal(cache.size, 1);
    assert.equal(cache.get('a'), 'alpha-2');
  });

  it('caches null values distinctly from misses', () => {
    // The resolver caches NEGATIVE results (unknown tenant → null) to keep
    // enumeration probes cheap; `get` must return the stored null, and the
    // resolver distinguishes misses via `undefined`.
    const cache = new LruCache<string | null>(2, 60_000);
    cache.set('a', null);
    assert.equal(cache.get('a'), null);
    assert.equal(cache.get('b'), undefined);
  });

  it('clear() empties the cache', () => {
    const cache = new LruCache<string>(4, 60_000);
    cache.set('a', 'alpha');
    cache.clear();
    assert.equal(cache.size, 0);
    assert.equal(cache.get('a'), undefined);
  });
});
