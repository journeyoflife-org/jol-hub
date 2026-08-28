/**
 * Tailwind bridge — converts design tokens into a `theme.extend` fragment.
 *
 * Apps consume this instead of hard-coding values:
 *
 * ```ts
 * import { jolThemeExtension } from '@jol-hub/ui/tokens';
 * export default { darkMode: 'class', theme: { extend: jolThemeExtension } };
 * ```
 *
 * Vertical accents become real Tailwind color utilities
 * (`border-vertical-parish`, `bg-vertical-basilica`, ...) — no hex values
 * exist outside `tokens/`.
 */
import {
  colorScales,
  liturgicalClassic,
  verticalAccents,
} from './colors';
import { fontFamilies, fontSizes, fontWeights, letterSpacings } from './typography';
import { spacingScale, spacingSemantic } from './spacing';
import { breakpoints } from './breakpoints';
import { radii } from './radii';
import { shadows } from './shadows';
import { resolveThemeProfile } from './themes';
import type { ThemeRef } from './themes';

/**
 * Theme-profile color extension (design-system-spec §1.2/§1.3). Apps select a
 * profile by REF — the swap is config-only, no component code changes:
 *
 * ```ts
 * import { themeColorExtension } from '@jol-hub/ui/tokens';
 * theme: { extend: { colors: { ...themeColorExtension('catholic') } } }
 * ```
 */
export function themeColorExtension(ref: ThemeRef) {
  const { palettes } = resolveThemeProfile(ref);
  return {
    primary: { ...palettes.primary },
    secondary: { ...palettes.secondary },
    accent: { ...palettes.accent },
  };
}

export const jolThemeExtension = {
  screens: { ...breakpoints },
  colors: {
    ...colorScales,
    liturgical: {
      ...liturgicalClassic,
      // Scale-capable gold: flat `liturgical-gold` keeps working via DEFAULT,
      // while `liturgical-gold-500` etc. become available.
      gold: colorScales.gold,
      altar: colorScales.altar,
      candle: colorScales.candle,
      incense: colorScales.incense,
      stone: colorScales.stone,
      wood: colorScales.wood,
    },
    vertical: { ...verticalAccents },
  },
  fontFamily: {
    sans: [fontFamilies.sans],
    serif: [fontFamilies.serif],
    mono: [fontFamilies.mono],
    body: [fontFamilies.sans],
    heading: [fontFamilies.serif],
  },
  fontSize: { ...fontSizes },
  fontWeight: { ...fontWeights },
  letterSpacing: { ...letterSpacings },
  spacing: { ...spacingScale, ...spacingSemantic },
  borderRadius: { ...radii },
  boxShadow: { ...shadows },
} as const;
