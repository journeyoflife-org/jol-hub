'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCookieConsent } from '../hooks/use-cookie-consent';
import type { CookieCategory } from '../types';

/**
 * GDPR-compliant cookie consent banner with granular controls.
 */
export function CookieConsentBanner() {
  const { t } = useTranslation('gdpr');
  const { hasConsent, acceptAll, acceptNecessary, acceptSelected } = useCookieConsent();
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<Record<CookieCategory, boolean>>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  // Don't show if consent already given
  if (hasConsent) {
    return null;
  }

  const handleAcceptSelected = () => {
    acceptSelected(preferences);
  };

  const handleToggleCategory = (category: CookieCategory) => {
    if (category === 'necessary') {
      return; // Cannot toggle necessary cookies
    }
    setPreferences((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg"
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
    >
      <div className="container mx-auto max-w-6xl p-4">
        {!showDetails ? (
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <h2 id="cookie-consent-title" className="text-lg font-semibold mb-1">
                {t('cookieConsent.title')}
              </h2>
              <p id="cookie-consent-description" className="text-sm text-muted-foreground">
                {t('cookieConsent.description')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowDetails(true)}
                className="px-4 py-2 text-sm border rounded-md hover:bg-accent"
              >
                {t('cookieConsent.manageCookies')}
              </button>
              <button
                onClick={acceptNecessary}
                className="px-4 py-2 text-sm border rounded-md hover:bg-accent"
              >
                {t('cookieConsent.necessaryOnly')}
              </button>
              <button
                onClick={acceptAll}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                {t('cookieConsent.acceptAll')}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t('cookieConsent.manageCookies')}</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {t('common.back')}
              </button>
            </div>

            {/* Necessary Cookies */}
            <CookieCategoryRow
              title={t('cookieConsent.categories.necessary.title')}
              description={t('cookieConsent.categories.necessary.description')}
              checked={true}
              disabled={true}
              onChange={() => {}}
            />

            {/* Analytics Cookies */}
            <CookieCategoryRow
              title={t('cookieConsent.categories.analytics.title')}
              description={t('cookieConsent.categories.analytics.description')}
              checked={preferences.analytics}
              onChange={() => handleToggleCategory('analytics')}
            />

            {/* Marketing Cookies */}
            <CookieCategoryRow
              title={t('cookieConsent.categories.marketing.title')}
              description={t('cookieConsent.categories.marketing.description')}
              checked={preferences.marketing}
              onChange={() => handleToggleCategory('marketing')}
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={acceptAll}
                className="px-4 py-2 text-sm border rounded-md hover:bg-accent"
              >
                {t('cookieConsent.acceptAll')}
              </button>
              <button
                onClick={handleAcceptSelected}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                {t('cookieConsent.savePreferences')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface CookieCategoryRowProps {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}

function CookieCategoryRow({ title, description, checked, disabled, onChange }: CookieCategoryRowProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border">
      <input
        type="checkbox"
        id={`cookie-${title}`}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
      />
      <div className="flex-1">
        <label
          htmlFor={`cookie-${title}`}
          className={`text-sm font-medium ${disabled ? 'text-muted-foreground' : ''}`}
        >
          {title}
        </label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
