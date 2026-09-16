/** Props for {@link FocusTrap}. */
export interface FocusTrapProps {
  children: React.ReactNode;
  /**
   * Whether the trap is active. Inactive traps render children untouched
   * (use for conditionally mounted overlays).
   */
  active?: boolean;
  /** Called when Escape is pressed while the trap is active. */
  onEscape?: () => void;
  /**
   * Element to return focus to when the trap deactivates/unmounts.
   * When omitted, the previously focused element (if still in DOM) is used.
   */
  restoreFocusTo?: HTMLElement | null;
}
