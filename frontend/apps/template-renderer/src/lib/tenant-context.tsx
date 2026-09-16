/**
 * Tenant context — STEP 5 ("the spine"), client-side link.
 *
 * Provides the resolved tenant to every component below the tenant layout.
 * Populated from the middleware-injected X-Tenant-* headers (server side,
 * see `lib/tenant-resolver.ts`) and passed down through this provider.
 *
 * SECURITY (ADR-001 / GDPR Art. 9): the provider accepts a
 * {@link PublicTenant} ONLY — `Tenant.schema` is stripped server-side via
 * `toPublicTenant` before anything crosses into client bundles.
 */
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import type { PublicTenant, Vertical } from '@jol-hub/tenant-resolver';

interface TenantContextValue {
  /** Client-safe tenant record (no schema). */
  tenant: PublicTenant;
  /** Package/feature gate — true when the tenant's plan includes `feature`. */
  hasFeature: (feature: string) => boolean;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export interface TenantProviderProps {
  tenant: PublicTenant;
  children: React.ReactNode;
}

export function TenantProvider({ tenant, children }: TenantProviderProps) {
  // Tenant changes mid-session are exceptional (preview switches, admin
  // reassignment). Rather than reconciling stale subtree state, force a
  // full reload so every server/client cache rebuilds for the new tenant.
  const initialSlug = useRef(tenant.slug);
  useEffect(() => {
    if (initialSlug.current !== tenant.slug) {
      window.location.reload();
    }
  }, [tenant.slug]);

  const value = useMemo<TenantContextValue>(
    () => ({
      tenant,
      hasFeature: (feature: string) => tenant.features.includes(feature),
    }),
    [tenant],
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

/** The resolved tenant for the current request (throws outside a provider). */
export function useTenant(): PublicTenant {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error('useTenant must be used within <TenantProvider>');
  }
  return ctx.tenant;
}

/**
 * Package gating: true when the tenant's tier/overrides include `feature`
 * (e.g. 'donations', 'gallery', 'custom-domain'). Drives conditional
 * rendering of premium sections.
 */
export function useTenantFeature(feature: string): boolean {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error('useTenantFeature must be used within <TenantProvider>');
  }
  return ctx.tenant.features.includes(feature);
}

/** Tenant vertical — for vertical-conditional rendering in shared components. */
export function useTenantVertical(): Vertical {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error('useTenantVertical must be used within <TenantProvider>');
  }
  return ctx.tenant.vertical;
}
