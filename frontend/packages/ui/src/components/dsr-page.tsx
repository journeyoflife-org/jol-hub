'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Input } from './input';
import { Textarea } from './textarea';
import { cn } from '../lib/utils';

/**
 * GDPR Articles 15-22 Data Subject Request Forms
 * Allows users to submit DSR requests (access, rectification, erasure, portability)
 */

export interface DSRPageProps {
  /** Entity name */
  entityName: string;
  /** Contact email */
  contactEmail: string;
  /** API endpoint for DSR submission */
  apiEndpoint?: string;
  /** Custom class name */
  className?: string;
  /** Language */
  language?: 'lt' | 'en' | 'uk';
  /** Callback when DSR is submitted */
  onSubmit?: (request: DSRRequest) => Promise<void>;
}

interface DSRRequest {
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  description: string;
  identityDocument?: File | null;
}

const translations = {
  lt: {
    title: 'Duomenų subjekto teisės',
    subtitle: 'GDPR 15-22 straipsniai - Pateikite užklausą dėl savo duomenų',
    selectRequestType: 'Pasirinkite užklausos tipą',
    yourDetails: 'Jūsų duomenys',
    description: 'Aprašymas',
    submit: 'Pateikti užklausą',
    submitting: 'Pateikiama...',
    submitted: 'Užklausa pateikta!',
    submittedDescription: 'Mes atsakysime per 30 dienų pagal GDPR reikalavimus.',
    contactForHelp: 'Jei reikia pagalbos, susisiekite:',
    requestTypes: {
      access: {
        title: 'Prieigos teisė (Art. 15)',
        description: 'Gauti savo asmens duomenų kopiją',
      },
      rectification: {
        title: 'Taisymo teisė (Art. 16)',
        description: 'Ištaisyti netikslius duomenis',
      },
      erasure: {
        title: 'Ištrynimo teisė (Art. 17)',
        description: 'Prašyti ištrinti savo duomenis',
      },
      portability: {
        title: 'Perkėlimo teisė (Art. 20)',
        description: 'Gauti duomenis perkėlimui kitur',
      },
      restriction: {
        title: 'Apribojimo teisė (Art. 18)',
        description: 'Apriboti duomenų tvarkymą',
      },
      objection: {
        title: 'Prieštaravimo teisė (Art. 21)',
        description: 'Prieštarauti duomenų tvarkymui',
      },
    },
    form: {
      firstName: 'Vardas',
      lastName: 'Pavardė',
      email: 'El. paštas',
      phone: 'Telefonas (neprivaloma)',
      descriptionLabel: 'Užklausos aprašymas',
      descriptionPlaceholder: 'Aprašykite savo užklausą...',
      identityDocument: 'Tapatybės dokumentas (neprivaloma)',
    },
    warnings: {
      erasure: '⚠️ Įspėjimas: Ištrynus duomenis, prarasite prieigą prie visų paslaugų. Kai kurie duomenys gali būti saugomi pagal teisinius reikalavimus.',
      sacramental: '📋 Pastaba: Sakramentiniai įrašai (Krikštas, Vedybos, Kunigystė) yra saugomi nuolat pagal Kanonų teisę ir negali būti ištrinti.',
    },
  },
  en: {
    title: 'Data Subject Rights',
    subtitle: 'GDPR Articles 15-22 - Submit a request regarding your data',
    selectRequestType: 'Select Request Type',
    yourDetails: 'Your Details',
    description: 'Description',
    submit: 'Submit Request',
    submitting: 'Submitting...',
    submitted: 'Request Submitted!',
    submittedDescription: 'We will respond within 30 days as required by GDPR.',
    contactForHelp: 'If you need help, contact:',
    requestTypes: {
      access: {
        title: 'Right of Access (Art. 15)',
        description: 'Obtain a copy of your personal data',
      },
      rectification: {
        title: 'Right to Rectification (Art. 16)',
        description: 'Correct inaccurate data',
      },
      erasure: {
        title: 'Right to Erasure (Art. 17)',
        description: 'Request deletion of your data',
      },
      portability: {
        title: 'Right to Portability (Art. 20)',
        description: 'Receive data in portable format',
      },
      restriction: {
        title: 'Right to Restriction (Art. 18)',
        description: 'Restrict data processing',
      },
      objection: {
        title: 'Right to Object (Art. 21)',
        description: 'Object to data processing',
      },
    },
    form: {
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      phone: 'Phone (optional)',
      descriptionLabel: 'Request Description',
      descriptionPlaceholder: 'Describe your request...',
      identityDocument: 'Identity Document (optional)',
    },
    warnings: {
      erasure: '⚠️ Warning: Deleting your data will remove access to all services. Some data may be retained for legal requirements.',
      sacramental: '📋 Note: Sacramental records (Baptism, Marriage, Holy Orders) are retained permanently under Canon Law and cannot be deleted.',
    },
  },
  uk: {
    title: 'Права суб\'єкта даних',
    subtitle: 'Статті GDPR 15-22 - Подайте запит щодо своїх даних',
    selectRequestType: 'Оберіть тип запиту',
    yourDetails: 'Ваші дані',
    description: 'Опис',
    submit: 'Подати запит',
    submitting: 'Подання...',
    submitted: 'Запит подано!',
    submittedDescription: 'Ми відповімо протягом 30 днів згідно з GDPR.',
    contactForHelp: 'Якщо потрібна допомога, зверніться:',
    requestTypes: {
      access: {
        title: 'Право доступу (Art. 15)',
        description: 'Отримати копію своїх персональних даних',
      },
      rectification: {
        title: 'Право на виправлення (Art. 16)',
        description: 'Виправити неточні дані',
      },
      erasure: {
        title: 'Право на видалення (Art. 17)',
        description: 'Попросити видалення своїх даних',
      },
      portability: {
        title: 'Право на перенесення (Art. 20)',
        description: 'Отримати дані у переносному форматі',
      },
      restriction: {
        title: 'Право на обмеження (Art. 18)',
        description: 'Обмежити обробку даних',
      },
      objection: {
        title: 'Право на заперечення (Art. 21)',
        description: 'Заперечити проти обробки даних',
      },
    },
    form: {
      firstName: "Ім'я",
      lastName: 'Прізвище',
      email: 'Електронна пошта',
      phone: 'Телефон (необов\'язково)',
      descriptionLabel: 'Опис запиту',
      descriptionPlaceholder: 'Опишіть свій запит...',
      identityDocument: 'Документ про особу (необов\'язково)',
    },
    warnings: {
      erasure: '⚠️ Попередження: Видалення даних призведе до втрати доступу до всіх послуг. Деякі дані можуть зберігатися за юридичних вимог.',
      sacramental: '📋 Примітка: Таїнні записи (Хрещення, Шлюб, Священство) зберігаються постійно згідно з Канонічним правом і не можуть бути видалені.',
    },
  },
};

