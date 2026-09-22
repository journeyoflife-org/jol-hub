import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  FALLBACK_ORDER,
  LOCALE_HREFLANG,
  LOCALE_NAMES,
  LOCALE_PREFIXES,
  PLANNED_LOCALES,
} from '../config';
import { DEFAULT_LOCALE, LOCALE_CONFIGS, SUPPORTED_LOCALES } from '../types';
import { getMessages } from '../messages';

/**
 * Guards the drift class that produced the published-1.0.0 divergence: a
 * locale present in SUPPORTED_LOCALES but missing from one of the maps that
 * are typed as Record<SupportedLocale, ...>, or contradicting PLANNED_LOCALES.
 *
 * Message-key parity across locales is NOT asserted here — that is the job of
 * scripts/check-parity.ts (run by `pnpm verify`), which currently reports the
 * known-incomplete `pl` catalog. See README "Poland (pl)".
 */
describe('locale set parity (SSOT = SUPPORTED_LOCALES)', () => {
  it('every supported locale has a LOCALE_CONFIGS entry with a matching code', () => {
    for (const locale of SUPPORTED_LOCALES) {
      assert.ok(locale in LOCALE_CONFIGS, `missing LOCALE_CONFIGS for ${locale}`);
      assert.equal(LOCALE_CONFIGS[locale].code, locale);
    }
  });

  it('every supported locale has a name, prefix and hreflang', () => {
    for (const locale of SUPPORTED_LOCALES) {
      assert.ok(locale in LOCALE_NAMES, `missing LOCALE_NAMES for ${locale}`);
      assert.ok(locale in LOCALE_PREFIXES, `missing LOCALE_PREFIXES for ${locale}`);
      assert.ok(locale in LOCALE_HREFLANG, `missing LOCALE_HREFLANG for ${locale}`);
    }
  });

  it('every supported locale resolves to a non-empty message catalog', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const catalog = getMessages(locale);
      assert.ok(Object.keys(catalog).length > 0, `empty catalog for ${locale}`);
    }
  });

  it('PLANNED_LOCALES never overlaps SUPPORTED_LOCALES', () => {
    for (const planned of PLANNED_LOCALES) {
      assert.ok(
        !(SUPPORTED_LOCALES as string[]).includes(planned),
        `${planned} is both planned and supported — remove it from PLANNED_LOCALES`
      );
    }
  });

  it('FALLBACK_ORDER is LT-first and only references supported locales', () => {
    assert.equal(FALLBACK_ORDER[0], DEFAULT_LOCALE, 'fallback chain must start at DEFAULT_LOCALE');
    for (const locale of FALLBACK_ORDER) {
      assert.ok(
        (SUPPORTED_LOCALES as string[]).includes(locale),
        `FALLBACK_ORDER references unsupported locale ${locale}`
      );
    }
  });
});
