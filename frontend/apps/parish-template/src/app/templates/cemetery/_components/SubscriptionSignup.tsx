/**
 * SubscriptionSignup Component
 * Recurring payment setup with Stripe
 */

'use client';

import { useState, useCallback } from 'react';
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Alert,
  AlertDescription,
  Separator,
} from '@journeyoflife-org/ui';
import { CreditCard, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface CemeteryService {
  id: string;
  name: string;
  pricePerVisit: number;
}

interface SubscriptionSignupProps {
  services: CemeteryService[];
}

const GRAVE_SIZES = [
  { id: 'single', name: 'Single grave', multiplier: 1 },
  { id: 'double', name: 'Double grave', multiplier: 1.5 },
  { id: 'family', name: 'Family plot', multiplier: 2 },
  { id: 'large', name: 'Large plot', multiplier: 2.5 },
];

const FREQUENCIES = [
  { id: 'weekly', name: 'Weekly', visitsPerYear: 52 },
  { id: 'biweekly', name: 'Bi-weekly', visitsPerYear: 26 },
  { id: 'monthly', name: 'Monthly', visitsPerYear: 12 },
  { id: 'quarterly', name: 'Quarterly', visitsPerYear: 4 },
];

export function SubscriptionSignup({ services }: SubscriptionSignupProps): JSX.Element {
  const [serviceId, setServiceId] = useState(services[0]?.id || '');
  const [graveSize, setGraveSize] = useState('single');
  const [frequency, setFrequency] = useState('monthly');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [graveLocation, setGraveLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, _setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedService = services.find((s) => s.id === serviceId);
  const selectedSize = GRAVE_SIZES.find((s) => s.id === graveSize);
  const selectedFreq = FREQUENCIES.find((f) => f.id === frequency);

  const monthlyPrice =
    selectedService && selectedSize && selectedFreq
      ? Math.round(
          (selectedService.pricePerVisit * selectedSize.multiplier * selectedFreq.visitsPerYear) /
            12
        )
      : 0;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!name.trim() || !email.trim() || !graveLocation.trim()) {
        setError('Please fill in all required fields');
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        // Create Stripe Checkout Session
        const response = await fetch('/api/stripe/create-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId,
            graveSize,
            frequency,
            name,
            email,
            graveLocation,
            monthlyPrice,
          }),
        });

        if (!response.ok) throw new Error('Failed to create subscription');

        const { url } = await response.json();
        window.location.href = url;
      } catch {
        setError('Failed to start subscription. Please try again.');
        setIsSubmitting(false);
      }
    },
    [serviceId, graveSize, frequency, name, email, graveLocation, monthlyPrice]
  );

  if (isSuccess) {
    return (
      <div className="space-y-3 py-6 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <h3 className="font-semibold">Redirecting to payment...</h3>
        <p className="text-muted-foreground text-sm">
          Please complete your subscription in the secure checkout.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Service Selection */}
      <div className="space-y-2">
        <Label>Service Plan</Label>
        <Select value={serviceId} onValueChange={setServiceId}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {services.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
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
                {f.name} ({f.visitsPerYear}/year)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Contact Info */}
      <div className="space-y-2">
        <Label htmlFor="sub-name">Full Name *</Label>
        <Input
          id="sub-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sub-email">Email *</Label>
        <Input
          id="sub-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sub-location">Grave Location *</Label>
        <Input
          id="sub-location"
          value={graveLocation}
          onChange={(e) => setGraveLocation(e.target.value)}
          placeholder="Section, row, grave number"
          required
        />
      </div>

      {/* Price Summary */}
      <div className="bg-muted rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Monthly payment:</span>
          <span className="text-primary text-2xl font-bold">€{monthlyPrice}</span>
        </div>
        <p className="text-muted-foreground mt-1 text-xs">Billed monthly. Cancel anytime.</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <CreditCard className="mr-2 h-4 w-4" />
        )}
        Start Subscription
      </Button>
    </form>
  );
}
