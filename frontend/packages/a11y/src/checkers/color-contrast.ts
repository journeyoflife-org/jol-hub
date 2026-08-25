/**
 * Color contrast math — STEP 12 (WCAG 1.4.3, 1.4.11, 2.4.7).
 *
 * Pure WCAG 2.x relative-luminance + contrast-ratio arithmetic. Used by
 * token-level gates (`packages/ui/scripts/check-contrast.ts` discipline)
 * and any runtime pair check. Rendered-page contrast cannot be computed
 * under jsdom (no layout engine) — that is why axe's `color-contrast` rule
 * is disabled there (see axe-config.ts).
 *
 * THRESHOLDS (WCAG 2.2 AA):
 *   - normal text ............. 4.5:1
 *   - large text (≥18pt / ≥14pt bold) 3:1
 *   - non-text UI components .. 3:1  (1.4.11)
 *   - focus indicators ........ 3:1 against adjacent colors (2.4.7)
 */

/** WCAG 2.x AA contrast thresholds. */
export const AA_NORMAL_TEXT = 4.5;
export const AA_LARGE_TEXT = 3;
export const AA_NON_TEXT = 3;

/** Parse `#rgb` / `#rrggbb` (case-insensitive) into 0–255 channels. */
export function parseHex(hex: string): { r: number; g: number; b: number } {
  let value = hex.trim().replace(/^#/, '');
  if (value.length === 3) {
    value = value
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (!/^[0-9a-f]{6}$/i.test(value)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

/** WCAG relative luminance (0 = black, 1 = white). */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  const channel = (c: number): number => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two colors (1–21). */
export function contrastRatio(hexA: string, hexB: string): number {
  const la = relativeLuminance(hexA);
  const lb = relativeLuminance(hexB);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Does a measured ratio satisfy WCAG 2.2 AA for the given usage?
 *   - `largeText`  — ≥18pt (24px) regular or ≥14pt (18.66px) bold;
 *   - `nonText`    — UI components / graphical objects / focus indicators.
 */
export function meetsWcagAA(
  ratio: number,
  usage: { largeText?: boolean; nonText?: boolean } = {},
): boolean {
  const threshold = usage.nonText ? AA_NON_TEXT : usage.largeText ? AA_LARGE_TEXT : AA_NORMAL_TEXT;
  return ratio >= threshold;
}
