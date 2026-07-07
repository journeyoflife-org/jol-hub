'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { cn } from '../lib/utils';

/**
 * GDPR Article 13-14 Privacy Notice Page Template
 * Reusable across all JOL-HUB entity websites
 * 
 * Customizable for:
 * - Entity name, address, contact details
 * - Data Controller information
 * - Specific data processing activities
 */

export interface PrivacyPageProps {
  /** Entity name */
  entityName: string;
  /** Entity name in local language */
  entityNameLocal?: string;
  /** Entity address */
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  /** Contact email */
  contactEmail: string;
  /** Contact phone */
  contactPhone?: string;
  /** DPO email (Data Protection Officer) */
  dpoEmail?: string;
  /** Bitrix24 portal domain */
  bitrix24Domain?: string;
  /** Country code for GDPR jurisdiction */
  countryCode?: string;
  /** Entity type for specific processing activities */
  entityType?: 'catholic' | 'orthodox' | 'protestant' | 'other_christian' | 'funeral' | 'cemetery';
  /** Additional processing activities */
  additionalProcessingActivities?: ProcessingActivity[];
  /** Custom class name */
  className?: string;
  /** Language */
  language?: 'lt' | 'en' | 'uk' | 'pl' | 'de';
  /** Show last updated date */
  lastUpdated?: string;
}

interface ProcessingActivity {
  name: string;
  purpose: string;
  legalBasis: string;
  dataCategories: string[];
  retentionPeriod: string;
  recipients: string[];
}

const translations = {
  lt: {
    title: 'Privatumo politika',
    subtitle: 'GDPR informacija apie asmens duomenų tvarkymą',
    lastUpdated: 'Paskutinį kartą atnaujinta',
    dataController: 'Duomenų valdytojas',
    contactDetails: 'Kontaktiniai duomenys',
    dpo: 'Duomenų apsaugos pareigūnas',
    processingActivities: 'Duomenų tvarkymo veiklos',
    legalBasis: 'Teisinis pagrindas',
    dataCategories: 'Duomenų kategorijos',
    retentionPeriod: 'Saugojimo laikotarpis',
    recipients: 'Gavėjai',
    yourRights: 'Jūsų teisės',
    rightOfAccess: 'Prieigos teisė',
    rightToRectification: 'Teisė taisyti',
    rightToErasure: 'Teisė būti ištrintam',
    rightToPortability: 'Teisė perkelti duomenis',
    rightToObject: 'Teisė prieštarauti',
    rightToRestrict: 'Teisė apriboti tvarkymą',
    cookies: 'Slapukai',
    cookiePolicy: 'Slapukų politika',
    changes: 'Pakeitimai',
    contactUs: 'Susisiekite su mumis',
  },
  en: {
    title: 'Privacy Policy',
    subtitle: 'GDPR Information on Personal Data Processing',
    lastUpdated: 'Last updated',
    dataController: 'Data Controller',
    contactDetails: 'Contact Details',
    dpo: 'Data Protection Officer',
    processingActivities: 'Processing Activities',
    legalBasis: 'Legal Basis',
    dataCategories: 'Data Categories',
    retentionPeriod: 'Retention Period',
    recipients: 'Recipients',
    yourRights: 'Your Rights',
    rightOfAccess: 'Right of Access',
    rightToRectification: 'Right to Rectification',
    rightToErasure: 'Right to Erasure',
    rightToPortability: 'Right to Data Portability',
    rightToObject: 'Right to Object',
    rightToRestrict: 'Right to Restrict Processing',
    cookies: 'Cookies',
    cookiePolicy: 'Cookie Policy',
    changes: 'Changes',
    contactUs: 'Contact Us',
  },
  uk: {
    title: 'Політика конфіденційності',
    subtitle: 'Інформація GDPR про обробку персональних даних',
    lastUpdated: 'Останнє оновлення',
    dataController: 'Адміністратор даних',
    contactDetails: 'Контактні дані',
    dpo: 'Посадова особа із захисту даних',
    processingActivities: 'Дії з обробки даних',
    legalBasis: 'Правова основа',
    dataCategories: 'Категорії даних',
    retentionPeriod: 'Термін зберігання',
    recipients: 'Отримувачі',
    yourRights: 'Ваші права',
    rightOfAccess: 'Право доступу',
    rightToRectification: 'Право на виправлення',
    rightToErasure: 'Право на видалення',
    rightToPortability: 'Право на перенесення даних',
    rightToObject: 'Право на заперечення',
    rightToRestrict: 'Право на обмеження обробки',
    cookies: 'Файли cookie',
    cookiePolicy: 'Політика файлів cookie',
    changes: 'Зміни',
    contactUs: "Зв'яжіться з нами",
  },
};

