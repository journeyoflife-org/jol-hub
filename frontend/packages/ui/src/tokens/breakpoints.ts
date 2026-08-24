/**
 * JOL Design System — breakpoints (mobile-first).
 *
 * Values match Tailwind's defaults so utility behavior is predictable;
 * declared explicitly here as the contractual source of truth.
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export type BreakpointName = keyof typeof breakpoints;
