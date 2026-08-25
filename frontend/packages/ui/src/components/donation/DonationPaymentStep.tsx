/**
 * DonationPaymentStep — Stripe Elements step of the DonationWidget,
 * extracted for the STEP 3 250-line rule.
 *
 * PCI-DSS SAQ A: card fields are rendered by Stripe Elements inside an
 * iframe; card data never touches JOL infrastructure.
 */

'use client';

import { Elements } from '@stripe/react-stripe-js';
import type { Stripe } from '@stripe/stripe-js';
import { Button } from '../button';
import { StripePaymentForm } from './StripePaymentForm';
import type { StripeError } from './types';

export interface DonationPaymentStepProps {
  stripePromise: Promise<Stripe | null>;
  clientSecret: string;
  finalAmount: number;
  parishName: string;
  isLoading: boolean;
  formatAmount: (value: number) => string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: StripeError) => void;
  onBack: () => void;
}

export function DonationPaymentStep({
  stripePromise,
  clientSecret,
  finalAmount,
  parishName,
  isLoading,
  formatAmount,
  onSuccess,
  onError,
  onBack,
}: DonationPaymentStepProps): JSX.Element {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <div className="space-y-4">
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-sm text-gray-600">
            Donating: <span className="font-semibold">{formatAmount(finalAmount)}</span>
          </p>
          <p className="text-sm text-gray-600">
            To: <span className="font-semibold">{parishName}</span>
          </p>
        </div>

        <StripePaymentForm
          clientSecret={clientSecret}
          onSuccess={onSuccess}
          onError={onError}
          isLoading={isLoading}
        />

        <Button
          variant="ghost"
          onClick={onBack}
          className="w-full"
        >
          ← Back to donation details
        </Button>
      </div>
    </Elements>
  );
}
