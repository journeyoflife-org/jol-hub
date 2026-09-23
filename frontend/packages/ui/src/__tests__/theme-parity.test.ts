/**
 * Theme parity tests — liturgical baseline for the catholic profile.
 *
 * The catholic profile projects from core design-system scales (Baltic navy,
 * liturgical purple, liturgical gold) via themeScale(). These tests freeze
 * the projected values as a snapshot and assert strict equality — the offline
 * proof that the token layer produces the expected liturgical palette.
 *
 * PREVIOUS BASELINE (superseded 2026-09-23): the parish-template's legacy
 * LT-flag Tailwind scales (#00843D / #FFCC00 / #C8102E). That baseline
 * encoded national identity in a denomination slot (category error,
 * MASTER-PROMPT §1/§11). The old values are preserved in the localeAccents
 * registry (colors.ts) for tenants that opt in via TenantIdentity.localeAccent.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { themeRegistry, resolveThemeProfile } from '../tokens/themes';
import { themeColorExtension } from '../tokens/tailwind';

/**
 * FROZEN SNAPSHOT — the catholic profile's liturgical scales as projected
 * by themeScale() from core design-system tokens (colors.ts).
 *
 * Editing this constant is FORBIDDEN without an explicit design decision;
 * it is the parity reference, not live config.
 */
const CATHOLIC_LITURGICAL_BASELINE = {
  primary: {
    DEFAULT: '#1e3a5f',
    50: '#f0f4f8',
    100: '#d9e2ec',
    200: '#bcccdc',
    300: '#9fb3c8',
    400: '#829ab1',
    500: '#627d98',
    600: '#486581',
    700: '#334e68',
    800: '#1e3a5f',
    900: '#0a1929',
  },
  secondary: {
    DEFAULT: '#4a1a6b',
    50: '#faf5fd',
    100: '#f3e8fa',
    200: '#e6ccf2',
    300: '#d3a6e6',
    400: '#b975d1',
    500: '#9d4fb5',
    600: '#7f3596',
    700: '#672a7a',
    800: '#4a1a6b',
    900: '#3d1757',
  },
  accent: {
    DEFAULT: '#d4af37',
    50: '#fdf9e8',
    100: '#faf0c5',
    200: '#f6e28f',
    300: '#efcf52',
    400: '#e5bb2c',
    500: '#d4af37',
    600: '#b28a1c',
    700: '#8e6a16',
    800: '#755517',
    900: '#644718',
  },
} as const;

test('token-value equality: catholic profile == liturgical baseline (navy/purple/gold)', () => {
  const { palettes } = resolveThemeProfile('catholic');
  assert.deepEqual(palettes.primary, CATHOLIC_LITURGICAL_BASELINE.primary);
  assert.deepEqual(palettes.secondary, CATHOLIC_LITURGICAL_BASELINE.secondary);
  assert.deepEqual(palettes.accent, CATHOLIC_LITURGICAL_BASELINE.accent);
});

test('snapshot: themeColorExtension output matches liturgical baseline', () => {
  assert.deepEqual(themeColorExtension('catholic'), {
    primary: { ...CATHOLIC_LITURGICAL_BASELINE.primary },
    secondary: { ...CATHOLIC_LITURGICAL_BASELINE.secondary },
    accent: { ...CATHOLIC_LITURGICAL_BASELINE.accent },
  });
});

test('config-only swap: every registered ref resolves with the same palette shape', () => {
  const catholicShape = Object.keys(resolveThemeProfile('catholic').palettes.primary).sort();
  for (const ref of ['catholic', 'protestant', 'orthodox', 'other'] as const) {
    const profile = themeRegistry[ref];
    assert.equal(profile.id, ref);
    for (const palette of Object.values(profile.palettes)) {
      assert.deepEqual(Object.keys(palette).sort(), catholicShape);
      for (const value of Object.values(palette)) {
        assert.match(value, /^#[0-9a-fA-F]{6}$/, `${ref}: malformed hex ${value}`);
      }
    }
  }
});

// NOTE: catholic and orthodox currently converge on the same primary palette
// (both project from corePrimary via themeScale). They differ in secondary/accent
// role assignments. When a future orthodox pilot provides distinct palette values,
// a distinctness assertion can be re-added here.
test('catholic and orthodox share primary scale but maintain independent profiles', () => {
  const orthodox = themeColorExtension('orthodox');
  const catholic = themeColorExtension('catholic');
  // Same primary (both from corePrimary)
  assert.deepEqual(orthodox.primary, catholic.primary);
  // Same shape
  assert.deepEqual(Object.keys(orthodox), Object.keys(catholic));
  // Independent profile objects (not the same reference)
  assert.notEqual(resolveThemeProfile('catholic'), resolveThemeProfile('orthodox'));
});
