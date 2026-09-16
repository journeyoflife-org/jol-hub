/**
 * JOL Design System — spacing tokens.
 *
 * 4px base grid. Numeric scale feeds Tailwind; semantic names encode the
 * design intent used across verticals.
 */

export const SPACING_BASE_PX = 4;

/** Numeric scale (rem, 4px grid). Keys are Tailwind spacing names. */
export const spacingScale = {
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '0.75rem', // 12px
  lg: '1rem', // 16px
  xl: '1.5rem', // 24px
  '2xl': '2rem', // 32px
  '3xl': '3rem', // 48px
  '4xl': '4rem', // 64px
  '5xl': '5rem', // 80px
  '6xl': '6rem', // 96px
  '7xl': '8rem', // 128px
  '8xl': '10rem', // 160px
  '9xl': '12rem', // 192px
} as const;

/**
 * Semantic spacing roles:
 * - tight:       dense inline elements (icon + label)
 * - cozy:        related control groups, card padding on mobile
 * - comfortable: default section padding
 * - spacious:    major section separation
 * - ceremonial:  hero / sanctuary-level whitespace
 */
export const spacingSemantic = {
  tight: spacingScale.xs,
  cozy: spacingScale.sm,
  comfortable: spacingScale.lg,
  spacious: spacingScale['2xl'],
  ceremonial: spacingScale['4xl'],
} as const;

export type SpacingSemanticName = keyof typeof spacingSemantic;
