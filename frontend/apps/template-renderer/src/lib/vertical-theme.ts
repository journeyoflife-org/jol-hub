/**
 * Vertical theming — STEP 7.
 *
 * Maps each canonical STEP-5 vertical to its visual identity:
 *  - `accentVar`  — a `--vertical-accent` value referencing the GENERATED
 *    design-token custom properties (`--jol-color-*`). No hex appears here
 *    (design-system rule); accents stay WCAG-verified at the token source.
 *  - `heroVariant` — the ui Hero treatment (church/funeral/cleaning/default).
 *  - `schemaType`  — the schema.org Organization subtype for SEO.
 *
 * All verticals share ONE component library; differentiation is data (accent,
 * variant, composition), never duplicated components.
 */
import type { Vertical } from '@jol-hub/tenant-resolver';
import type { HeroVariant } from '@jol-hub/ui';

export interface VerticalTheme {
  /** Value assigned to the `--vertical-accent` custom property. */
  accentVar: string;
  /** Hero visual treatment. */
  heroVariant: HeroVariant;
  /** schema.org Organization subtype for structured data. */
  schemaType: string;
}

const VERTICAL_THEMES: Record<Vertical, VerticalTheme> = {
  // Sacred family — warm gold/amber, welcoming & reverent.
  church: { accentVar: 'var(--jol-color-accent)', heroVariant: 'church', schemaType: 'Church' },
  basilica: { accentVar: 'var(--jol-color-accent)', heroVariant: 'church', schemaType: 'CatholicChurch' },
  cathedral: { accentVar: 'var(--jol-color-primary-700)', heroVariant: 'church', schemaType: 'CatholicChurch' },
  orthodox: { accentVar: 'var(--jol-color-secondary-800)', heroVariant: 'church', schemaType: 'Church' },
  protestant: { accentVar: 'var(--jol-color-success-700)', heroVariant: 'church', schemaType: 'Church' },
  'other-church': { accentVar: 'var(--jol-color-primary)', heroVariant: 'church', schemaType: 'Church' },
  diaconate: { accentVar: 'var(--jol-color-primary-600)', heroVariant: 'church', schemaType: 'Church' },

  // Administrative family — deep purple/gold, formal & authoritative.
  diocese: { accentVar: 'var(--jol-color-secondary-800)', heroVariant: 'default', schemaType: 'CatholicChurch' },
  deanery: { accentVar: 'var(--jol-color-primary-600)', heroVariant: 'default', schemaType: 'Church' },

  // Memorial — subdued slate, dignified & compassionate.
  funeral: { accentVar: 'var(--jol-color-stone-700)', heroVariant: 'funeral', schemaType: 'FuneralHome' },

  // Service — fresh green, trustworthy & respectful.
  'cemetery-cleaning': {
    accentVar: 'var(--jol-color-success-700)',
    heroVariant: 'cleaning',
    schemaType: 'LocalBusiness',
  },
};

/** Resolve the theme for a vertical (defensive fallback to `church`). */
export function verticalThemeFor(vertical: Vertical): VerticalTheme {
  return VERTICAL_THEMES[vertical] ?? VERTICAL_THEMES.church;
}

/**
 * Inline style object setting the `--vertical-accent` custom property for CSS
 * targeting (`[data-vertical]` scopes it). Spread onto the template wrapper.
 */
export function verticalAccentStyle(vertical: Vertical): Record<string, string> {
  return { '--vertical-accent': verticalThemeFor(vertical).accentVar };
}
