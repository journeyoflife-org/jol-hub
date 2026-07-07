// =============================================================================
// JOL-HUB Breadcrumb Component
// Federation > Country > Diocese > Parish navigation
// =============================================================================

'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { useHierarchy } from '@/hooks';
import type { BreadcrumbItem, FederationTier } from '@/types';

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
}

// Icons for each tier
const TIER_ICONS: Record<FederationTier, string> = {
  global: '🌍',
  country: '🏳️',
  diocese: '⛪',
  parish: '🏛️',
};

export function Breadcrumb({ items }: BreadcrumbProps) {
  const { breadcrumbs: defaultCrumbs } = useHierarchy();
  const crumbs = items ?? defaultCrumbs;

  if (crumbs.length === 0) return null;

  return (
    <nav className="flex items-center text-sm text-muted-foreground" aria-label="Breadcrumb">
      <ol className="flex items-center gap-1">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          const icon = TIER_ICONS[crumb.tier];

          return (
            <li key={crumb.id} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />
              )}
              {isLast ? (
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <span>{icon}</span>
                  {crumb.name}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                >
                  {index === 0 ? (
                    <Home className="h-4 w-4" />
                  ) : (
                    <span>{icon}</span>
                  )}
                  {crumb.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
