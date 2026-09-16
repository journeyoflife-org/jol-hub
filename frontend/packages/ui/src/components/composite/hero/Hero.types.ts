import type { TenantTheme } from '../../../lib/tenant-theme';

/** Hero visual treatment (usually derived from the tenant vertical). */
export type HeroVariant = 'default' | 'church' | 'funeral' | 'cleaning';

/** Call-to-action button descriptor. */
export interface HeroCta {
  label: string;
  href: string;
  /** `primary` renders solid, `secondary` renders outline. */
  emphasis?: 'primary' | 'secondary';
}

/** Props for {@link Hero}. */
export interface HeroProps {
  /** Main heading — rendered as the page `<h1>`. */
  title: string;
  /** Subtitle paragraph below the heading. */
  subtitle?: string;
  /** Background treatment: solid color class, or an image. */
  background?:
    | { kind: 'color'; className?: string }
    | { kind: 'image'; src: string; width: number; height: number; alt?: string };
  /** Overlay opacity applied over image backgrounds (0–90, step 10). */
  overlayOpacity?: 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90;
  /** CTA buttons. */
  ctaButtons?: HeroCta[];
  /** Explicit variant override; otherwise derived from `tenant`. */
  variant?: HeroVariant;
  /** Tenant theming — drives the default variant + accent. */
  tenant?: TenantTheme;
  /** Content alignment. Defaults to `center`. */
  align?: 'left' | 'center';
  /** Extra class name. */
  className?: string;
}
