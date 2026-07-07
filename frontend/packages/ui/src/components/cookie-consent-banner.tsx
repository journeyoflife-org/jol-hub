'use client';

import * as React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { Button } from './button';
import { cn } from '../lib/utils';

/**
 * GDPR Cookie Consent Banner
 * Implements GDPR Art. 7 - Conditions for Consent
 * Implements ePrivacy Directive Art. 5(3) - Storage of information
 */

// Consent categories as per GDPR best practices
export type ConsentCategory = 'necessary' | 'analytics' | 'marketing' | 'functional';

export interface ConsentPreferences {
  necessary: boolean;  // Always true - essential for website function
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  timestamp: string;
  version: string;
}

export interface CookieConsentBannerProps {
  /** Callback when consent is updated */
  onConsentChange?: (preferences: ConsentPreferences) => void;
  /** Privacy policy URL */
  privacyPolicyUrl?: string;
  /** Cookie policy URL */
  cookiePolicyUrl?: string;
  /** Language for consent text */
  language?: string;
  /** Consent version for tracking policy changes */
  consentVersion?: string;
  /** Custom class name */
  className?: string;
  /** Position of banner */
  position?: 'bottom' | 'top';
  /** Show detailed settings panel by default */
  showDetails?: boolean;
  /** Local storage key for consent */
  storageKey?: string;
}

// Localized consent texts
const CONSENT_TEXTS: Record<string, {
  title: string;
  description: string;
  acceptAll: string;
  acceptNecessary: string;
  settings: string;
  save: string;
  categories: {
    necessary: { name: string; description: string };
    analytics: { name: string; description: string };
    marketing: { name: string; description: string };
    functional: { name: string; description: string };
  };
}> = {
  lt: {
    title: 'Slapukų sutikimas',
    description: 'Mes naudojame slapukus, kad užtikrintume tinkamą svetainės veikimą ir pagerintume Jūsų naršymo patirtį. Pasirinkite slapukų kategorijas, kurioms sutinkate.',
    acceptAll: 'Sutikti su visais',
    acceptNecessary: 'Tik būtinieji',
    settings: 'Nustatymai',
    save: 'Išsaugoti',
    categories: {
      necessary: { name: 'Būtinieji', description: 'Reikalingi svetainės veikimui. Negali būti išjungti.' },
      analytics: { name: 'Analitiniai', description: 'Padeda mums suprasti, kaip naudojate svetainę.' },
      marketing: { name: 'Rinkodaros', description: 'Naudojami reklamos ir marketingo tikslais.' },
      functional: { name: 'Funkciniai', description: 'Užtikrina papildomas funkcijas, pvz., kalbos pasirinkimą.' },
    },
  },
  en: {
    title: 'Cookie Consent',
    description: 'We use cookies to ensure proper website functionality and improve your browsing experience. Select the cookie categories you consent to.',
    acceptAll: 'Accept All',
    acceptNecessary: 'Necessary Only',
    settings: 'Settings',
    save: 'Save Preferences',
    categories: {
      necessary: { name: 'Necessary', description: 'Required for the website to function. Cannot be disabled.' },
      analytics: { name: 'Analytics', description: 'Help us understand how you use the website.' },
      marketing: { name: 'Marketing', description: 'Used for advertising and marketing purposes.' },
      functional: { name: 'Functional', description: 'Enable additional features like language preference.' },
    },
  },
  pl: {
    title: 'Zgoda na pliki cookie',
    description: 'Używamy plików cookie, aby zapewnić prawidłowe działanie strony i poprawić komfort przeglądania. Wybierz kategorie plików cookie, na które wyrażasz zgodę.',
    acceptAll: 'Akceptuj wszystkie',
    acceptNecessary: 'Tylko niezbędne',
    settings: 'Ustawienia',
    save: 'Zapisz preferencje',
    categories: {
      necessary: { name: 'Niezbędne', description: 'Wymagane do działania strony. Nie można wyłączyć.' },
      analytics: { name: 'Analityczne', description: 'Pomagają nam zrozumieć, jak korzystasz ze strony.' },
      marketing: { name: 'Marketingowe', description: 'Używane do celów reklamowych i marketingowych.' },
      functional: { name: 'Funkcjonalne', description: 'Umożliwiają dodatkowe funkcje, np. wybór języka.' },
    },
  },
  ru: {
    title: 'Согласие на использование файлов cookie',
    description: 'Мы используем файлы cookie для обеспечения надлежащей работы сайта и улучшения вашего опыта просмотра. Выберите категории файлов cookie, на которые вы соглашаетесь.',
    acceptAll: 'Принять все',
    acceptNecessary: 'Только необходимые',
    settings: 'Настройки',
    save: 'Сохранить настройки',
    categories: {
      necessary: { name: 'Необходимые', description: 'Необходимы для работы сайта. Не могут быть отключены.' },
      analytics: { name: 'Аналитические', description: 'Помогают нам понять, как вы используете сайт.' },
      marketing: { name: 'Маркетинговые', description: 'Используются для рекламы и маркетинга.' },
      functional: { name: 'Функциональные', description: 'Обеспечивают дополнительные функции, например, выбор языка.' },
    },
  },
};

