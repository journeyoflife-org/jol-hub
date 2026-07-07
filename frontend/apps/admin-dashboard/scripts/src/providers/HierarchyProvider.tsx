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
