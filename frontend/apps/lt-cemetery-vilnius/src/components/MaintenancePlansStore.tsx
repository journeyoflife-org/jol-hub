'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';
import { entityConfig, type MaintenancePlan } from '@/config/entity';

export interface MaintenancePlansStoreProps {
  plans?: MaintenancePlan[];
  onSubscribe?: (plan: MaintenancePlan, plotId: string, contractYears: number) => void;
  className?: string;
}

const frequencyIcons: Record<string, string> = {
  weekly: '📅',
  monthly: '📆',
  quarterly: '🗓️',
  yearly: '🎂',
};

const frequencyLabels: Record<string, { lt: string; en: string }> = {
  weekly: { lt: 'Kas savaitę', en: 'Weekly' },
  monthly: { lt: 'Kas mėnesį', en: 'Monthly' },
  quarterly: { lt: 'Kas ketvirtį', en: 'Quarterly' },
  yearly: { lt: 'Kas metus', en: 'Yearly' },
};

export function MaintenancePlansStore({
  plans = entityConfig.maintenancePlans,
  onSubscribe,
  className,
}: MaintenancePlansStoreProps) {
  const [selectedPlan, setSelectedPlan] = useState<MaintenancePlan | null>(null);
  const [plotId, setPlotId] = useState('');
  const [contractYears, setContractYears] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const calculateTotal = () => {
    if (!selectedPlan) return 0;
    const discount = contractYears >= 5 ? 0.1 : contractYears >= 10 ? 0.2 : 0;
    return selectedPlan.annualPrice * contractYears * (1 - discount);
  };

  const handleSubmit = () => {
    if (selectedPlan && plotId) {
      onSubscribe?.(selectedPlan, plotId, contractYears);
      setShowForm(false);
      setSelectedPlan(null);
      setPlotId('');
      setContractYears(1);
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-heading">Priežiūros planai</CardTitle>
        <p className="text-sm text-gray-600">Maintenance Plans</p>
      </CardHeader>

      <CardContent className="p-4">
        {!showForm ? (
          <div className="space-y-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  'p-4 border-2 rounded-lg cursor-pointer transition-all',
                  selectedPlan?.id === plan.id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                )}
                onClick={() => setSelectedPlan(plan)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{frequencyIcons[plan.frequency]}</span>
                    <div>
                      <h3 className="font-heading text-xl text-primary">{plan.name}</h3>
                      <p className="text-sm text-gray-600">{plan.nameEn}</p>
                      <Badge variant="outline" className="mt-1">
                        {frequencyLabels[plan.frequency]?.lt}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">€{plan.annualPrice}</p>
                    <p className="text-xs text-gray-600">per metus / per year</p>
                    <p className="text-sm text-gray-500">€{plan.pricePerVisit}/vizitas</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Įtrauktos paslaugos / Included Services:</p>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {plan.services.map((service, idx) => (
                        <li key={idx}>✓ {service}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">Vizitų per metus / Visits per year:</p>
                    <p className="text-lg font-bold text-primary">
                      {plan.frequency === 'weekly' ? 52 : plan.frequency === 'monthly' ? 12 : plan.frequency === 'quarterly' ? 4 : 1}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <Button
              className="w-full"
              size="lg"
              disabled={!selectedPlan}
              onClick={() => setShowForm(true)}
            >
              Tęsti su {selectedPlan?.name || 'pasirinktu'} planu
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
              ← Atgal
            </Button>

            <h4 className="font-heading text-lg">Užsakymo informacija / Order Details</h4>

            <div>
              <label className="block text-sm font-medium mb-1">Kapo numeris / Plot ID *</label>
              <input
                type="text"
                value={plotId}
                onChange={(e) => setPlotId(e.target.value)}
                placeholder="pvz. A-1-1"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Sutarties trukmė / Contract Duration</label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 3, 5, 10, 20, 50].map((years) => {
                  const discount = years >= 5 ? 0.1 : years >= 10 ? 0.2 : 0;
                  return (
                    <Button
                      key={years}
                      variant={contractYears === years ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setContractYears(years)}
                      className="flex flex-col items-center"
                    >
                      <span>{years} m.</span>
                      {discount > 0 && (
                        <span className="text-xs text-green-600">-{discount * 100}%</span>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>

            {selectedPlan && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{selectedPlan.name}</p>
                    <p className="text-sm text-gray-600">{contractYears} metų sutartis</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">€{calculateTotal().toFixed(0)}</p>
                    <p className="text-xs text-gray-600">
                      {(calculateTotal() / contractYears).toFixed(0)}/metus
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 bg-primary/5 rounded-lg text-sm">
              <p className="font-medium mb-2">📋 Sutarties sąlygos / Contract Terms:</p>
              <ul className="space-y-1 text-gray-600">
                <li>• Ilgalaikė kainos apsauga</li>
                <li>• Automatinis atnaujinimas</li>
                <li>• Atšaukimas - 30 dienų įspėjimas</li>
                <li>• Visos paslaugos įtrauktos</li>
              </ul>
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={!plotId}
              onClick={handleSubmit}
            >
              Patvirtinti užsakymą / Confirm Order
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MaintenancePlansStore;
