import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SUPPORTED_LOCALES,
  getLocaleFromPath,
  localizePath,
  LOCALE_PREFIXES,
  LOCALE_HREFLANG,
  LOCALE_NAMES,
  FALLBACK_ORDER,
} from '../config';

describe('locale derivation is data-driven (F6)', () => {
  it('getLocaleFromPath resolves all SUPPORTED_LOCALES', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const result = getLocaleFromPath(`/${locale}/some/path`);
      assert.equal(result, locale);
    }
  });

  it('getLocaleFromPath rejects unsupported locales', () => {
    assert.equal(getLocaleFromPath('/xx/path'), null);
    assert.equal(getLocaleFromPath('/de/path'), null);
  });

  it('LOCALE_PREFIXES covers all SUPPORTED_LOCALES', () => {
    for (const locale of SUPPORTED_LOCALES) {
      assert.ok(locale in LOCALE_PREFIXES, `missing prefix for ${locale}`);
    }
  });

  it('LOCALE_HREFLANG covers all SUPPORTED_LOCALES', () => {
    for (const locale of SUPPORTED_LOCALES) {
      assert.ok(locale in LOCALE_HREFLANG, `missing hreflang for ${locale}`);
    }
  });

  it('LOCALE_NAMES covers all SUPPORTED_LOCALES', () => {
    for (const locale of SUPPORTED_LOCALES) {
      assert.ok(locale in LOCALE_NAMES, `missing name for ${locale}`);
    }
  });

  it('localizePath works for all supported locales', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const path = localizePath('/some/page', locale);
      assert.ok(path.startsWith(`/${locale}`), `${locale} path should start with /${locale}`);
    }
  });
});

describe('FALLBACK_ORDER (F6)', () => {
  it('starts with lt (LT-first policy)', () => {
    assert.equal(FALLBACK_ORDER[0], 'lt', 'LT-first fallback chain');
    assert.notEqual(FALLBACK_ORDER[0], 'ru', 'fallback must not be ru-first');
  });
});
