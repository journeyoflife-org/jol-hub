/**
 * Cookie consent texts + types — extracted from cookie-consent-banner
 * (STEP 3 250-line rule). Localized strings for GDPR Art. 7 consent.
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

export interface ConsentTexts {
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
}

// Localized consent texts
export const CONSENT_TEXTS: Record<string, ConsentTexts> = {
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

/** Fallback when the requested language has no catalog entry. */
export const FALLBACK_CONSENT_TEXTS: ConsentTexts = {
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
