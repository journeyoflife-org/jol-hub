'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, cn } from '@jol-hub/ui';
import { entityConfig } from '@/config/entity';

export interface OblationInquiry {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  occupation?: string;
  parishAffiliation: string;
  benedictineExperience: 'none' | 'some' | 'extensive';
  motivation: string;
  preferredContactMethod: 'email' | 'phone';
  preferredLanguage: 'lt' | 'en';
  consentDataProcessing: boolean;
}

export interface OblationProgramProps {
  onSubmit?: (inquiry: OblationInquiry) => void;
  className?: string;
}

const EXPERIENCE_LEVELS = [
  { id: 'none', nameLt: 'Nėra patirties', nameEn: 'No experience' },
  { id: 'some', nameLt: 'Šiek tiek patirties', nameEn: 'Some experience' },
  { id: 'extensive', nameLt: 'Daug patirties', nameEn: 'Extensive experience' },
] as const;

export function OblationProgram({ onSubmit, className }: OblationProgramProps) {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [occupation, setOccupation] = useState('');
  const [parishAffiliation, setParishAffiliation] = useState('');
  const [benedictineExperience, setBenedictineExperience] = useState<'none' | 'some' | 'extensive'>('none');
  const [motivation, setMotivation] = useState('');
  const [preferredContactMethod, setPreferredContactMethod] = useState<'email' | 'phone'>('email');
  const [preferredLanguage, setPreferredLanguage] = useState<'lt' | 'en'>('lt');
  const [consentDataProcessing, setConsentDataProcessing] = useState(false);

  const handleSubmit = () => {
    if (!consentDataProcessing) return;

    const inquiry: OblationInquiry = {
      fullName,
      email,
      phone,
      city,
      occupation: occupation || undefined,
      parishAffiliation,
      benedictineExperience,
      motivation,
      preferredContactMethod,
      preferredLanguage,
      consentDataProcessing,
    };

    onSubmit?.(inquiry);

    // Reset form
    setStep(1);
    setFullName('');
    setEmail('');
    setPhone('');
    setCity('');
    setOccupation('');
    setParishAffiliation('');
    setBenedictineExperience('none');
    setMotivation('');
    setPreferredContactMethod('email');
    setPreferredLanguage('lt');
    setConsentDataProcessing(false);
  };

  const isStep1Valid = fullName && email && phone && city;
  const isStep2Valid = parishAffiliation && motivation;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-heading">Oblacijos programa / Oblation Program</CardTitle>
        <p className="text-sm text-gray-600">
          {entityConfig.oblationProgram.description.lt}
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

        {/* Step 1: Personal Information */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Asmeninė informacija / Personal Information</h3>

            <div>
              <label className="block text-sm font-medium mb-2">
                Vardas Pavardė / Full Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Vardenis Pavardenis"
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
              <label className="block text-sm font-medium mb-2">
                Telefono numeris / Phone number <span className="text-red-500">*</span>
              </label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+370 XXX XXXXX"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Miestas / City <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Vilnius"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Profesija / Occupation
              </label>
              <Input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="Profesija"
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

        {/* Step 2: Spiritual Background */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Dvasinis fonas / Spiritual Background</h3>

            <div>
              <label className="block text-sm font-medium mb-2">
                Parapijos priklausomybė / Parish affiliation <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={parishAffiliation}
                onChange={(e) => setParishAffiliation(e.target.value)}
                placeholder="Bažnyčios pavadinimas"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Patirtis su benediktiniška dvasingumu / Experience with Benedictine spirituality
              </label>
              <div className="space-y-2">
                {EXPERIENCE_LEVELS.map((level) => (
                  <div
                    key={level.id}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer transition-all',
                      benedictineExperience === level.id
                        ? 'border-primary bg-primary-50'
                        : 'border-gray-200 hover:border-primary/50'
                    )}
                    onClick={() => setBenedictineExperience(level.id as typeof benedictineExperience)}
                  >
                    <p className="font-medium">{level.nameLt}</p>
                    <p className="text-sm text-gray-600">{level.nameEn}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Motyvacija / Motivation <span className="text-red-500">*</span>
              </label>
              <textarea
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                placeholder="Kodėl norite dalyvauti oblacijos programoje? / Why do you want to join the oblation program?"
                className="w-full p-2 border rounded-lg"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Pageidaujamas kontakto būdas / Preferred contact method
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={preferredContactMethod === 'email' ? 'default' : 'outline'}
                  onClick={() => setPreferredContactMethod('email')}
                >
                  El. paštas
                </Button>
                <Button
                  variant={preferredContactMethod === 'phone' ? 'default' : 'outline'}
                  onClick={() => setPreferredContactMethod('phone')}
                >
                  Telefonas
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Pageidaujama kalba / Preferred language
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={preferredLanguage === 'lt' ? 'default' : 'outline'}
                  onClick={() => setPreferredLanguage('lt')}
                >
                  🇱🇹 Lietuvių
                </Button>
                <Button
                  variant={preferredLanguage === 'en' ? 'default' : 'outline'}
                  onClick={() => setPreferredLanguage('en')}
                >
                  🇬🇧 English
                </Button>
              </div>
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

        {/* Step 3: Consent & Submit */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Patvirtinimas / Confirmation</h3>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
              <p className="text-sm">
                <strong>Vardas:</strong> {fullName}
              </p>
              <p className="text-sm">
                <strong>El. paštas:</strong> {email}
              </p>
              <p className="text-sm">
                <strong>Telefonas:</strong> {phone}
              </p>
              <p className="text-sm">
                <strong>Miestas:</strong> {city}
              </p>
              {occupation && (
                <p className="text-sm">
                  <strong>Profesija:</strong> {occupation}
                </p>
              )}
              <p className="text-sm">
                <strong>Parapija:</strong> {parishAffiliation}
              </p>
              <p className="text-sm">
                <strong>Patirtis:</strong> {EXPERIENCE_LEVELS.find(e => e.id === benedictineExperience)?.nameLt}
              </p>
            </div>

            <div className="p-4 bg-liturgical-purple/10 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Oblacijos programa / Oblation Program</h4>
              <p className="text-xs text-gray-600 mb-2">
                {entityConfig.oblationProgram.description.en}
              </p>
              <p className="text-xs text-gray-600">
                <strong>Ruošiamasi:</strong> {entityConfig.oblationProgram.formationPeriod}
              </p>
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="consent"
                checked={consentDataProcessing}
                onChange={(e) => setConsentDataProcessing(e.target.checked)}
                className="w-4 h-4 mt-1"
              />
              <label htmlFor="consent" className="text-sm">
                Sutinku, kad mano duomenys būtų apdorojami oblacijos programos tikslais
                pagal GDPR nuostatas.
                <br />
                <span className="text-gray-500">
                  I consent to my data being processed for oblation program purposes
                  in accordance with GDPR regulations.
                </span>
              </label>
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Atgal / Back
              </Button>
              <Button
                className="flex-1 bg-liturgical-gold text-gray-900 hover:bg-liturgical-gold/90"
                disabled={!consentDataProcessing}
                onClick={handleSubmit}
              >
                Pateikti / Submit
              </Button>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Apie oblaciją / About Oblation</h4>
          <p className="text-xs text-gray-600">
            Oblatai yra pasauliečiai, kurie nori gyventi pagal šv. Benedikto regulą
            savo kasdieniame gyvenime, išlaikydami savo profesiją ir šeimos gyvenimą.
            <br />
            <br />
            Oblates are lay people who wish to live according to the Rule of St. Benedict
            in their daily lives while maintaining their profession and family life.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default OblationProgram;