const defaultProcessingActivities: ProcessingActivity[] = [
  {
    name: 'Parishioner Registration',
    purpose: 'Management of parish membership and sacramental records',
    legalBasis: 'GDPR Art. 6(1)(e) - Public interest; Art. 9(2)(d) - Religious purposes',
    dataCategories: ['Name', 'Address', 'Phone', 'Email', 'Family members', 'Sacramental records'],
    retentionPeriod: 'Permanent (sacramental records); 10 years (membership data)',
    recipients: ['Diocese', 'Parish clergy', 'Bitrix24 CRM'],
  },
  {
    name: 'Donation Processing',
    purpose: 'Processing donations and issuing tax receipts',
    legalBasis: 'GDPR Art. 6(1)(b) - Contract performance; Art. 6(1)(c) - Legal obligation',
    dataCategories: ['Name', 'Address', 'Payment details', 'Donation amount', 'Date'],
    retentionPeriod: '7 years (financial records)',
    recipients: ['Payment processor', 'Tax authorities', 'Bitrix24 CRM'],
  },
  {
    name: 'Event Registration',
    purpose: 'Managing event participation and communications',
    legalBasis: 'GDPR Art. 6(1)(a) - Consent',
    dataCategories: ['Name', 'Email', 'Phone', 'Event preferences'],
    retentionPeriod: '3 years after event',
    recipients: ['Event organizers', 'Bitrix24 CRM'],
  },
  {
    name: 'Newsletter Subscriptions',
    purpose: 'Sending parish newsletters and updates',
    legalBasis: 'GDPR Art. 6(1)(a) - Consent',
    dataCategories: ['Name', 'Email'],
    retentionPeriod: 'Until consent withdrawn',
    recipients: ['Email service provider', 'Bitrix24 CRM'],
  },
];

