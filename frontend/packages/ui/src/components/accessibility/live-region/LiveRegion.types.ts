/** Props for {@link LiveRegion}. */
export interface LiveRegionProps {
  /** Announcement politeness. `polite` for status, `assertive` for errors. */
  politeness?: 'polite' | 'assertive';
  /** Message to announce. Empty string renders an inert region. */
  message?: string;
  /**
   * When true, the whole region is re-announced on change (default).
   * Set false for additive logs.
   */
  atomic?: boolean;
  /** Extra class name (region is visually hidden by default). */
  className?: string;
}
