'use client';

/**
 * GDPR-compliant Cookie Consent Banner with i18n
 *
 * Features:
 * - Three categories: Necessary (required), Analytics, Marketing (default off)
 * - Buttons: Accept All (green), Necessary Only, Manage Cookies, Save Preferences
 * - Mobile: Full-width bottom sheet on small screens
 * - Cookie persistence: 1 year with GDPR-compliant expiration
 * - Accessibility: aria-label, keyboard navigation (Tab, Enter, Escape)
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useCookieConsent } from '../hooks/use-cookie-consent';
import type { CookieCategory } from '../types';

// =============================================================================
// TYPES
// =============================================================================

export interface CookieConsentBannerProps {
  privacyPolicyUrl?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CookieConsentBanner({
  privacyPolicyUrl = '/privacy',
}: CookieConsentBannerProps): JSX.Element | null {
  const { t } = useTranslation('gdpr');
  const { hasConsent, acceptAll, acceptNecessary, acceptSelected, isLoading } = useCookieConsent();
  const [showDetails, setShowDetails] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [preferences, setPreferences] = useState<Record<CookieCategory, boolean>>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (!hasConsent && !isLoading) {
      timer = setTimeout(() => setIsVisible(true), 500);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [hasConsent, isLoading]);

  const handleToggleCategory = (category: CookieCategory) => {
    if (category === 'necessary') return;
    setPreferences((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const handleAcceptSelected = () => {
    acceptSelected(preferences);
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && showDetails) {
      setShowDetails(false);
    }
  }, [showDetails]);

  if (hasConsent || isLoading) {
    return null;
  }

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ease-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
    >
      <div className="absolute inset-0 bg-black/20 -z-10 sm:hidden" aria-hidden="true" />

      <div className="bg-background border-t shadow-2xl">
        <div className="container mx-auto max-w-6xl px-4 py-4 sm:py-6">
          {!showDetails ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1 space-y-2">
                <h2
                  id="cookie-consent-title"
                  className="text-lg font-semibold text-foreground"
                >
                  {t('privacySettings')}
                </h2>
                <p
                  id="cookie-consent-description"
                  className="text-sm text-muted-foreground leading-relaxed"
                >
                  {t('cookieConsent.description')}
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 flex-shrink-0">
                <a
                  href={privacyPolicyUrl}
                  className="px-4 py-2.5 text-sm text-center text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
                  aria-label={t('common.learnMore')}
                >
                  {t('common.learnMore')}
                </a>

                <button
                  onClick={() => setShowDetails(true)}
                  className="px-4 py-2.5 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label={t('cookieConsent.manageCookies')}
                >
                  {t('cookieConsent.manageCookies')}
                </button>

                <button
                  onClick={acceptNecessary}
                  className="px-4 py-2.5 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label={t('cookieConsent.necessaryOnly')}
                >
                  {t('cookieConsent.necessaryOnly')}
                </button>

                <button
                  onClick={acceptAll}
                  className="px-4 py-2.5 text-sm font-medium bg-green-600 text-white hover:bg-green-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  aria-label={t('cookieConsent.acceptAll')}
                >
                  {t('cookieConsent.acceptAll')}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="text-lg font-semibold text-foreground">
                  {t('cookieConsent.manageCookies')}
                </h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors"
                  aria-label={t('common.back')}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                <CategoryRow
                  title={t('cookieConsent.categories.necessary.title')}
                  description={t('cookieConsent.categories.necessary.description')}
                  checked={true}
                  disabled={true}
                  required={true}
                  onChange={() => {}}
                  requiredLabel={t('common.required')}
                />
                <CategoryRow
                  title={t('cookieConsent.categories.analytics.title')}
                  description={t('cookieConsent.categories.analytics.description')}
                  checked={preferences.analytics}
                  onChange={() => handleToggleCategory('analytics')}
                />
                <CategoryRow
                  title={t('cookieConsent.categories.marketing.title')}
                  description={t('cookieConsent.categories.marketing.description')}
                  checked={preferences.marketing}
                  onChange={() => handleToggleCategory('marketing')}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t">
                <button
                  onClick={acceptNecessary}
                  className="px-4 py-2.5 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {t('cookieConsent.necessaryOnly')}
                </button>
                <button
                  onClick={handleAcceptSelected}
                  className="px-4 py-2.5 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {t('cookieConsent.savePreferences')}
                </button>
                <button
                  onClick={acceptAll}
                  className="px-4 py-2.5 text-sm font-medium bg-green-600 text-white hover:bg-green-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  {t('cookieConsent.acceptAll')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// INTERNAL: Category row
// =============================================================================

interface CategoryRowProps {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  required?: boolean;
  onChange: () => void;
  requiredLabel?: string;
}

function CategoryRow({
  title,
  description,
  checked,
  disabled = false,
  required = false,
  onChange,
  requiredLabel = 'Required',
}: CategoryRowProps): JSX.Element {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="mt-1 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-50"
        aria-label={title}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{title}</span>
          {required && (
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {requiredLabel}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
