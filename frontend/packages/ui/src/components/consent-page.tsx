'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Input } from './input';
import { Badge } from './badge';
import { Separator } from './separator';
import { Checkbox } from './checkbox';
import { cn } from '../lib/utils';

/**
 * GDPR Article 7 Consent Management Page
 * Allows users to view, grant, and withdraw consent
 */

export interface ConsentPageProps {
  /** Entity name */
  entityName: string;
  /** Contact email */
  contactEmail: string;
  /** Current consent status (fetched from API) */
  currentConsents?: ConsentStatus[];
  /** Callback when consent is updated */
  onConsentUpdate?: (consents: ConsentPreferences) => Promise<void>;
  /** Custom class name */
  className?: string;
  /** Language */
  language?: 'lt' | 'en' | 'uk';
}

interface ConsentStatus {
  type: 'marketing' | 'analytics' | 'third_party' | 'newsletter';
  granted: boolean;
  grantedAt?: string;
  withdrawnAt?: string;
}

interface ConsentPreferences {
  marketing: boolean;
  analytics: boolean;
  thirdParty: boolean;
  newsletter: boolean;
}

interface ConsentOption {
  id: keyof ConsentPreferences;
  title: string;
  description: string;
  legalBasis: string;
}

const consentOptions: Record<string, ConsentOption[]> = {
  lt: [
    {
      id: 'newsletter',
      title: 'Naujienlaiškis',
      description: 'Gauti naujienas ir atnaujinimus apie parapijos veiklą',
      legalBasis: 'Sutikimas (GDPR 6(1)(a))',
    },
    {
      id: 'marketing',
      title: 'Rinkodara',
      description: 'Gauti pasiūlymus apie renginius ir parduotuvės prekes',
      legalBasis: 'Sutikimas (GDPR 6(1)(a))',
    },
    {
      id: 'analytics',
      title: 'Analitiniai slapukai',
      description: 'Leisti analizuoti svetainės naudojimą statistikos tikslais',
      legalBasis: 'Sutikimas (GDPR 6(1)(a))',
    },
    {
      id: 'thirdParty',
      title: 'Trečiųjų šalių bendrinimas',
      description: 'Leisti bendrinti duomenis su partneriais (pvz., vyskupija)',
      legalBasis: 'Sutikimas (GDPR 6(1)(a))',
    },
  ],
  en: [
    {
      id: 'newsletter',
      title: 'Newsletter',
      description: 'Receive news and updates about parish activities',
      legalBasis: 'Consent (GDPR 6(1)(a))',
    },
    {
      id: 'marketing',
      title: 'Marketing',
      description: 'Receive offers about events and shop items',
      legalBasis: 'Consent (GDPR 6(1)(a))',
    },
    {
      id: 'analytics',
      title: 'Analytics Cookies',
      description: 'Allow website usage analysis for statistical purposes',
      legalBasis: 'Consent (GDPR 6(1)(a))',
    },
    {
      id: 'thirdParty',
      title: 'Third-Party Sharing',
      description: 'Allow sharing data with partners (e.g., diocese)',
      legalBasis: 'Consent (GDPR 6(1)(a))',
    },
  ],
  uk: [
    {
      id: 'newsletter',
      title: 'Новини',
      description: 'Отримувати новини та оновлення про діяльність парафії',
      legalBasis: 'Згода (GDPR 6(1)(a))',
    },
    {
      id: 'marketing',
      title: 'Маркетинг',
      description: 'Отримувати пропозиції про події та товари магазину',
      legalBasis: 'Згода (GDPR 6(1)(a))',
    },
    {
      id: 'analytics',
      title: 'Аналітичні файли cookie',
      description: 'Дозволити аналіз використання сайту для статистики',
      legalBasis: 'Згода (GDPR 6(1)(a))',
    },
    {
      id: 'thirdParty',
      title: 'Передача третім особам',
      description: 'Дозволити обмін даними з партнерами (наприклад, єпархією)',
      legalBasis: 'Згода (GDPR 6(1)(a))',
    },
  ],
};

