/** Props for {@link SectionHeader}. */
export interface SectionHeaderProps {
  /** Small eyebrow text above the heading. */
  eyebrow?: string;
  /** Heading text. */
  title: string;
  /** Supporting description below the heading. */
  description?: string;
  /** Heading level for proper document outline. Defaults to `h2`. */
  headingLevel?: 2 | 3 | 4;
  /** Text alignment. Defaults to `left`. */
  align?: 'left' | 'center' | 'right';
  /** Optional action link rendered after the description. */
  action?: { label: string; href: string };
  /** Extra class name. */
  className?: string;
}
