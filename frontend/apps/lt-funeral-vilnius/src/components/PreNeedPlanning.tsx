'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';
import { entityConfig, type PreNeedPlan } from '@/config/entity';

export interface PreNeedPlanningProps {
  plans?: PreNeedPlan[];
  onSelectPlan?: (plan: PreNeedPlan, formData: PreNeedFormData) => void;
  className?: string;
}

export interface PreNeedFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  preferredContact: 'email' | 'phone' | 'mail';
}

const planFeatures: Record<string, string[]> = {
  basic: [
    'Pagrindinis laidotuvių paketas',
    'Paprastas karstas',
    'Transportas',
    'Konsultacija su šeima',
    'Visi administraciniai darbai',
  ],
  traditional: [
    'Tradicinis laidotuvių paketas',
    'Kokybiškas karstas',
    'Gėlės',
    'Muzika',
    'Atminimo kortelės',
    'Visi administraciniai darbai',
  ],
  premium: [
    'Premium laidotuvių paketas',
    'Rankų darbo karstas',
    'Visos paslaugos',
    'Transliacija',
    'Kavos priėmimas',
    'Visi administraciniai darbai',
    'Parama šeimai',
  ],
};

export function PreNeedPlanning({
  plans = entityConfig.preNeedPlans,
  onSelectPlan,
  className,
}: PreNeedPlanningProps) {
  const [selectedPlan, setSelectedPlan] = useState<PreNeedPlan | null>(null);
  const [step, setStep] = useState<'select' | 'form'>('select');
  const [formData, setFormData] = useState<PreNeedFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    preferredContact: 'phone',
  });
  const [agreed, setAgreed] = useState(false);
  const [gdprConsent, setGdprConsent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPlan && agreed && gdprConsent) {
      onSelectPlan?.(selectedPlan, formData);
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-heading">Išankstinis planavimas</CardTitle>
        <p className="text-sm text-gray-600">Pre-Need Planning</p>
        <p className="text-xs text-gray-500 mt-1">
          Suplanuokite savo atsisveikinimą iš anksto ir palikite šeimą nuo rūpesčių.
        </p>
      </CardHeader>

      <CardContent className="p-4">
        {step === 'select' ? (
          <div className="space-y-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  'p-4 border-2 rounded-lg cursor-pointer transition-all',
                  selectedPlan?.id === plan.id
                    ? 'border-memorial-gold bg-memorial-cream/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                )}
                onClick={() => setSelectedPlan(plan)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-heading text-xl text-primary capitalize">{plan.planType}</h3>
                    <Badge variant="outline">
                      {plan.contractDuration} mėnesių sutartis
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-memorial-navy">€{plan.monthlyPayment}</p>
                    <p className="text-xs text-gray-600">per mėnesį</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Bendra vertė:</span> €{plan.totalValue}
                  </div>
                  <div>
                    <span className="font-medium">Įmoka:</span> €{plan.monthlyPayment}/mėn
                  </div>
                </div>

                <ul className="mt-3 space-y-1 text-sm">
                  {planFeatures[plan.planType]?.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-gray-600">
                      <span className="text-memorial-gold">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <Button
              className="w-full"
              size="lg"
              disabled={!selectedPlan}
              onClick={() => setStep('form')}
            >
              Tęsti su {selectedPlan?.planType || 'pasirinktu'} planu
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Vardas *</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pavardė *</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">El. paštas *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Telefonas *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="+370 XXX XXXXX"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Gimimo data</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pageidaujamas kontaktas</label>
                <select
                  value={formData.preferredContact}
                  onChange={(e) => setFormData({ ...formData, preferredContact: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="phone">Telefonu</option>
                  <option value="email">El. paštu</option>
                  <option value="mail">Paštu</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Adresas</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            {/* Consent checkboxes */}
            <div className="space-y-2 pt-4 border-t">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm text-gray-600">
                  Sutinku su išankstinio planavimo sutarties sąlygomis *
                </span>
              </label>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={gdprConsent}
                  onChange={(e) => setGdprConsent(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm text-gray-600">
                  Sutinku su asmens duomenų tvarkymu pagal BDAR (GDPR) nuostatas *
                </span>
              </label>
            </div>

            {/* Selected Plan Summary */}
            {selectedPlan && (
              <div className="p-3 bg-memorial-cream rounded-lg">
                <p className="font-medium">Pasirinktas planas: {selectedPlan.planType}</p>
                <p className="text-sm text-gray-600">
                  Mėnesinė įmoka: €{selectedPlan.monthlyPayment} | Sutarties trukmė: {selectedPlan.contractDuration} mėn.
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep('select')}>
                Atgal
              </Button>
              <Button type="submit" className="flex-1" disabled={!agreed || !gdprConsent}>
                Pateikti užklausą
              </Button>
            </div>
          </form>
        )}

        {/* PCI-DSS & Security Notice */}
        <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs text-gray-600">
          <p className="font-medium mb-1">🔒 Saugumas ir apsauga</p>
          <p>
            Mūsų išankstinio planavimo sistema atitinka PCI-DSS standartus ir
            užtikrina jūsų finansinių bei asmeninių duomenų saugumą.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default PreNeedPlanning;
