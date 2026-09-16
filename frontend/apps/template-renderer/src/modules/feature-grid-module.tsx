/**
 * FeatureGridModule — icon feature grid (STEP 6 module).
 *
 * Content (from PageConfig): `features` ({ icon, title, description, href }[]),
 * optional `columns` (2–4), optional `heading`/`description`. Icons are
 * referenced BY NAME in config (JSON-safe) and resolved to Lucide components
 * here — never emojis (screen-reader safety).
 */
import {
  Calendar,
  Church,
  Clock,
  Flower2,
  HandHeart,
  Heart,
  Landmark,
  MapPin,
  Music,
  Sparkles,
  Users,
  BookOpen,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { FeatureGrid, SectionHeader } from '@jol-hub/ui/components/composite';
import type { FeatureItem } from '@jol-hub/ui/components/composite';
import { tenantThemeFor, type ModuleProps } from './types';

/** Config-safe icon registry. Extend as the design vocabulary grows. */
const ICONS: Record<string, LucideIcon> = {
  church: Church,
  users: Users,
  heart: Heart,
  'hand-heart': HandHeart,
  calendar: Calendar,
  clock: Clock,
  'map-pin': MapPin,
  landmark: Landmark,
  book: BookOpen,
  music: Music,
  flower: Flower2,
  sparkles: Sparkles,
};

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export default function FeatureGridModule({ tenant, content }: ModuleProps) {
  const rawFeatures = Array.isArray(content.features) ? content.features : [];

  const features: FeatureItem[] = (
    rawFeatures as Array<{
      icon?: unknown;
      title?: unknown;
      description?: unknown;
      href?: unknown;
    }>
  )
    .filter((feature) => asString(feature.title) && asString(feature.description))
    .map((feature) => ({
      icon: ICONS[asString(feature.icon) ?? ''] ?? Sparkles,
      title: asString(feature.title) as string,
      description: asString(feature.description) as string,
      href: asString(feature.href),
    }));

  if (features.length === 0) return null;

  const columns = content.columns === 2 || content.columns === 4 ? content.columns : 3;
  const heading = asString(content.heading);
  const description = asString(content.description);

  return (
    <div className="space-y-8">
      {heading && <SectionHeader title={heading} description={description} align="center" />}
      <FeatureGrid features={features} columns={columns} tenant={tenantThemeFor(tenant)} />
    </div>
  );
}
