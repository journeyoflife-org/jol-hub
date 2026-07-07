// =============================================================================
// JOL-HUB Hierarchy Badge Component
// Visual indicator for federation tier
// =============================================================================

'use client';

import { Badge } from '@/components/ui/badge';
import { Globe, Building2, Church } from 'lucide-react';
import type { FederationTier } from '@/types';

interface HierarchyBadgeProps {
  tier: FederationTier;
  residency: string;
}

const TIER_CONFIG: Record<FederationTier, { label: string; icon: typeof Globe; className: string }> = {
  global: { label: 'Global', icon: Globe, className: 'bg-purple-100 text-purple-800' },
  country: { label: 'Country', icon: Globe, className: 'bg-blue-100 text-blue-800' },
  diocese: { label: 'Diocese', icon: Building2, className: 'bg-green-100 text-green-800' },
  parish: { label: 'Parish', icon: Church, className: 'bg-amber-100 text-amber-800' },
};

export function HierarchyBadge({ tier, residency }: HierarchyBadgeProps) {
  const config = TIER_CONFIG[tier];
  const Icon = config.icon;

  return (
    <Badge className={config.className} variant="outline">
      <Icon className="h-3 w-3 mr-1" />
      {config.label} • {residency.toUpperCase()}
    </Badge>
  );
}
