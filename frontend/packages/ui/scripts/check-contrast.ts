/**
 * WCAG contrast verification for the JOL Design System.
 *
 * Uses the WCAG 2.1 relative-luminance formula (2.x sRGB). Every documented
 * foreground/background combination is checked here; the script exits
 * non-zero (failing CI/build) when any pair is below its threshold.
 *
 * Thresholds (WCAG 2.2 AA):
 *   - normal text:  ≥ 4.5:1
 *   - large text / UI components (focus rings, decorative accents): ≥ 3:1
 *
 * Run: `pnpm check-contrast` (packages/ui).
 */
import { colorScales } from '../src/tokens/colors';
import type { ColorScaleName } from '../src/tokens/colors';

/* ------------------------------------------------------------------ */
/* WCAG 2.1 relative luminance                                         */
/* ------------------------------------------------------------------ */

function channelToLinear(channel8: number): number {
  const c = channel8 / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (
    0.2126 * channelToLinear(r) +
    0.7152 * channelToLinear(g) +
    0.0722 * channelToLinear(b)
  );
}

export function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/* ------------------------------------------------------------------ */
/* Documented pair contract                                            */
/* ------------------------------------------------------------------ */

type Stop = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 | 'DEFAULT';

interface ContrastPair {
  /** Human-readable contract description. */
  contract: string;
  fg: [ColorScaleName, Stop];
  bg: [ColorScaleName, Stop];
  /** WCAG tier: normal text 4.5, large text / UI 3.0. */
  threshold: 4.5 | 3.0;
}

const stopValue = (scale: ColorScaleName, stop: Stop): string => colorScales[scale][stop];

/**
 * The AA contract. Adding a new token combination used for text or focus
 * indicators REQUIRES adding it here (enforced by review + this list).
 */
const pairs: ContrastPair[] = [
  // Body text — light & dark surfaces
  { contract: 'body text on light surface', fg: ['neutral', 900], bg: ['neutral', 50], threshold: 4.5 },
  { contract: 'body text on dark surface', fg: ['neutral', 50], bg: ['neutral', 950], threshold: 4.5 },
  { contract: 'muted text on dark surface', fg: ['neutral', 300], bg: ['neutral', 950], threshold: 4.5 },

  // Primary — links/headings on light, text on primary surfaces
  { contract: 'primary links/headings on light surface', fg: ['primary', 700], bg: ['neutral', 50], threshold: 4.5 },
  { contract: 'light text on primary-800 (buttons)', fg: ['neutral', 50], bg: ['primary', 800], threshold: 4.5 },
  { contract: 'dark-mode link on dark surface', fg: ['info', 300], bg: ['neutral', 950], threshold: 4.5 },

  // Secondary (liturgical purple)
  { contract: 'secondary text on light surface', fg: ['secondary', 800], bg: ['neutral', 50], threshold: 4.5 },
  { contract: 'light text on secondary-800', fg: ['neutral', 50], bg: ['secondary', 800], threshold: 4.5 },

  // Status colors
  { contract: 'success text on light surface', fg: ['success', 700], bg: ['neutral', 50], threshold: 4.5 },
  { contract: 'light text on success-700', fg: ['neutral', 50], bg: ['success', 700], threshold: 4.5 },
  { contract: 'warning text on light surface', fg: ['warning', 800], bg: ['neutral', 50], threshold: 4.5 },
  { contract: 'light text on warning-800', fg: ['neutral', 50], bg: ['warning', 800], threshold: 4.5 },
  { contract: 'error text on light surface', fg: ['error', 700], bg: ['neutral', 50], threshold: 4.5 },
  { contract: 'light text on error-700', fg: ['neutral', 50], bg: ['error', 700], threshold: 4.5 },
  { contract: 'info text on light surface', fg: ['info', 700], bg: ['neutral', 50], threshold: 4.5 },
  { contract: 'light text on info-700', fg: ['neutral', 50], bg: ['info', 700], threshold: 4.5 },

  // Church-specific scales (text usage = 700/800/900 stops on 50)
  { contract: 'accent(gold)-700 text on light surface', fg: ['accent', 700], bg: ['neutral', 50], threshold: 4.5 },
  { contract: 'altar-900 on altar-50', fg: ['altar', 900], bg: ['altar', 50], threshold: 4.5 },
  { contract: 'candle-900 on candle-50', fg: ['candle', 900], bg: ['candle', 50], threshold: 4.5 },
  { contract: 'incense-900 on incense-50', fg: ['incense', 900], bg: ['incense', 50], threshold: 4.5 },
  { contract: 'stone-900 on stone-50', fg: ['stone', 900], bg: ['stone', 50], threshold: 4.5 },
  { contract: 'wood-800 on wood-50', fg: ['wood', 800], bg: ['wood', 50], threshold: 4.5 },

  // Large text / UI components (3:1 tier)
  { contract: 'gold DEFAULT accent on dark surface (large text)', fg: ['gold', 'DEFAULT'], bg: ['neutral', 950], threshold: 3.0 },
  { contract: 'gold DEFAULT accent on primary-900 (large text)', fg: ['gold', 'DEFAULT'], bg: ['primary', 900], threshold: 3.0 },
  { contract: 'focus ring (light) vs surface', fg: ['info', 600], bg: ['neutral', 50], threshold: 3.0 },
  { contract: 'focus ring (dark) vs surface', fg: ['info', 400], bg: ['neutral', 950], threshold: 3.0 },
];

/* ------------------------------------------------------------------ */
/* Runner                                                              */
/* ------------------------------------------------------------------ */

let failures = 0;

console.log('JOL Design System — WCAG contrast verification');
console.log('='.repeat(78));

for (const pair of pairs) {
  const fg = stopValue(pair.fg[0], pair.fg[1]);
  const bg = stopValue(pair.bg[0], pair.bg[1]);
  const ratio = contrastRatio(fg, bg);
  const pass = ratio >= pair.threshold;
  if (!pass) failures += 1;

  const status = pass ? 'PASS' : 'FAIL';
  console.log(
    `[${status}] ${ratio.toFixed(2)}:1 (need ${pair.threshold.toFixed(1)}:1)  ` +
      `${pair.fg[0]}-${pair.fg[1]} ${fg} on ${pair.bg[0]}-${pair.bg[1]} ${bg}  — ${pair.contract}`,
  );
}

console.log('='.repeat(78));
if (failures > 0) {
  console.error(`${failures} contrast pair(s) below WCAG AA threshold.`);
  process.exit(1);
}
console.log(`All ${pairs.length} documented pairs pass WCAG AA.`);
