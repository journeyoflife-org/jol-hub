import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveLocale, TODO_MARKER, type LocalizedText } from '../localized-text';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '../types';

const full: LocalizedText = {
  lt: 'Vilniaus miesto dekanatas',
  en: 'Vilnius City Deanery',
  ru: 'Городской деканат Вильнюса',
};

const ltOnly: LocalizedText = { lt: 'Parapijų' };

const unverified: LocalizedText = {
  lt: 'Vilniaus miesto dekanatas',
  ru: `Vilnius City Deanery ${TODO_MARKER} with parish/diocese]`,
};

describe('resolveLocale — exact match', () => {
  it('returns the value for the requested locale when present', () => {
    assert.equal(resolveLocale(full, 'en'), 'Vilnius City Deanery');
    assert.equal(resolveLocale(full, 'ru'), 'Городской деканат Вильнюса');
  });

  it('returns the default locale value verbatim', () => {
    assert.equal(resolveLocale(full, DEFAULT_LOCALE), full[DEFAULT_LOCALE]);
  });

  it('never rewrites an exact match that itself carries the TODO marker', () => {
    assert.equal(
      resolveLocale(unverified, 'ru'),
      `Vilnius City Deanery ${TODO_MARKER} with parish/diocese]`
    );
  });
});

describe('resolveLocale — fallback (Phase 3 spec S3.2 Step 4: no silent degradation)', () => {
  it('falls back to the default locale when the requested locale is absent', () => {
    assert.equal(resolveLocale(ltOnly, 'en'), 'Parapijų');
  });

  it('returns a visible placeholder when the fallback is unverified', () => {
    const pending: LocalizedText = {
      lt: `Vilniaus miesto dekanatas ${TODO_MARKER} with parish/diocese]`,
    };
    assert.equal(
      resolveLocale(pending, 'en'),
      '[EN translation pending] Vilniaus miesto dekanatas [TODO: verify with parish/diocese]'
    );
  });

  it('does not add a placeholder when falling back to a verified default', () => {
    assert.equal(resolveLocale(ltOnly, 'ru'), 'Parapijų');
  });

  it('never falls back for the default locale itself', () => {
    assert.equal(resolveLocale(ltOnly, DEFAULT_LOCALE), 'Parapijų');
  });
});

describe('resolveLocale — locale coverage', () => {
  it('resolves every supported locale without throwing', () => {
    for (const locale of SUPPORTED_LOCALES) {
      assert.equal(typeof resolveLocale(full, locale), 'string');
      assert.equal(typeof resolveLocale(ltOnly, locale), 'string');
    }
  });

  it('returns a non-empty string for every supported locale', () => {
    for (const locale of SUPPORTED_LOCALES) {
      assert.ok(resolveLocale(full, locale).length > 0, `empty result for ${locale}`);
    }
  });
});
