'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CookieConsentPreferences, CookieCategory } from '../types';

const CONSENT_COOKIE_NAME = 'jol-hub-cookie-consent';
const CONSENT_VERSION = '1.0.0';

/**
 * Hook for managing GDPR cookie consent.
 */
export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsentPreferences | null>(null);
  const [hasConsent, setHasConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load consent from cookie on mount
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storedConsent = getStoredConsent();
    if (storedConsent) {
      setConsent(storedConsent);
      setHasConsent(true);
    }
    setIsLoading(false);
  }, []);

  const acceptAll = useCallback(() => {
    const newConsent: CookieConsentPreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: Date.now(),
      version: CONSENT_VERSION,
    };

    saveConsent(newConsent);
    setConsent(newConsent);
    setHasConsent(true);
  }, []);

  const acceptNecessary = useCallback(() => {
    const newConsent: CookieConsentPreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: Date.now(),
      version: CONSENT_VERSION,
    };

    saveConsent(newConsent);
    setConsent(newConsent);
    setHasConsent(true);
  }, []);

  const acceptSelected = useCallback((categories: Record<CookieCategory, boolean>) => {
    const newConsent: CookieConsentPreferences = {
      necessary: true, // Always true
      analytics: categories.analytics ?? false,
      marketing: categories.marketing ?? false,
      timestamp: Date.now(),
      version: CONSENT_VERSION,
    };

    saveConsent(newConsent);
    setConsent(newConsent);
    setHasConsent(true);
  }, []);

  const revokeConsent = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    document.cookie = `${CONSENT_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    setConsent(null);
    setHasConsent(false);
  }, []);

  const hasCategoryConsent = useCallback(
    (category: CookieCategory): boolean => {
      if (!consent) {
        return false;
      }
      return consent[category] === true;
    },
    [consent]
  );

  return {
    consent,
    hasConsent,
    isLoading,
    acceptAll,
    acceptNecessary,
    acceptSelected,
    revokeConsent,
    hasCategoryConsent,
  };
}

/**
 * Get stored consent from cookie.
 */
function getStoredConsent(): CookieConsentPreferences | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie.split(';');
  const consentCookie = cookies.find((c) => c.trim().startsWith(`${CONSENT_COOKIE_NAME}=`));

  if (!consentCookie) {
    return null;
  }

  try {
    const value = decodeURIComponent(consentCookie.split('=')[1] ?? '');
    return JSON.parse(value) as CookieConsentPreferences;
  } catch {
    return null;
  }
}

/**
 * Save consent to cookie.
 */
function saveConsent(consent: CookieConsentPreferences): void {
  if (typeof document === 'undefined') {
    return;
  }

  const value = encodeURIComponent(JSON.stringify(consent));
  const maxAge = 60 * 60 * 24 * 365; // 1 year
  const domain = process.env.NODE_ENV === 'production' ? '.jol-hub.eu' : '';

  document.cookie = `${CONSENT_COOKIE_NAME}=${value}; max-age=${maxAge}; path=/; SameSite=Lax${domain ? `; domain=${domain}` : ''}`;
}

/**
 * Check if user has consented to a specific category (server-safe).
 */
export function hasConsentForCategory(category: CookieCategory): boolean {
  if (typeof document === 'undefined') return category === 'necessary';
  const stored = getStoredConsent();
  if (!stored) return category === 'necessary';
  return stored[category] === true;
}