export function PrivacyPage({
  entityName,
  entityNameLocal,
  address,
  contactEmail,
  contactPhone,
  dpoEmail,
  bitrix24Domain,
  countryCode: _countryCode = 'lt',
  entityType: _entityType = 'catholic',
  additionalProcessingActivities = [],
  className,
  language = 'lt',
  lastUpdated,
}: PrivacyPageProps) {
  const t = translations[language as keyof typeof translations] ?? translations.en;
  
  const allProcessingActivities = [...defaultProcessingActivities, ...additionalProcessingActivities];
  
  const displayDate = lastUpdated || new Date().toISOString().split('T')[0];

  return (
    <div className={cn('max-w-4xl mx-auto space-y-8 py-8', className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">{t.title}</h1>
        {entityNameLocal && (
          <p className="text-lg text-gray-600">{entityNameLocal}</p>
        )}
        <p className="text-sm text-gray-500">{t.lastUpdated}: {displayDate}</p>
      </div>

      {/* Data Controller */}
      <Card>
        <CardHeader>
          <CardTitle>{t.dataController}</CardTitle>
          <CardDescription>{t.contactDetails}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium">{entityName}</p>
            <p className="text-sm text-gray-600">
              {address.street}<br />
              {address.postalCode} {address.city}, {address.country}
            </p>
          </div>
          
          <div className="space-y-1 text-sm">
            <p>📧 {contactEmail}</p>
            {contactPhone && <p>📞 {contactPhone}</p>}
            {dpoEmail && <p>🔒 DPO: {dpoEmail}</p>}
          </div>

          {bitrix24Domain && (
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600">
                CRM System: {bitrix24Domain} (Bitrix24 EU)
              </p>
              <p className="text-xs text-gray-500 mt-1">
                All data stored in EU data centers for GDPR compliance
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Activities */}
      <Card>
        <CardHeader>
          <CardTitle>{t.processingActivities}</CardTitle>
          <CardDescription>GDPR Article 30 - Records of Processing Activities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {allProcessingActivities.map((activity, index) => (
            <div key={index} className="space-y-3 pb-6 border-b last:border-0 last:pb-0">
              <h3 className="font-semibold text-lg">{activity.name}</h3>
              
              <div className="grid gap-3 text-sm">
                <div>
                  <span className="font-medium">Purpose:</span> {activity.purpose}
                </div>
                
                <div>
                  <span className="font-medium">{t.legalBasis}:</span>
                  <p className="text-gray-600 mt-1">{activity.legalBasis}</p>
                </div>
                
                <div>
                  <span className="font-medium">{t.dataCategories}:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {activity.dataCategories.map((cat, i) => (
                      <Badge key={i} variant="secondary">{cat}</Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <span className="font-medium">{t.retentionPeriod}:</span> {activity.retentionPeriod}
                </div>
                
                <div>
                  <span className="font-medium">{t.recipients}:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {activity.recipients.map((rec, i) => (
                      <Badge key={i} variant="outline">{rec}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Your Rights */}
      <Card>
        <CardHeader>
          <CardTitle>{t.yourRights}</CardTitle>
          <CardDescription>GDPR Articles 15-22</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium">{t.rightOfAccess}</h4>
                <p className="text-sm text-gray-600">
                  Request a copy of your personal data (Art. 15)
                </p>
              </div>
              <div>
                <h4 className="font-medium">{t.rightToRectification}</h4>
                <p className="text-sm text-gray-600">
                  Correct inaccurate personal data (Art. 16)
                </p>
              </div>
              <div>
                <h4 className="font-medium">{t.rightToErasure}</h4>
                <p className="text-sm text-gray-600">
                  Request deletion of your data (Art. 17)
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium">{t.rightToPortability}</h4>
                <p className="text-sm text-gray-600">
                  Receive data in portable format (Art. 20)
                </p>
              </div>
              <div>
                <h4 className="font-medium">{t.rightToObject}</h4>
                <p className="text-sm text-gray-600">
                  Object to processing (Art. 21)
                </p>
              </div>
              <div>
                <h4 className="font-medium">{t.rightToRestrict}</h4>
                <p className="text-sm text-gray-600">
                  Request processing limitation (Art. 18)
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t">
            <p className="text-sm">
              To exercise your rights, contact us at{' '}
              <a href={`mailto:${contactEmail}`} className="text-blue-600 hover:underline">
                {contactEmail}
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cookies */}
      <Card>
        <CardHeader>
          <CardTitle>{t.cookies}</CardTitle>
          <CardDescription>{t.cookiePolicy}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <p>
            We use cookies to ensure the proper functioning of our website, analyze traffic, 
            and provide personalized content. You can manage your cookie preferences through 
            our cookie consent banner.
          </p>
          <div className="flex gap-4 flex-wrap">
            <Badge variant="secondary">Necessary</Badge>
            <Badge variant="outline">Analytics</Badge>
            <Badge variant="outline">Marketing</Badge>
          </div>
          <p className="text-xs text-gray-500">
            For more information, see our full{' '}
            <a href="/cookies" className="text-blue-600 hover:underline">Cookie Policy</a>.
          </p>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        <p>
          {t.changes}: We may update this policy periodically. Check this page for the latest version.
        </p>
        <p className="mt-2">
          {t.contactUs}:{' '}
          <a href={`mailto:${contactEmail}`} className="text-blue-600 hover:underline">
            {contactEmail}
          </a>
        </p>
      </div>
    </div>
  );
}
