/**
 * JOL Design System — border radius tokens.
 */
export const radii = {
  none: '0',
  sm: '0.125rem', // 2px
  md: '0.375rem', // 6px
  lg: '0.5rem', // 8px
  xl: '0.75rem', // 12px
  full: '9999px',
  pill: '9999px',
} as const;

export type RadiusName = keyof typeof radii;
