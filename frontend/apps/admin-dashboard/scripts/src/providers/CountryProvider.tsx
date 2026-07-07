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
