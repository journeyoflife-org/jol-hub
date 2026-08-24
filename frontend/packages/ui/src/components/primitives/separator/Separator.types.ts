/** Props for {@link Separator}. */
export interface SeparatorProps {
  /** Visual direction. Defaults to `horizontal`. */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Semantic mode: `separator` (default) for visual-only dividers,
   * `none` when adjacent content already conveys the separation.
   */
  decorative?: boolean;
  /** Extra class name. */
  className?: string;
}
