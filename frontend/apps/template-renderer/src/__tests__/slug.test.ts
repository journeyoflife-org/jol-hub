/**
 * Slug utility unit tests (STEP 6 — URL-safe, kebab-case, Lithuanian
 * diacritics transliterated; malformed input rejected pre-lookup).
 *
 * Run: pnpm --filter @jol-hub/template-renderer test
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { slugify, isValidSlug, normalizeSlugParam, SLUG_PATTERN } from '../lib/slug';

describe('slugify', () => {
  it('transliterates Lithuanian diacritics (ą→a, č→c, š→s, ž→z, …)', () => {
    assert.equal(slugify('Ąžuolas'), 'azuolas');
    assert.equal(slugify('Šventė'), 'svente');
    assert.equal(slugify('Čia yra naujiena'), 'cia-yra-naujiena');
    assert.equal(slugify('Žinių diena'), 'ziniu-diena');
  });

  it('kebab-cases spaces and punctuation', () => {
    assert.equal(slugify('Hello World'), 'hello-world');
    assert.equal(slugify('News: Announce!'), 'news-announce');
  });

  it('is idempotent for already-slugged input', () => {
    assert.equal(slugify('already-slugged'), 'already-slugged');
  });

  it('matches the public allowlist pattern', () => {
    assert.ok(SLUG_PATTERN.test(slugify('Šv. Mišios sekmadienį')));
  });
});

describe('isValidSlug / normalizeSlugParam', () => {
  it('accepts valid kebab-case slugs', () => {
    assert.ok(isValidSlug('news-item-1'));
    assert.ok(isValidSlug('a'));
  });

  it('rejects uppercase, spaces and special characters', () => {
    assert.equal(isValidSlug('Invalid_Slug'), false);
    assert.equal(isValidSlug('has space'), false);
    assert.equal(isValidSlug('semi;colon'), false);
  });

  it('normalizeSlugParam lowercases valid input, null for invalid', () => {
    assert.equal(normalizeSlugParam('Valid-Slug'), 'valid-slug');
    assert.equal(normalizeSlugParam('bad slug'), null);
    assert.equal(normalizeSlugParam(undefined), null);
  });
});
