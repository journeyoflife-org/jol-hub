// =============================================================================
// JOL-HUB Federation Hierarchy Hook
// 4-tier hierarchy: global > country > diocese > parish
// SOC2 CC6.1: Role-based access control enforcement
// =============================================================================

'use client';

import { useSession } from 'next-auth/react';
import { useMemo, useCallback } from 'react';
import type { 
  FederationTier, 
  BreadcrumbItem,
  EntityType,
} from '@/types';
import type { Permission } from '@/types/hierarchy';
import { hasPermission, getRoleTier } from '@/lib/auth';

interface HierarchyContext {
  tier: FederationTier;
  entityId: string;
  entityName: string;
  parentEntityId: string | null;
  breadcrumbs: BreadcrumbItem[];
  canAccess: (resource: EntityType, action: Permission['action']) => boolean;
  isGlobalAdmin: boolean;
  isCountryAdmin: boolean;
  isDioceseAdmin: boolean;
  isParishAdmin: boolean;
  getScopeFilter: () => Record<string, string>;
}

export function useHierarchy(): HierarchyContext {
  const { data: session } = useSession();

  // Determine user's federation tier from role
  const tier = useMemo<FederationTier>(() => {
    return getRoleTier((session as any)?.role ?? 'parish_editor');
  }, [session]);

  // Get entity ID based on tier
  const entityId = useMemo(() => {
    const s = session as any;
    switch (tier) {
      case 'global':
        return 'global';
      case 'country':
        return s?.countryId ?? s?.countryCode ?? '';
      case 'diocese':
        return s?.dioceseId ?? '';
      case 'parish':
        return s?.parishId ?? '';
      default:
        return '';
    }
  }, [session, tier]);

  // Get entity name for display
  const entityName = useMemo(() => {
    const s = session as any;
    return s?.entityName ?? s?.countryName ?? s?.dioceseName ?? s?.parishName ?? 'Unknown';
  }, [session]);

  // Get parent entity ID
  const parentEntityId = useMemo(() => {
    const s = session as any;
    switch (tier) {
      case 'parish':
        return s?.dioceseId ?? null;
      case 'diocese':
        return s?.countryId ?? s?.countryCode ?? null;
      case 'country':
        return 'global';
      default:
        return null;
    }
  }, [session, tier]);

  // Build breadcrumb trail for navigation
  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
    const s = session as any;
    const items: BreadcrumbItem[] = [
      { tier: 'global', id: 'global', name: 'JOL-HUB', href: '/dashboard' },
    ];

    // Add country level if applicable
    if (tier === 'global' || s?.countryCode) {
      items.push({
        tier: 'country',
        id: s?.countryCode ?? '',
        name: s?.countryName ?? '',
        href: `/dashboard/countries/${s?.countryCode}`,
      });
    }

    // Add diocese level if applicable
    if (tier === 'parish' || tier === 'diocese' || s?.dioceseId) {
      items.push({
        tier: 'diocese',
        id: s?.dioceseId ?? '',
        name: s?.dioceseName ?? '',
        href: `/dashboard/dioceses/${s?.dioceseId}`,
      });
    }

    // Add parish level if applicable
    if (tier === 'parish' && s?.parishId) {
      items.push({
        tier: 'parish',
        id: s?.parishId ?? '',
        name: s?.parishName ?? '',
        href: `/dashboard/parishes/${s?.parishId}`,
      });
    }

    return items;
  }, [session, tier]);

  // Check if user can access a specific resource/action
  const canAccess = useCallback(
    (resource: EntityType, action: Permission['action']): boolean => {
      const role = (session as any)?.role;
      if (!role) return false;
      return hasPermission(role, action, resource);
    },
    [session]
  );

  // Get scope filter for API calls based on tier
  const getScopeFilter = useCallback((): Record<string, string> => {
    const s = session as any;
    switch (tier) {
      case 'global':
        return {};
      case 'country':
        return { countryCode: s?.countryCode ?? '' };
      case 'diocese':
        return { dioceseId: s?.dioceseId ?? '' };
      case 'parish':
        return { parishId: s?.parishId ?? '' };
      default:
        return {};
    }
  }, [session, tier]);

  return {
    tier,
    entityId,
    entityName,
    parentEntityId,
    breadcrumbs,
    canAccess,
    isGlobalAdmin: tier === 'global',
    isCountryAdmin: tier === 'country',
    isDioceseAdmin: tier === 'diocese',
    isParishAdmin: tier === 'parish',
    getScopeFilter,
  };
}