export function DSRPage({
  entityName,
  contactEmail,
  apiEndpoint,
  className,
  language = 'lt',
  onSubmit,
}: DSRPageProps) {
  const t = translations[language] || translations.en;
  
  const [requestType, setRequestType] = useState<DSRRequest['type']>('access');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const request: DSRRequest = {
      type: requestType,
      firstName,
      lastName,
      email,
      phone: phone || undefined,
      description,
    };

    if (onSubmit) {
      await onSubmit(request);
    } else if (apiEndpoint) {
      await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
    }

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className={cn('max-w-2xl mx-auto py-8', className)}>
        <Card className="text-center">
          <CardContent className="pt-8 pb-8">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-2">{t.submitted}</h2>
            <p className="text-gray-600 mb-6">{t.submittedDescription}</p>
            <p className="text-sm text-gray-500">
              {t.contactForHelp}{' '}
              <a href={`mailto:${contactEmail}`} className="text-blue-600 hover:underline">
                {contactEmail}
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('max-w-3xl mx-auto space-y-8 py-8', className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">{t.title}</h1>
        <p className="text-gray-600">{t.subtitle}</p>
        <p className="text-sm text-gray-500">{entityName}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Request Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle>{t.selectRequestType}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {Object.entries(t.requestTypes).map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRequestType(key as DSRRequest['type'])}
                  className={cn(
                    'p-4 rounded-lg border text-left transition-all',
                    requestType === key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="font-medium">{value.title}</div>
                  <div className="text-sm text-gray-600">{value.description}</div>
                </button>
              ))}
            </div>

            {/* Warnings */}
            {requestType === 'erasure' && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">{t.warnings.erasure}</p>
                <p className="text-sm text-yellow-700 mt-2">{t.warnings.sacramental}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Personal Details */}
        <Card>
          <CardHeader>
            <CardTitle>{t.yourDetails}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="text-sm font-medium">
                  {t.form.firstName} *
                </label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="text-sm font-medium">
                  {t.form.lastName} *
                </label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-medium">
                {t.form.email} *
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="phone" className="text-sm font-medium">
                {t.form.phone}
              </label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>{t.description}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="description" className="text-sm font-medium">
                {t.form.descriptionLabel} *
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.form.descriptionPlaceholder}
                required
                className="mt-1 min-h-[120px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
          {isSubmitting ? t.submitting : t.submit}
        </Button>

        <p className="text-center text-sm text-gray-500">
          {t.contactForHelp}{' '}
          <a href={`mailto:${contactEmail}`} className="text-blue-600 hover:underline">
            {contactEmail}
          </a>
        </p>
      </form>
    </div>
  );
}
