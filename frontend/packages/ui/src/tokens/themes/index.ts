/**
 * Denomination theme profiles — config only, never code forks
 * (design-system-spec §1.2, DS-THEME-01).
 *
 * Each profile is a DATA record of semantic palette overrides
 * (primary/secondary/accent). No component, template, or route may branch on
 * the profile id — enforcement is the DS-THEME-01 grep gate (zero denomination
 * literals in component trees); this module lives in `tokens/`, the one place
 * profile ids are permitted.
 *
 * Selection follows the ADR-001 chain extended with `→ theme`:
 * subdomain → tenant → schema → locale → template → content → theme_ref.
 * Swapping a tenant's theme is a `theme_ref` data change — zero code.
 *
 * MIGRATION BASELINE: the `catholic` profile is the parish-template's legacy
 * hardcoded Tailwind scales, copied VALUE-FOR-VALUE (visual parity is the
 * acceptance criterion; the parity snapshot test pins this).
 */
import type { ColorScale } from '../colors';
import { accent, primary as corePrimary, secondary as coreSecondary, wood } from '../colors';

/** Theme scale shape: Tailwind stops 50–900 + DEFAULT (legacy parish shape). */
export interface ThemeScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  DEFAULT: string;
}

export interface ThemeProfile {
  /** Stable profile id (tenant `theme_ref` values). */
  id: ThemeRef;
  palettes: {
    primary: ThemeScale;
    secondary: ThemeScale;
    accent: ThemeScale;
  };
}

export type ThemeRef = 'catholic' | 'protestant' | 'orthodox' | 'other';

/**
 * Project a core ColorScale (50–950) onto the theme scale shape (50–900).
 * Values are copied, never recomputed.
 */
function themeScale(scale: ColorScale): ThemeScale {
  return {
    50: scale[50],
    100: scale[100],
    200: scale[200],
    300: scale[300],
    400: scale[400],
    500: scale[500],
    600: scale[600],
    700: scale[700],
    800: scale[800],
    900: scale[900],
    DEFAULT: scale.DEFAULT ?? scale[500],
  };
}

/**
 * CATHOLIC profile — the parish-template migration baseline. Every value
 * below is copied verbatim from apps/parish-template/tailwind.config.ts as it
 * stood before the token migration (frozen in the parity snapshot test).
 */
const catholic: ThemeProfile = {
  id: 'catholic',
  palettes: {
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
  },
};

/**
 * ORTHODOX profile — STUB (seed data only). Composed from the contrast-
 * validated core scales: Baltic-navy primary, Byzantine gold secondary,
 * iconostasis-wood accent. Exists to prove the theme swap is config-only:
 * pointing `theme_ref` here requires zero component/template code changes.
 */
const orthodox: ThemeProfile = {
  id: 'orthodox',
  palettes: {
    primary: themeScale(corePrimary),
    secondary: themeScale(accent), // core `gold` scale
    accent: themeScale(wood),
  },
};

/**
 * OTHER profile — the neutral design-system core baseline (default per
 * §1.2). PROTESTANT currently maps to the same neutral baseline; it gains
 * its own palette when its pilot tenant data lands (values must be
 * DS-A11Y-01-validated before they are offered, DS-ADMIN-01).
 */
const other: ThemeProfile = {
  id: 'other',
  palettes: {
    primary: themeScale(corePrimary),
    secondary: themeScale(coreSecondary),
    accent: themeScale(accent),
  },
};

export const themeRegistry: Readonly<Record<ThemeRef, ThemeProfile>> = {
  catholic,
  orthodox,
  protestant: { ...other, id: 'protestant' },
  other,
};

export function resolveThemeProfile(ref: ThemeRef): ThemeProfile {
  return themeRegistry[ref];
}
