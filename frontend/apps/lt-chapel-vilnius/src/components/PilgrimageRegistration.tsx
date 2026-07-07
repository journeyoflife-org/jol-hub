'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Badge, cn } from '@jol-hub/ui';
import { entityConfig } from '@/config/entity';

export interface PilgrimageRegistration {
  groupSize: number;
  contactName: string;
  email: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
  language: 'lt' | 'en' | 'pl' | 'ru';
  specialRequests?: string;
  needsGuide: boolean;
}

export interface PilgrimageRegistrationProps {
  onSubmit?: (registration: PilgrimageRegistration) => void;
  className?: string;
}

const LANGUAGES = [
  { code: 'lt', name: 'Lietuvių', flag: '🇱🇹' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
] as const;

const TIME_SLOTS = [
  '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '14:00', '15:00', '16:00', '17:00', '17:30',
];

export function PilgrimageRegistration({ onSubmit, className }: PilgrimageRegistrationProps) {
  const [step, setStep] = useState(1);
  const [groupSize, setGroupSize] = useState(1);
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [language, setLanguage] = useState<'lt' | 'en' | 'pl' | 'ru'>('lt');
  const [specialRequests, setSpecialRequests] = useState('');
  const [needsGuide, setNeedsGuide] = useState(false);

  const handleSubmit = () => {
    const registration: PilgrimageRegistration = {
      groupSize,
      contactName,
      email,
      phone,
      preferredDate,
      preferredTime,
      language,
      specialRequests: specialRequests || undefined,
      needsGuide,
    };

    onSubmit?.(registration);

    // Reset form
    setStep(1);
    setGroupSize(1);
    setContactName('');
    setEmail('');
    setPhone('');
    setPreferredDate('');
    setPreferredTime('');
    setLanguage('lt');
    setSpecialRequests('');
    setNeedsGuide(false);
  };

  const isStep1Valid = groupSize > 0 && contactName && email;
  const isStep2Valid = preferredDate && preferredTime && language;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-heading">Piligrimystė / Pilgrimage</CardTitle>
        <p className="text-sm text-gray-600">
          {entityConfig.name.lt} - {entityConfig.shrineInfo.famousFor.lt}
        </p>
      </CardHeader>

      <CardContent className="p-4">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
                step >= s
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-600'
              )}
            >
              {s}
            </div>
          ))}
        </div>

        {/* Step 1: Contact Information */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Kontaktai / Contact Information</h3>

            <div>
              <label className="block text-sm font-medium mb-2">
                Grupės dydis / Group size <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setGroupSize(Math.max(1, groupSize - 1))}
                  disabled={groupSize <= 1}
                >
                  -
                </Button>
                <span className="text-2xl font-bold w-12 text-center">{groupSize}</span>
                <Button
                  variant="outline"
                  onClick={() => setGroupSize(groupSize + 1)}
                >
                  +
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Kontaktinis asmuo / Contact person <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Vardas Pavardė / Name Surname"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                El. paštas / Email <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Telefonas / Phone</label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+370 XXX XXXXX"
                className="w-full"
              />
            </div>

            <Button
              className="w-full mt-4"
              disabled={!isStep1Valid}
              onClick={() => setStep(2)}
            >
              Tęsti / Continue
            </Button>
          </div>
        )}

        {/* Step 2: Visit Details */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Apsilankymo informacija / Visit Details</h3>

            <div>
              <label className="block text-sm font-medium mb-2">
                Pageidaujama data / Preferred date <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Pageidaujamas laikas / Preferred time <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {TIME_SLOTS.map((time) => (
                  <Button
                    key={time}
                    variant={preferredTime === time ? 'default' : 'outline'}
                    onClick={() => setPreferredTime(time)}
                    className="text-sm"
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Kalba / Language <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {LANGUAGES.map((lang) => (
                  <Button
                    key={lang.code}
                    variant={language === lang.code ? 'default' : 'outline'}
                    onClick={() => setLanguage(lang.code)}
                    className="text-sm"
                  >
                    {lang.flag} {lang.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="needsGuide"
                checked={needsGuide}
                onChange={(e) => setNeedsGuide(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="needsGuide" className="text-sm">
                Reikia gido / Need a guide
              </label>
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Atgal / Back
              </Button>
              <Button
                className="flex-1"
                disabled={!isStep2Valid}
                onClick={() => setStep(3)}
              >
                Tęsti / Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Patvirtinimas / Confirmation</h3>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
              <p className="text-sm">
                <strong>Grupė:</strong> {groupSize} asmenys
              </p>
              <p className="text-sm">
                <strong>Kontaktas:</strong> {contactName}
              </p>
              <p className="text-sm">
                <strong>El. paštas:</strong> {email}
              </p>
              {phone && (
                <p className="text-sm">
                  <strong>Telefonas:</strong> {phone}
                </p>
              )}
              <p className="text-sm">
                <strong>Data:</strong> {preferredDate}
              </p>
              <p className="text-sm">
                <strong>Laikas:</strong> {preferredTime}
              </p>
              <p className="text-sm">
                <strong>Kalba:</strong> {LANGUAGES.find(l => l.code === language)?.name}
              </p>
              {needsGuide && (
                <Badge className="bg-liturgical-purple text-white">Reikia gido</Badge>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Specialūs poreikiai / Special requests
              </label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Įrašykite specialius poreikius ar pageidavimus..."
                className="w-full p-2 border rounded-lg"
                rows={3}
              />
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Atgal / Back
              </Button>
              <Button
                className="flex-1 bg-liturgical-gold text-gray-900 hover:bg-liturgical-gold/90"
                onClick={handleSubmit}
              >
                Registruotis / Register
              </Button>
            </div>
          </div>
        )}

        {/* Shrine Info */}
        <div className="mt-6 p-4 bg-liturgical-gold/10 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Apie šventovę / About the Shrine</h4>
          <p className="text-xs text-gray-600">
            {entityConfig.shrineInfo.famousFor.lt}
            <br />
            <br />
            Metinis piligrimų skaičius: {entityConfig.statistics.annualPilgrims.toLocaleString()}
            <br />
            {entityConfig.shrineInfo.pilgrimageSeason}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default PilgrimageRegistration;
