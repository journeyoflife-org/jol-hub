/** Props for {@link Avatar}. */
export interface AvatarProps {
  /** Image source. Omit to render the initials fallback. */
  src?: string;
  /** Alt text for the image (required when `src` is provided). */
  alt?: string;
  /** Name used for the initials fallback and the aria-label. */
  name: string;
  /** Visual size. Defaults to `md`. */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Extra class name. */
  className?: string;
}

/** Props for {@link AvatarGroup}. */
export interface AvatarGroupProps {
  /** Avatars to render (beyond `max` collapses into +N). */
  items: AvatarProps[];
  /** Maximum visible avatars before the overflow counter. Defaults to 4. */
  max?: number;
  /** Accessible label for the group. */
  label?: string;
  /** Extra class name. */
  className?: string;
}
