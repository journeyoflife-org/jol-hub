/**
 * Cookie consent storage helpers — extracted from cookie-consent-banner
 * (STEP 3 250-line rule).
 *
 * STORAGE CONTRACT: the `jol-cookie-consent` localStorage shape is shared
 * with template-renderer telemetry (analytics consent gate) — change only
 * with both consumers in mind.
 */

import type { ConsentPreferences } from './cookie-consent-texts';

export const DEFAULT_CONSENT_VERSION = '1.0';
export const DEFAULT_STORAGE_KEY = 'jol-cookie-consent';

/**
 * Get stored consent preferences
 */
export function getStoredConsent(storageKey: string = DEFAULT_STORAGE_KEY): ConsentPreferences | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parsing errors
  }
  return null;
}

/**
 * Store consent preferences
 */
export function storeConsent(preferences: ConsentPreferences, storageKey: string = DEFAULT_STORAGE_KEY): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey, JSON.stringify(preferences));
}

/**
 * Check if consent is valid (not expired, correct version)
 */
export function isConsentValid(preferences: ConsentPreferences | null, currentVersion: string = DEFAULT_CONSENT_VERSION): boolean {
  if (!preferences) return false;
  if (preferences.version !== currentVersion) return false;

  // Check if consent is less than 24 months old (GDPR best practice)
  const consentDate = new Date(preferences.timestamp);
  const expiryDate = new Date(consentDate);
  expiryDate.setMonth(expiryDate.getMonth() + 24);

  return new Date() < expiryDate;
}
