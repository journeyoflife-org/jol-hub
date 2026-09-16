/**
 * JOL Design System — color tokens (single source of truth).
 *
 * RULES ENFORCED BY THIS MODULE:
 * - No hex value may appear anywhere in the workspace outside `tokens/`.
 * - Every documented foreground/background combination is verified by
 *   `pnpm check-contrast` (WCAG 2.1 relative luminance, AA thresholds).
 * - Documented AA pairs (normal text ≥ 4.5:1, large text/UI ≥ 3:1) are
 *   listed in `scripts/check-contrast.ts` and the package README.
 *
 * Scale convention: 50 (lightest) → 950 (darkest), Tailwind-compatible.
 */

export interface ColorScale {
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
  950: string;
  DEFAULT?: string;
}

/* ------------------------------------------------------------------ */
/* Core semantic scales                                                */
/* ------------------------------------------------------------------ */

/** Deep "Baltic navy" — institutional primary (kept from legacy parish theme). */
export const primary: ColorScale = {
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
  950: '#061220',
  DEFAULT: '#1e3a5f',
};

/** Liturgical purple — secondary. */
export const secondary: ColorScale = {
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
  950: '#260b38',
  DEFAULT: '#4a1a6b',
};

/** Liturgical gold — accent. Decorative at 500; use 700 for small text. */
export const accent: ColorScale = {
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
  950: '#3a270a',
  DEFAULT: '#d4af37',
};

/** Tailwind `neutral` — surfaces and body text. */
export const neutral: ColorScale = {
  50: '#fafafa',
  100: '#f5f5f5',
  200: '#e5e5e5',
  300: '#d4d4d4',
  400: '#a3a3a3',
  500: '#737373',
  600: '#525252',
  700: '#404040',
  800: '#262626',
  900: '#171717',
  950: '#0a0a0a',
};

export const success: ColorScale = {
  50: '#f0fdf4',
  100: '#dcfce7',
  200: '#bbf7d0',
  300: '#86efac',
  400: '#4ade80',
  500: '#22c55e',
  600: '#16a34a',
  700: '#15803d',
  800: '#166534',
  900: '#14532d',
  950: '#052e16',
};

export const warning: ColorScale = {
  50: '#fffbeb',
  100: '#fef3c7',
  200: '#fde68a',
  300: '#fcd34d',
  400: '#fbbf24',
  500: '#f59e0b',
  600: '#d97706',
  700: '#b45309',
  800: '#92400e',
  900: '#78350f',
  950: '#451a03',
};

export const error: ColorScale = {
  50: '#fef2f2',
  100: '#fee2e2',
  200: '#fecaca',
  300: '#fca5a5',
  400: '#f87171',
  500: '#ef4444',
  600: '#dc2626',
  700: '#b91c1c',
  800: '#991b1b',
  900: '#7f1d1d',
  950: '#450a0a',
};

export const info: ColorScale = {
  50: '#f0f9ff',
  100: '#e0f2fe',
  200: '#bae6fd',
  300: '#7dd3fc',
  400: '#38bdf8',
  500: '#0ea5e9',
  600: '#0284c7',
  700: '#0369a1',
  800: '#075985',
  900: '#0c4a6e',
  950: '#082f49',
};

/* ------------------------------------------------------------------ */
/* Church-specific semantic scales                                     */
/* ------------------------------------------------------------------ */

/** Altar linen — warm off-whites into deep amber. */
export const altar: ColorScale = {
  50: '#fdfcf9',
  100: '#f9f5ec',
  200: '#f1e8d6',
  300: '#e5d5b5',
  400: '#d4bb8c',
  500: '#c2a165',
  600: '#a9854a',
  700: '#8a6a3a',
  800: '#6f5430',
  900: '#5a4528',
  950: '#332513',
};

/** Candle flame — amber glow. */
export const candle: ColorScale = {
  50: '#fef9ec',
  100: '#fdf0d2',
  200: '#fadfa3',
  300: '#f6c96a',
  400: '#f1b23c',
  500: '#ec9d1e',
  600: '#d17d14',
  700: '#ae5e13',
  800: '#8d4a17',
  900: '#743d16',
  950: '#431f08',
};

/** Incense smoke — muted violet-grey. */
export const incense: ColorScale = {
  50: '#f7f5f8',
  100: '#eeeaf0',
  200: '#ddd6e2',
  300: '#c3b7cb',
  400: '#a594b0',
  500: '#8c7798',
  600: '#735e7f',
  700: '#5f4d68',
  800: '#504257',
  900: '#44394a',
  950: '#2a2130',
};

/** Tailwind `stone` — masonry and memorials. */
export const stone: ColorScale = {
  50: '#fafaf9',
  100: '#f5f5f4',
  200: '#e7e5e4',
  300: '#d6d3d1',
  400: '#a8a29e',
  500: '#78716c',
  600: '#57534e',
  700: '#44403c',
  800: '#292524',
  900: '#1c1917',
  950: '#0c0a09',
};

/** Sacred gold — identical to `accent` (single object, two semantic roles). */
export const gold: ColorScale = accent;

/** Church wood — warm browns. */
export const wood: ColorScale = {
  50: '#faf6f2',
  100: '#f2e8de',
  200: '#e4cebc',
  300: '#d3af94',
  400: '#c08c69',
  500: '#b37350',
  600: '#a55f42',
  700: '#894a38',
  800: '#703d33',
  900: '#5c342c',
  950: '#311a16',
};

/**
 * Legacy flat liturgical values retained for backwards compatibility with
 * existing components/classes (`text-liturgical-gold`, etc.).
 */
export const liturgicalClassic = {
  green: '#2d5016',
  purple: '#4a1a6b',
  rose: '#c9a0dc',
  red: '#8b0000',
  white: '#f8f9fa',
} as const;

/* ------------------------------------------------------------------ */
/* Vertical accents                                                    */
/* ------------------------------------------------------------------ */

/**
 * Per-vertical accent color (header rules, active states, highlights).
 * All values are references into the scales above — no stray hex values.
 */
export const verticalAccents = {
  parish: primary.DEFAULT,
  basilica: accent.DEFAULT,
  cathedral: primary[700],
  chapel: candle[600],
  monastery: wood[700],
  diocese: primary[700],
  deanery: primary[600],
  cemetery: stone[600],
  'funeral-home': stone[700],
  'orthodox-church': secondary[800],
  'greek-catholic': secondary[600],
  'protestant-church': success[700],
} as const;

export type VerticalAccentName = keyof typeof verticalAccents;

/* ------------------------------------------------------------------ */
/* Semantic light/dark roles                                           */
/* ------------------------------------------------------------------ */

/**
 * Theme roles resolved per mode. Consumers should reference these via the
 * generated CSS custom properties (`--jol-surface`, `--jol-text`, ...).
 */
export const themeRoles = {
  light: {
    surface: neutral[50],
    surfaceMuted: neutral[100],
    text: neutral[900],
    textMuted: neutral[600],
    border: neutral[200],
    link: info[700],
    focus: info[600],
  },
  dark: {
    surface: neutral[950],
    surfaceMuted: neutral[900],
    text: neutral[50],
    textMuted: neutral[300],
    border: neutral[800],
    link: info[300],
    focus: info[400],
  },
} as const;

/** All named scales, for iteration (CSS generation, contrast checks). */
export const colorScales = {
  primary,
  secondary,
  accent,
  neutral,
  success,
  warning,
  error,
  info,
  altar,
  candle,
  incense,
  stone,
  gold,
  wood,
} as const;

export type ColorScaleName = keyof typeof colorScales;