const translations = {
  lt: {
    title: 'Sutikimo valdymas',
    subtitle: 'Valdykite savo duomenų tvarkymo sutikimus',
    yourConsents: 'Jūsų sutikimai',
    currentStatus: 'Dabartinė būsena',
    updateConsents: 'Atnaujinti sutikimus',
    withdrawAll: 'Atšaukti visus sutikimus',
    saveChanges: 'Išsaugoti pakeitimus',
    saved: 'Išsaugota',
    notSet: 'Nenustatyta',
    granted: 'Suteikta',
    withdrawn: 'Atšaukta',
    legalBasis: 'Teisinis pagrindas',
    identifyYourself: 'Identifikuokite save',
    enterEmail: 'Įveskite savo el. pašto adresą sutikimams peržiūrėti',
    emailLabel: 'El. paštas',
    submitEmail: 'Peržiūrėti sutikimus',
    noConsentsFound: 'Sutikimų nerasta šiam el. paštui',
    consentWithdrawn: 'Sutikimas atšauktas',
    consentGranted: 'Sutikimas suteiktas',
  },
  en: {
    title: 'Consent Management',
    subtitle: 'Manage your data processing consents',
    yourConsents: 'Your Consents',
    currentStatus: 'Current Status',
    updateConsents: 'Update Consents',
    withdrawAll: 'Withdraw All Consents',
    saveChanges: 'Save Changes',
    saved: 'Saved',
    notSet: 'Not Set',
    granted: 'Granted',
    withdrawn: 'Withdrawn',
    legalBasis: 'Legal Basis',
    identifyYourself: 'Identify Yourself',
    enterEmail: 'Enter your email address to view consents',
    emailLabel: 'Email',
    submitEmail: 'View Consents',
    noConsentsFound: 'No consents found for this email',
    consentWithdrawn: 'Consent withdrawn',
    consentGranted: 'Consent granted',
  },
  uk: {
    title: 'Управління згодою',
    subtitle: 'Керуйте своїми згодами на обробку даних',
    yourConsents: 'Ваші згоди',
    currentStatus: 'Поточний статус',
    updateConsents: 'Оновити згоди',
    withdrawAll: 'Відкликати всі згоди',
    saveChanges: 'Зберегти зміни',
    saved: 'Збережено',
    notSet: 'Не встановлено',
    granted: 'Надано',
    withdrawn: 'Відкликано',
    legalBasis: 'Правова основа',
    identifyYourself: 'Ідентифікуйте себе',
    enterEmail: 'Введіть адресу електронної пошти для перегляду згод',
    emailLabel: 'Електронна пошта',
    submitEmail: 'Переглянути згоди',
    noConsentsFound: 'Згоди для цієї електронної пошти не знайдено',
    consentWithdrawn: 'Згода відкликана',
    consentGranted: 'Згода надана',
  },
};

export function ConsentPage({
  entityName,
  contactEmail,
  currentConsents = [],
  onConsentUpdate,
  className,
  language = 'lt',
}: ConsentPageProps) {
  const t = translations[language] ?? translations.en;
  const options = consentOptions[language] ?? consentOptions.en ?? [];
  
  const [email, setEmail] = useState('');
  const [isIdentified, setIsIdentified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [consents, setConsents] = useState<ConsentPreferences>({
    newsletter: false,
    marketing: false,
    analytics: false,
    thirdParty: false,
  });

  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // In production, fetch consents from API
    // For now, simulate with currentConsents
    setTimeout(() => {
      const initialConsents: ConsentPreferences = {
        newsletter: currentConsents.find(c => c.type === 'newsletter')?.granted ?? false,
        marketing: currentConsents.find(c => c.type === 'marketing')?.granted ?? false,
        analytics: currentConsents.find(c => c.type === 'analytics')?.granted ?? false,
        thirdParty: currentConsents.find(c => c.type === 'third_party')?.granted ?? false,
      };
      setConsents(initialConsents);
      setIsIdentified(true);
      setIsLoading(false);
    }, 500);
  };

  const handleToggle = (id: keyof ConsentPreferences) => {
    setConsents(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    if (onConsentUpdate) {
      await onConsentUpdate(consents);
    }
    setIsLoading(false);
  };

  const handleWithdrawAll = async () => {
    setIsLoading(true);
    const allWithdrawn: ConsentPreferences = {
      newsletter: false,
      marketing: false,
      analytics: false,
      thirdParty: false,
    };
    setConsents(allWithdrawn);
    if (onConsentUpdate) {
      await onConsentUpdate(allWithdrawn);
    }
    setIsLoading(false);
  };

  return (
    <div className={cn('max-w-3xl mx-auto space-y-8 py-8', className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">{t.title}</h1>
        <p className="text-gray-600">{t.subtitle}</p>
        <p className="text-sm text-gray-500">{entityName}</p>
      </div>

      {!isIdentified ? (
        /* Identification Form */
        <Card>
          <CardHeader>
            <CardTitle>{t.identifyYourself}</CardTitle>
            <CardDescription>{t.enterEmail}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleIdentify} className="space-y-4">
              <div>
                <label htmlFor="email" className="text-sm font-medium">
                  {t.emailLabel}
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="mt-1"
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? '...' : t.submitEmail}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        /* Consent Management */
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t.yourConsents}</CardTitle>
              <CardDescription>
                {email} - <span className="text-gray-500">GDPR Art. 7</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {options.map((option) => (
                <div key={option.id} className="flex items-start gap-4 p-4 rounded-lg border">
                  <Checkbox
                    id={option.id}
                    checked={consents[option.id]}
                    onCheckedChange={() => handleToggle(option.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <label htmlFor={option.id} className="font-medium cursor-pointer">
                        {option.title}
                      </label>
                      <Badge variant={consents[option.id] ? 'default' : 'outline'}>
                        {consents[option.id] ? t.granted : t.withdrawn}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                    <p className="text-xs text-gray-500 mt-2">{t.legalBasis}: {option.legalBasis}</p>
                  </div>
                </div>
              ))}

              <Separator />

              <div className="flex gap-4">
                <Button onClick={handleSave} disabled={isLoading} className="flex-1">
                  {isLoading ? '...' : t.saveChanges}
                </Button>
                <Button 
                  onClick={handleWithdrawAll} 
                  disabled={isLoading} 
                  variant="outline"
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  {t.withdrawAll}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-gray-500">
            <p>
              Questions? Contact us at{' '}
              <a href={`mailto:${contactEmail}`} className="text-blue-600 hover:underline">
                {contactEmail}
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
