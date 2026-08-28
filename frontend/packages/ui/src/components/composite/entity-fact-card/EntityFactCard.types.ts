import type { TenantTheme } from '../../../lib/tenant-theme';

/** One fact row (label/value) of an {@link EntityFactCard}. */
export interface EntityFact {
  /** Fact label (e.g. dedication, style, founded — resolved by the caller). */
  label: string;
  /** Fact value as display text. */
  value: string;
  /** Optional link target (e.g. diocese landing — absolute URL, SEO rule 1). */
  href?: string;
}

/** Props for {@link EntityFactCard}. */
export interface EntityFactCardProps {
  /** Card heading (caller-resolved string; omit for an unlabelled card). */
  heading?: string;
  /** Fact rows, rendered in order as a definition list. */
  items: EntityFact[];
  /** Tenant theming. */
  tenant?: TenantTheme;
  /** Extra class name. */
  className?: string;
}
