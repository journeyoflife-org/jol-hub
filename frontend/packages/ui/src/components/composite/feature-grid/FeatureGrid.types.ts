import type { LucideIcon } from 'lucide-react';

import type { TenantTheme } from '../../../lib/tenant-theme';

/** A single feature item. Icons come from Lucide React — never emojis. */
export interface FeatureItem {
  /** Lucide icon component (screen-reader-decorative; title carries meaning). */
  icon: LucideIcon;
  title: string;
  description: string;
  /** Optional link — makes the feature clickable. */
  href?: string;
  linkLabel?: string;
}

/** Props for {@link FeatureGrid}. */
export interface FeatureGridProps {
  /** Feature items. */
  features: FeatureItem[];
  /** Maximum columns at desktop widths (2–4). Defaults to 3. */
  columns?: 2 | 3 | 4;
  /** Tenant theming — colors the icons. */
  tenant?: TenantTheme;
  /** Extra class name. */
  className?: string;
}
