/**
 * Tailwind bridge — converts design tokens into a `theme.extend` fragment.
 *
 * Apps consume this instead of hard-coding values:
 *
 * ```ts
 * import { jolThemeExtension } from '@journeyoflife-org/ui/tokens';
 * export default { darkMode: 'class', theme: { extend: jolThemeExtension } };
 * ```
 *
 * Vertical accents become real Tailwind color utilities
 * (`border-vertical-parish`, `bg-vertical-basilica`, ...) — no hex values
 * exist outside `tokens/`.
 */
import { colorScales, liturgicalClassic, localeAccents, verticalAccents } from './colors';
import type { LocaleAccentRef } from './colors';
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
 * import { themeColorExtension } from '@journeyoflife-org/ui/tokens';
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

/**
 * Locale-accent CSS custom property fragment.
 *
 * Returns CSS variable declarations for the tenant's locale accent palette.
 * The denomination profile provides primary/secondary/accent via
 * `themeColorExtension()`; locale accents are a SEPARATE overlay applied
 * by the template when the tenant opts in via TenantIdentity.localeAccent.
 *
 * Returns an empty object if no ref is provided or the ref is unknown —
 * the no-locale-accent case is the default and produces zero CSS output.
 */
export function localeAccentExtension(
  ref?: string
): Record<string, string> {
  if (!ref || !(ref in localeAccents)) return {};
  const palette = localeAccents[ref as LocaleAccentRef];
  return {
    '--locale-primary': palette.primary,
    '--locale-secondary': palette.secondary,
    '--locale-accent': palette.accent,
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
    locale: { ...localeAccents },
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
