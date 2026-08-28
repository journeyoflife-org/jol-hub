/**
 * JOL Design System — typography tokens.
 *
 * Font strategy (STEP 2 decision): system-first stacks with Inter /
 * Source Serif 4 as preferred faces. Webfont files are NOT fetched at
 * build time — the CI/build environment is offline, and graceful
 * fallback keeps every tenant rendering deterministically. When font
 * files are vendored later, use `next/font/local` and keep these stacks.
 */

export const fontFamilies = {
  /** Body / UI text. */
  sans: "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  /** Headings and liturgical display text. */
  serif: "'Source Serif 4', 'Source Serif Pro', Georgia, 'Times New Roman', serif",
  /** Technical / tabular values (dates, amounts). */
  mono: "ui-monospace, 'Cascadia Mono', 'Source Code Pro', Menlo, Consolas, monospace",
} as const;

/** [fontSize, lineHeight] pairs — Tailwind-compatible. */
export const fontSizes = {
  xs: ['0.75rem', { lineHeight: '1rem' }],
  sm: ['0.875rem', { lineHeight: '1.25rem' }],
  base: ['1rem', { lineHeight: '1.5rem' }],
  lg: ['1.125rem', { lineHeight: '1.75rem' }],
  xl: ['1.25rem', { lineHeight: '1.75rem' }],
  '2xl': ['1.5rem', { lineHeight: '2rem' }],
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  '5xl': ['3rem', { lineHeight: '1.2' }],
} as const;

export const fontWeights = {
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const letterSpacings = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
} as const;

export const lineHeights = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
} as const;

/**
 * Liturgical semantic roles. These compose the primitives above and are the
 * recommended API for components — they keep scripture, prayer and UI text
 * visually distinct and consistent across all verticals.
 */
export const typographyRoles = {
  /** Default body copy. */
  body: {
    fontFamily: 'sans',
    fontSize: 'base',
    lineHeight: lineHeights.relaxed,
    fontWeight: fontWeights.normal,
  },
  /** Section and page headings. */
  heading: {
    fontFamily: 'serif',
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacings.tight,
    lineHeight: lineHeights.tight,
  },
  /** Small auxiliary text (dates, metadata, hints). */
  caption: {
    fontFamily: 'sans',
    fontSize: 'sm',
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.normal,
    letterSpacing: letterSpacings.wide,
  },
  /** Scripture verses — serif, generous leading, slightly larger. */
  verse: {
    fontFamily: 'serif',
    fontSize: 'lg',
    lineHeight: lineHeights.loose,
    fontWeight: fontWeights.normal,
    fontStyle: 'italic',
  },
  /** Prayers — serif, dignified pacing. */
  prayer: {
    fontFamily: 'serif',
    fontSize: 'lg',
    lineHeight: lineHeights.loose,
    fontWeight: fontWeights.normal,
    letterSpacing: letterSpacings.wide,
  },
} as const;

export type TypographyRole = keyof typeof typographyRoles;
