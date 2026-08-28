import type { TenantTheme } from '../../../lib/tenant-theme';

/** Card visual treatment. */
export type CardVariant = 'default' | 'outlined' | 'elevated' | 'interactive';

/** Aspect ratio for the media slot. */
export type CardMediaAspect = 'auto' | 'square' | 'video' | 'wide' | 'portrait';

/** Props for {@link Card}. */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual treatment. Defaults to `default`. */
  variant?: CardVariant;
  /** Tenant theming — interactive cards pick up the vertical accent on hover. */
  tenant?: TenantTheme;
}

/** Props for {@link CardMedia}. */
export interface CardMediaProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Intrinsic image width (CLS prevention — required). */
  width: number;
  /** Intrinsic image height (CLS prevention — required). */
  height: number;
  /** Alternative text (required — decorative images must pass `""`). */
  alt: string;
  /** Aspect-ratio crop for the slot. Defaults to `video` (16:9). */
  aspect?: CardMediaAspect;
}

/** Props for the simple slot components (Header/Content/Footer/Title/Description). */
export interface CardSlotProps extends React.HTMLAttributes<HTMLDivElement> {}
