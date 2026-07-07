// =============================================================================
// JOL-HUB GDPR Hook
// GDPR Article 44: Data residency enforcement
// =============================================================================

'use client';

import { useState, useCallback, createContext, useContext, ReactNode } from 'react';

interface GDPRContextType {
  dataResidencyEnforced: boolean;
  allowedCountries: string[];
  enforceDataResidency: (targetCountry: string) => boolean;
  setAllowedCountries: (countries: string[]) => void;
}

const GDPRContext = createContext<GDPRContextType | null>(null);

export function GDPRProvider({ children }: { children: ReactNode }) {
  const [dataResidencyEnforced] = useState(true);
  const [allowedCountries, setAllowedCountries] = useState<string[]>([]);

  const enforceDataResidency = useCallback(
    (targetCountry: string) => {
      if (!dataResidencyEnforced) return true;
      if (allowedCountries.length === 0) return true;
      return allowedCountries.includes(targetCountry);
    },
    [dataResidencyEnforced, allowedCountries]
  );

  const value: GDPRContextType = {
    dataResidencyEnforced,
    allowedCountries,
    enforceDataResidency,
    setAllowedCountries,
  };

  return (
    <GDPRContext.Provider value={value}>
      {children}
    </GDPRContext.Provider>
  );
}

export function useGDPR(): GDPRContextType {
  const context = useContext(GDPRContext);
  if (!context) {
    // Return default values if not in provider
    return {
      dataResidencyEnforced: true,
      allowedCountries: [],
      enforceDataResidency: () => true,
      setAllowedCountries: () => {},
    };
  }
  return context;
}
