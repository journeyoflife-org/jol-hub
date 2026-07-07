/**
 * PricingCalculator Component
 * Calculates price based on grave size and cleaning frequency
 */

'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Separator } from '@jol-hub/ui';
import { Calculator } from 'lucide-react';

interface CemeteryService {
  id: string;
  name: string;
  pricePerVisit: number;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
}

interface PricingCalculatorProps {
  services: CemeteryService[];
}

const GRAVE_SIZES = [
  { id: 'single', name: 'Single grave (1m x 2m)', multiplier: 1 },
  { id: 'double', name: 'Double grave (2m x 2m)', multiplier: 1.5 },
  { id: 'family', name: 'Family plot (3m x 2m)', multiplier: 2 },
  { id: 'large', name: 'Large plot (4m+)', multiplier: 2.5 },
];

const FREQUENCIES = [
  { id: 'weekly', name: 'Weekly', visitsPerYear: 52, discount: 0.9 },
  { id: 'biweekly', name: 'Bi-weekly', visitsPerYear: 26, discount: 0.95 },
  { id: 'monthly', name: 'Monthly', visitsPerYear: 12, discount: 1 },
  { id: 'quarterly', name: 'Quarterly', visitsPerYear: 4, discount: 1.1 },
];

export function PricingCalculator({ services }: PricingCalculatorProps): JSX.Element {
  const [serviceId, setServiceId] = useState(services[0]?.id || '');
  const [graveSize, setGraveSize] = useState('single');
  const [frequency, setFrequency] = useState('monthly');

  const calculation = useMemo(() => {
    const service = services.find((s) => s.id === serviceId);
    const size = GRAVE_SIZES.find((s) => s.id === graveSize);
    const freq = FREQUENCIES.find((f) => f.id === frequency);

    if (!service || !size || !freq) return null;

    const basePrice = service.pricePerVisit;
    const sizeMultiplier = size.multiplier;
    const visits = freq.visitsPerYear;
    const discount = freq.discount;

    const pricePerVisit = Math.round(basePrice * sizeMultiplier * discount);
    const yearlyTotal = pricePerVisit * visits;

    return {
      pricePerVisit,
      visits,
      yearlyTotal,
      serviceName: service.name,
      sizeName: size.name,
      frequencyName: freq.name,
    };
  }, [serviceId, graveSize, frequency, services]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Price Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Service Type */}
        <div className="space-y-2">
          <Label>Service Type</Label>
          <Select value={serviceId} onValueChange={setServiceId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {services.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} (€{s.pricePerVisit}/visit)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Grave Size */}
        <div className="space-y-2">
          <Label>Grave Size</Label>
          <Select value={graveSize} onValueChange={setGraveSize}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GRAVE_SIZES.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Frequency */}
        <div className="space-y-2">
          <Label>Cleaning Frequency</Label>
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCIES.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name} ({f.visitsPerYear} visits/year)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Calculation Result */}
        {calculation && (
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Service:</span>
              <span>{calculation.serviceName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Size:</span>
              <span>{calculation.sizeName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Frequency:</span>
              <span>{calculation.frequencyName}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Per visit:</span>
              <span className="font-semibold">€{calculation.pricePerVisit}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Visits per year:</span>
              <span className="font-semibold">{calculation.visits}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center pt-2">
              <span className="font-semibold">Estimated yearly cost:</span>
              <span className="text-2xl font-bold text-primary">€{calculation.yearlyTotal}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
