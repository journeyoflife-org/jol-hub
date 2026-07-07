'use client';

import * as React from 'react';
import { useState } from 'react';
import { Button, Input, Label, Card, CardHeader, CardTitle, CardContent } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';

/**
 * Mass Intention Booking Component
 * Online store item for booking Mass intentions
 */

export interface MassIntention {
  id: string;
  type: 'living' | 'deceased' | 'special_intention';
  intentionFor: string;
  requestedBy: string;
  email: string;
  phone: string;
  datePreference?: string;
  notes?: string;
  donation: number;
}

export interface MassIntentionBookingProps {
  onSubmit?: (intention: MassIntention) => Promise<void>;
  suggestedAmounts?: number[];
  className?: string;
}

const intentionTypes = [
  { value: 'living', labelLt: 'Už gyvąjį', labelEn: 'For the living' },
  { value: 'deceased', labelLt: 'Už mirusįjį', labelEn: 'For the deceased' },
  { value: 'special_intention', labelLt: 'Speciali intencija', labelEn: 'Special intention' },
];

const defaultSuggestedAmounts = [5, 10, 20, 50];

export function MassIntentionBooking({
  onSubmit,
  suggestedAmounts = defaultSuggestedAmounts,
  className,
}: MassIntentionBookingProps) {
  const [formData, setFormData] = useState<Partial<MassIntention>>({
    type: 'living',
    donation: suggestedAmounts[1],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customAmount, setCustomAmount] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit?.(formData as MassIntention);
      // Reset form or show success
    } catch (error) {
      console.error('Failed to submit mass intention:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={cn('max-w-lg', className)}>
      <CardHeader>
        <CardTitle className="text-xl font-heading">
          Šv. Mišių užsakymas
        </CardTitle>
        <p className="text-sm text-gray-600">Book a Mass Intention</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Intention Type */}
          <div className="space-y-2">
            <Label>Intencijos tipas</Label>
            <div className="flex gap-2 flex-wrap">
              {intentionTypes.map((type) => (
                <Button
                  key={type.value}
                  type="button"
                  variant={formData.type === type.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormData({ ...formData, type: type.value as any })}
                >
                  {type.labelLt}
                </Button>
              ))}
            </div>
          </div>

          {/* Person Name */}
          <div className="space-y-2">
            <Label htmlFor="intentionFor">
              {formData.type === 'deceased' ? 'Vardas pavardė (†)' : 'Vardas pavardė'} *
            </Label>
            <Input
              id="intentionFor"
              value={formData.intentionFor || ''}
              onChange={(e) => setFormData({ ...formData, intentionFor: e.target.value })}
              placeholder={formData.type === 'deceased' ? 'Jonas Petraitis †' : 'Jonas Petraitis'}
              required
            />
          </div>

          {/* Requester Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="requestedBy">Jūsų vardas *</Label>
              <Input
                id="requestedBy"
                value={formData.requestedBy || ''}
                onChange={(e) => setFormData({ ...formData, requestedBy: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">El. paštas *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Date Preference */}
          <div className="space-y-2">
            <Label htmlFor="datePreference">Pageidaujama data</Label>
            <Input
              id="datePreference"
              type="date"
              value={formData.datePreference || ''}
              onChange={(e) => setFormData({ ...formData, datePreference: e.target.value })}
            />
          </div>

          {/* Donation Amount */}
          <div className="space-y-2">
            <Label>Auka / Donation</Label>
            <div className="flex gap-2 flex-wrap">
              {suggestedAmounts.map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant={formData.donation === amount && !customAmount ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setCustomAmount(false);
                    setFormData({ ...formData, donation: amount });
                  }}
                >
                  €{amount}
                </Button>
              ))}
              <Button
                type="button"
                variant={customAmount ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCustomAmount(true)}
              >
                Kita
              </Button>
            </div>
            {customAmount && (
              <Input
                type="number"
                min={1}
                value={formData.donation || ''}
                onChange={(e) => setFormData({ ...formData, donation: parseFloat(e.target.value) })}
                placeholder="Įveskite sumą"
                className="mt-2"
              />
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Papildoma informacija</Label>
            <Input
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Siunčiama...' : `Užsakyti - €${formData.donation || 0}`}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Jūsų intencija bus įtraukta į artimiausiose Šv. Mišiose.
            <br />
            Your intention will be included in the upcoming Mass.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

export default MassIntentionBooking;