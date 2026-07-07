'use client';

import * as React from 'react';
import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';
import { entityConfig, type MaintenancePlan } from '@/config/entity';

export interface MaintenanceSchedule {
  id: string;
  plotId: string;
  planId: string;
  nextVisit: Date;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  status: 'scheduled' | 'in-progress' | 'completed';
}

export interface MaintenanceSchedulerProps {
  plans?: MaintenancePlan[];
  onSchedule?: (plotId: string, planId: string) => void;
  className?: string;
}

const frequencyLabels: Record<string, { lt: string; en: string }> = {
  weekly: { lt: 'Kas savaitę', en: 'Weekly' },
  monthly: { lt: 'Kas mėnesį', en: 'Monthly' },
  quarterly: { lt: 'Kas ketvirtį', en: 'Quarterly' },
  yearly: { lt: 'Kas metus', en: 'Yearly' },
};

export function MaintenanceScheduler({
  plans = entityConfig.maintenancePlans,
  onSchedule,
  className,
}: MaintenanceSchedulerProps) {
  const [selectedPlan, setSelectedPlan] = useState<MaintenancePlan | null>(null);
  const [plotId, setPlotId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [scheduledVisits, setScheduledVisits] = useState<MaintenanceSchedule[]>([]);

  const handleSchedule = () => {
    if (selectedPlan && plotId) {
      const schedule: MaintenanceSchedule = {
        id: `schedule-${Date.now()}`,
        plotId,
        planId: selectedPlan.id,
        nextVisit: new Date(),
        frequency: selectedPlan.frequency,
        status: 'scheduled',
      };
      setScheduledVisits((prev) => [...prev, schedule]);
      onSchedule?.(plotId, selectedPlan.id);
      setShowForm(false);
      setPlotId('');
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-heading">Priežiūros planavimas</CardTitle>
        <p className="text-sm text-gray-600">Maintenance Scheduling</p>
      </CardHeader>

      <CardContent className="p-4">
        {!showForm ? (
          <div className="space-y-4">
            {/* Available Plans */}
            <div>
              <h4 className="font-medium mb-3">Priežiūros planai / Maintenance Plans</h4>
              <div className="grid md:grid-cols-3 gap-4">
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
                    <h5 className="font-heading text-lg text-primary">{plan.name}</h5>
                    <p className="text-sm text-gray-600">{plan.nameEn}</p>
                    <Badge variant="outline" className="mt-2">
                      {frequencyLabels[plan.frequency]?.lt}
                    </Badge>
                    <div className="mt-3 space-y-1">
                      <p className="text-2xl font-bold text-primary">€{plan.annualPrice}</p>
                      <p className="text-xs text-gray-600">per metus / per year</p>
                      <p className="text-sm text-gray-500">€{plan.pricePerVisit} per vizitą</p>
                    </div>
                    <ul className="mt-3 space-y-1 text-sm text-gray-600">
                      {plan.services.slice(0, 3).map((service, idx) => (
                        <li key={idx}>✓ {service}</li>
                      ))}
                      {plan.services.length > 3 && (
                        <li className="text-primary text-xs">
                          +{plan.services.length - 3} daugiau
                        </li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={!selectedPlan}
              onClick={() => setShowForm(true)}
            >
              Tęsti su {selectedPlan?.name || 'pasirinktu'} planu
            </Button>

            {/* Scheduled Visits */}
            {scheduledVisits.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium mb-3">Suplanuoti vizitai / Scheduled Visits</h4>
                <div className="space-y-2">
                  {scheduledVisits.map((visit) => {
                    const plan = plans.find((p) => p.id === visit.planId);
                    return (
                      <div
                        key={visit.id}
                        className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium">Kapas: {visit.plotId}</p>
                          <p className="text-sm text-gray-600">Planas: {plan?.name}</p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-green-100 text-green-800">
                            {frequencyLabels[visit.frequency]?.lt}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            Kitas vizitas: {format(visit.nextVisit, 'yyyy-MM-dd')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
              ← Atgal
            </Button>

            <h4 className="font-heading text-lg">Įveskite kapo informaciją</h4>

            <div>
              <label className="block text-sm font-medium mb-1">Kapo numeris / Plot ID *</label>
              <input
                type="text"
                value={plotId}
                onChange={(e) => setPlotId(e.target.value)}
                placeholder="pvz. A-1-1 arba D-5-10"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            {selectedPlan && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">Pasirinktas planas: {selectedPlan.name}</p>
                <p className="text-sm text-gray-600">Metinė kaina: €{selectedPlan.annualPrice}</p>
              </div>
            )}

            <div className="p-4 bg-primary/5 rounded-lg text-sm">
              <p className="font-medium mb-2">📋 Sąlygos / Terms:</p>
              <ul className="space-y-1 text-gray-600">
                <li>• Sutartis sudaroma vieneriems metams</li>
                <li>• Automatinis atnaujinimas</li>
                <li>• Atšaukimas - 30 dienų įspėjimas</li>
                <li>• Kainos apsauga per sutarties laikotarpį</li>
              </ul>
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={!plotId}
              onClick={handleSchedule}
            >
              Patvirtinti užsakymą / Confirm Order
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MaintenanceScheduler;
