/** Props for {@link AnnouncerProvider}. */
export interface AnnouncerProviderProps {
  children: React.ReactNode;
}

/** Imperative announcement API returned by `useAnnounce`. */
export interface AnnounceApi {
  /** Announce with `aria-live="polite"` (status updates). */
  announcePolite: (message: string) => void;
  /** Announce with `aria-live="assertive"` (errors, urgent state). */
  announceAssertive: (message: string) => void;
}
