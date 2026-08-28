/**
 * Theme migration parity tests — visual parity is the acceptance criterion.
 *
 * The catholic profile is the parish-template's legacy hardcoded Tailwind
 * scales copied VALUE-FOR-VALUE. These tests freeze the legacy config's
 * values as a snapshot and assert strict equality with the token layer —
 * the offline proof that the migration changed the SOURCE OF TRUTH without
 * changing a single rendered color.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { themeRegistry, resolveThemeProfile } from '../tokens/themes';
import { themeColorExtension } from '../tokens/tailwind';

/**
 * FROZEN SNAPSHOT — apps/parish-template/tailwind.config.ts colors block as
 * it stood before the token migration (commit: feat(ui) theme migration).
 * Editing this constant is FORBIDDEN without an explicit design decision;
 * it is the parity reference, not live config.
 */
const LEGACY_PARISH_COLORS = {
  primary: {
    DEFAULT: '#00843D',
    50: '#E6F5EC',
    100: '#CCEADA',
    200: '#99D5B5',
    300: '#66C08F',
    400: '#33AB6A',
    500: '#00843D',
    600: '#006A31',
    700: '#005025',
    800: '#003518',
    900: '#001B0C',
  },
  secondary: {
    DEFAULT: '#FFCC00',
    50: '#FFFBEB',
    100: '#FFF7D6',
    200: '#FFEFAD',
    300: '#FFE785',
    400: '#FFDF5C',
    500: '#FFCC00',
    600: '#CCA300',
    700: '#997A00',
    800: '#665200',
    900: '#332900',
  },
  accent: {
    DEFAULT: '#C8102E',
    50: '#FCE8EB',
    100: '#F9D1D7',
    200: '#F3A3AF',
    300: '#ED7587',
    400: '#E7475F',
    500: '#C8102E',
    600: '#A00D25',
    700: '#780A1C',
    800: '#500713',
    900: '#280409',
  },
} as const;

test('token-value equality: catholic profile == frozen legacy parish scales', () => {
  const { palettes } = resolveThemeProfile('catholic');
  assert.deepEqual(palettes.primary, LEGACY_PARISH_COLORS.primary);
  assert.deepEqual(palettes.secondary, LEGACY_PARISH_COLORS.secondary);
  assert.deepEqual(palettes.accent, LEGACY_PARISH_COLORS.accent);
});

test('snapshot: themeColorExtension output equals the legacy tailwind colors fragment', () => {
  // The exact object the migrated tailwind.config.ts spreads into colors —
  // structurally and value-identical to the removed hardcoded block.
  assert.deepEqual(themeColorExtension('catholic'), {
    primary: { ...LEGACY_PARISH_COLORS.primary },
    secondary: { ...LEGACY_PARISH_COLORS.secondary },
    accent: { ...LEGACY_PARISH_COLORS.accent },
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

test('orthodox stub is distinct data but same shape (swap requires zero code)', () => {
  const orthodox = themeColorExtension('orthodox');
  const catholic = themeColorExtension('catholic');
  assert.notDeepEqual(orthodox.primary, catholic.primary);
  assert.deepEqual(Object.keys(orthodox), Object.keys(catholic));
});