const DEFAULT_CONSENT_VERSION = '1.0';
const DEFAULT_STORAGE_KEY = 'jol-cookie-consent';

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

/**
 * Cookie Consent Banner Component
 */
export function CookieConsentBanner({
  onConsentChange,
  privacyPolicyUrl = '/privatumas',
  cookiePolicyUrl: _cookiePolicyUrl = '/slapuku-politika',
  language = 'lt',
  consentVersion = DEFAULT_CONSENT_VERSION,
  className,
  position = 'bottom',
  showDetails = false,
  storageKey = DEFAULT_STORAGE_KEY,
}: CookieConsentBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(showDetails);
  const [preferences, setPreferences] = useState<Omit<ConsentPreferences, 'timestamp' | 'version'>>({
    necessary: true,
    analytics: false,
    marketing: false,
    functional: false,
  });

  const texts = CONSENT_TEXTS[language] ?? CONSENT_TEXTS.en ?? {
    title: 'Cookie Consent',
    description: 'We use cookies to ensure proper website functionality and improve your browsing experience.',
    acceptAll: 'Accept All',
    acceptNecessary: 'Necessary Only',
    settings: 'Settings',
    save: 'Save Preferences',
    categories: {
      necessary: { name: 'Necessary', description: 'Required for the website to function.' },
      analytics: { name: 'Analytics', description: 'Help us understand how you use the website.' },
      marketing: { name: 'Marketing', description: 'Used for advertising and marketing purposes.' },
      functional: { name: 'Functional', description: 'Enable additional features.' },
    },
  };

  useEffect(() => {
    const stored = getStoredConsent(storageKey);
    if (!isConsentValid(stored, consentVersion)) {
      setIsVisible(true);
    }
  }, [consentVersion, storageKey]);

  const handleAcceptAll = useCallback(() => {
    const newConsent: ConsentPreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
      timestamp: new Date().toISOString(),
      version: consentVersion,
    };
    storeConsent(newConsent, storageKey);
    onConsentChange?.(newConsent);
    setIsVisible(false);
  }, [consentVersion, onConsentChange, storageKey]);

  const handleAcceptNecessary = useCallback(() => {
    const newConsent: ConsentPreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
      timestamp: new Date().toISOString(),
      version: consentVersion,
    };
    storeConsent(newConsent, storageKey);
    onConsentChange?.(newConsent);
    setIsVisible(false);
  }, [consentVersion, onConsentChange, storageKey]);

  const handleSavePreferences = useCallback(() => {
    const newConsent: ConsentPreferences = {
      ...preferences,
      timestamp: new Date().toISOString(),
      version: consentVersion,
    };
    storeConsent(newConsent, storageKey);
    onConsentChange?.(newConsent);
    setIsVisible(false);
  }, [preferences, consentVersion, onConsentChange, storageKey]);

  const toggleCategory = useCallback((category: Exclude<keyof typeof preferences, 'necessary'>) => {
    setPreferences(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed left-0 right-0 z-50 bg-white shadow-lg border-t border-gray-200 dark:bg-gray-900 dark:border-gray-700',
        position === 'bottom' ? 'bottom-0' : 'top-0',
        className
      )}
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
    >
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div>
            <h2 id="cookie-consent-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              {texts.title}
            </h2>
            <p id="cookie-consent-description" className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {texts.description}
              {privacyPolicyUrl && (
                <>
                  {' '}
                  <a href={privacyPolicyUrl} className="underline hover:text-gray-900 dark:hover:text-white">
                    {language === 'lt' ? 'Privatumo politika' : 'Privacy Policy'}
                  </a>
                </>
              )}
            </p>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="grid gap-3 sm:grid-cols-2">
              {(Object.keys(texts.categories) as ConsentCategory[]).map(category => (
                <div
                  key={category}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg',
                    category === 'necessary' ? 'bg-gray-50 dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-800'
                  )}
                >
                  <input
                    type="checkbox"
                    id={`cookie-${category}`}
                    checked={preferences[category]}
                    onChange={() => category !== 'necessary' && toggleCategory(category as 'analytics' | 'marketing' | 'functional')}
                    disabled={category === 'necessary'}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <label htmlFor={`cookie-${category}`} className="font-medium text-gray-900 dark:text-white">
                      {texts.categories[category].name}
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {texts.categories[category].description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Button variant="outline" size="sm" onClick={handleAcceptNecessary}>
              {texts.acceptNecessary}
            </Button>
            <Button variant="default" size="sm" onClick={handleAcceptAll}>
              {texts.acceptAll}
            </Button>
            {!showSettings ? (
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
                {texts.settings}
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={handleSavePreferences}>
                {texts.save}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CookieConsentBanner;
