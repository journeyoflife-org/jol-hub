/**
 * JOL Design System — elevation & focus tokens.
 *
 * Focus rings are WCAG 2.2 AA compliant: ≥ 3:1 against adjacent colors and
 * never removed without an equally visible replacement.
 */
import { info } from './colors';

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(10, 25, 41, 0.05)',
  md: '0 4px 6px -1px rgba(10, 25, 41, 0.1), 0 2px 4px -2px rgba(10, 25, 41, 0.1)',
  lg: '0 10px 15px -3px rgba(10, 25, 41, 0.1), 0 4px 6px -4px rgba(10, 25, 41, 0.1)',
  xl: '0 20px 25px -5px rgba(10, 25, 41, 0.1), 0 8px 10px -6px rgba(10, 25, 41, 0.1)',
  '2xl': '0 25px 50px -12px rgba(10, 25, 41, 0.25)',
  /** WCAG-safe focus ring (light mode). */
  'focus-light': `0 0 0 3px ${info[600]}66`,
  /** WCAG-safe focus ring (dark mode). */
  'focus-dark': `0 0 0 3px ${info[400]}80`,
} as const;

export type ShadowName = keyof typeof shadows;
