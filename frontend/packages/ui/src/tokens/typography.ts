/**
 * JOL Design System — typography tokens.
 *
 * Font strategy: Inter and Source Serif 4 are vendored as woff2 variable
 * fonts in `packages/ui/fonts/` and loaded via `next/font/local`. This
 * provides offline-capable builds, GDPR compliance (no external CDN
 * requests), and deterministic rendering across all tenants.
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

/**
 * Fluid typography — `clamp()` values that scale between viewport widths.
 *
 * Formula: `clamp(minRem, preferredVw, maxRem)` where the preferred value
 * is a viewport-width percentage that produces smooth scaling between a
 * 360px mobile and 1440px desktop viewport.
 *
 * These are an ALTERNATIVE to the fixed `fontSizes` above — consumers pick
 * either the fixed scale or the fluid scale. The roles (`body`, `heading`,
 * etc.) reference size-step names so they work with either.
 *
 * WCAG 2.1 SC 1.4.4 (Resize text): all fluid min values meet the 12px
 * minimum for body text; users can zoom to 200% without horizontal scroll.
 */
export const fluidSizes = {
  xs:    'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
  sm:    'clamp(0.875rem, 0.8rem + 0.35vw, 1rem)',
  base:  'clamp(1rem, 0.925rem + 0.4vw, 1.125rem)',
  lg:    'clamp(1.125rem, 1rem + 0.5vw, 1.25rem)',
  xl:    'clamp(1.25rem, 1.1rem + 0.65vw, 1.5rem)',
  '2xl': 'clamp(1.5rem, 1.25rem + 1vw, 1.875rem)',
  '3xl': 'clamp(1.875rem, 1.5rem + 1.5vw, 2.25rem)',
  '4xl': 'clamp(2.25rem, 1.75rem + 2vw, 3rem)',
  '5xl': 'clamp(3rem, 2.25rem + 3vw, 3.75rem)',
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
