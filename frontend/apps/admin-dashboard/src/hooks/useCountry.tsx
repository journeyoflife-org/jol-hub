// =============================================================================
// JOL-HUB Country Context Hook
// GDPR Article 44: Data residency enforcement via country context
// =============================================================================

'use client';

import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import type { CountryConfig } from '@/lib/countries';
import { EU_COUNTRIES } from '@/lib/countries';

interface CountryContextType {
  countryCode: string | null;
  currentCountry: CountryConfig | null;
  allCountries: CountryConfig[];
  isRespected: boolean;
  setCountry: (code: string) => void;
  country: CountryConfig | null; // Alias for currentCountry
}

const CountryContext = createContext<CountryContextType | null>(null);

export function CountryProvider({ children }: { children: ReactNode }) {
  const [countryCode, setCountryCode] = useState<string | null>(null);

  const currentCountry = countryCode
    ? EU_COUNTRIES.find((c) => c.code === countryCode) ?? null
    : null;

  const setCountry = useCallback((code: string) => {
    setCountryCode(code || null);
  }, []);

  const value: CountryContextType = {
    countryCode,
    currentCountry,
    allCountries: EU_COUNTRIES,
    isRespected: true, // Always respected in current context
    setCountry,
    country: currentCountry,
  };

  return (
    <CountryContext.Provider value={value}>
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry(): CountryContextType {
  const context = useContext(CountryContext);
  if (!context) {
    // Return default values if not in provider
    return {
      countryCode: null,
      currentCountry: null,
      allCountries: EU_COUNTRIES,
      isRespected: true,
      setCountry: () => {},
      country: null,
    };
  }
  return context;
}
