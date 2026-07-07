#!/bin/bash
# FILE: /opt/jol/repos/jol-hub/frontend/apps/admin-dashboard/scripts/fix-typescript-errors.sh

echo "=== JOL Admin Dashboard TypeScript Error Recovery ==="

# Fix 1: Create missing type definitions
echo "[1/5] Creating type definitions..."
mkdir -p src/types

cat > src/types/index.ts << 'EOF'
// Auto-generated type definitions
export interface Entity {
  id: string;
  name: string;
  entityType: EntityType;
  country: string;
  canonicalStatus?: CanonicalStatus;
  bitrix24Id?: string;
  bitrix24Status: SyncState;
  gdprStatus: 'compliant' | 'review_needed';
  dioceseId?: string;
  createdAt: string;
  updatedAt: string;
}

export type EntityType =
  | 'basilica'
  | 'cathedral'
  | 'diocese'
  | 'parish'
  | 'protestant'
  | 'orthodox'
  | 'funeral_home'
  | 'cemetery_service';

export type CanonicalStatus = 'pending' | 'verification_pending' | 'granted' | 'rejected';
export type SyncState = 'synced' | 'syncing' | 'error' | 'pending';

export interface HierarchyContext {
  tier: 'super' | 'country' | 'diocese' | 'facility';
  country: string | null;
  scopeId: string | null;
  dataResidency: string;
}

export interface Bitrix24WebhookPayload {
  entityId: string;
  entityType: string;
  country: string;
  action: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: string;
  signature: string;
}

export interface Country {
  code: string;
  name: string;
  flag: string;
  currency: string;
  languages: string[];
}
EOF

# Fix 2: Create missing hook implementations
echo "[2/5] Fixing hooks..."

cat > src/hooks/useCountry.ts << 'EOF'
'use client';

import { useContext } from 'react';
import { CountryContext } from '@/providers/CountryProvider';

export function useCountry() {
  const context = useContext(CountryContext);

  if (!context) {
    throw new Error('useCountry must be used within CountryProvider');
  }

  return context;
}
EOF

cat > src/hooks/useHierarchy.ts << 'EOF'
'use client';

import { useContext, useEffect, useState } from 'react';
import { HierarchyContext } from '@/providers/HierarchyProvider';
import type { HierarchyContext as HierarchyType } from '@/types';

export function useHierarchy(): HierarchyType & { isLoading: boolean } {
  const context = useContext(HierarchyContext);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate auth check
    const timer = setTimeout(() => setIsLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!context) {
    throw new Error('useHierarchy must be used within HierarchyProvider');
  }

  return { ...context, isLoading };
}
EOF

cat > src/hooks/useBitrix24.ts << 'EOF'
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SyncStatus } from '@/types';

export function useBitrix24(entityId?: string) {
  const [status, setStatus] = useState<SyncStatus>({
    status: 'pending',
    queuedOperations: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const sync = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/bitrix24/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId })
      });
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      setStatus({
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        queuedOperations: 0
      });
    } finally {
      setIsLoading(false);
    }
  }, [entityId]);

  return { status, sync, isLoading };
}
EOF

# Fix 3: Create providers
echo "[3/5] Creating providers..."

mkdir -p src/providers

cat > src/providers/CountryProvider.tsx << 'EOF'
'use client';

import { createContext, useState, ReactNode } from 'react';
import type { Country } from '@/types';

interface CountryContextType {
  country: Country;
  setCountry: (country: Country) => void;
  isRespected: boolean;
}

const defaultCountry: Country = {
  code: 'lt',
  name: 'Lithuania',
  flag: '🇱🇹',
  currency: 'EUR',
  languages: ['lt', 'en']
};

export const CountryContext = createContext<CountryContextType | null>(null);

export function CountryProvider({ children }: { children: ReactNode }) {
  const [country, setCountry] = useState<Country>(defaultCountry);
  const [isRespected] = useState(true);

  return (
    <CountryContext.Provider value={{ country, setCountry, isRespected }}>
      {children}
    </CountryContext.Provider>
  );
}
EOF

cat > src/providers/HierarchyProvider.tsx << 'EOF'
'use client';

import { createContext, useState, ReactNode } from 'react';
import type { HierarchyContext as HierarchyType } from '@/types';

const defaultHierarchy: HierarchyType = {
  tier: 'country',
  country: 'lt',
  scopeId: null,
  dataResidency: 'lt'
};

export const HierarchyContext = createContext<HierarchyType | null>(null);

export function HierarchyProvider({ children }: { children: ReactNode }) {
  const [hierarchy] = useState<HierarchyType>(defaultHierarchy);

  return (
    <HierarchyContext.Provider value={hierarchy}>
      {children}
    </HierarchyContext.Provider>
  );
}
EOF

# Fix 4: Fix component imports
echo "[4/5] Fixing component exports..."

cat > src/components/layout/index.ts << 'EOF'
export { Sidebar } from './sidebar';
export { Header } from './header';
export { CountryGuard } from './CountryGuard';
export { Breadcrumb } from './Breadcrumb';
EOF

cat > src/components/charts/index.ts << 'EOF'
export { DonationChart } from './DonationChart';
export { SystemHealthChart } from './SystemHealthChart';
export { EntityGrowthChart } from './EntityGrowthChart';
EOF

# Fix 5: Fix API routes
echo "[5/5] Fixing API routes..."

cat > src/app/api/bitrix24/webhook/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const webhookSchema = z.object({
  entityId: z.string(),
  entityType: z.string(),
  country: z.string(),
  action: z.enum(['create', 'update', 'delete']),
  data: z.record(z.unknown()),
  timestamp: z.string(),
  signature: z.string()
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const validated = webhookSchema.parse(body);

    // TODO: Implement signature verification
    // TODO: Implement data residency check

    return NextResponse.json({
      success: true,
      received: validated
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Invalid webhook payload',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 400 }
    );
  }
}
EOF

echo "=== TypeScript fixes applied ==="
echo "Run 'npx tsc --noEmit' to verify"