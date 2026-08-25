/**
 * GDPR-compliant Donation Widget for JOL-HUB
 * Integrates with Django backend and Bitrix24 CRM
 *
 * STEP 3 hygiene: presentation only — the state machine lives in
 * useDonationWidgetFlow.ts, validation in donation-validation.ts, form
 * sections in DonationDetailsForm.tsx, the Stripe Elements step in
 * DonationPaymentStep.tsx, icons in donation-icons.tsx.
 */

'use client';

import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../card';
import { DonationDetailsForm } from './DonationDetailsForm';
import { DonationPaymentStep } from './DonationPaymentStep';
import { DonationSuccess } from './DonationSuccess';
import { DonationErrorComponent } from './DonationError';
import { HeartIcon, LockIcon } from './donation-icons';
import { useDonationWidgetFlow } from './useDonationWidgetFlow';
import type { DonationWidgetProps } from './types';

// =============================================================================
// STRIPE CONFIGURATION
// =============================================================================

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

// =============================================================================
// DEFAULT VALUES
// =============================================================================

const DEFAULT_AMOUNTS = [10, 20, 50, 100, 200];

// =============================================================================
// COMPONENT
// =============================================================================

export function DonationWidget({
  parishId,
  parishName,
  defaultAmounts = DEFAULT_AMOUNTS,
  language: _language = 'en',
  currency = 'EUR',
  privacyPolicyUrl = '/privacy',
}: DonationWidgetProps): JSX.Element {
  const flow = useDonationWidgetFlow({ parishId, currency });

  const formatAmount = (value: number): string => {
    return new Intl.NumberFormat('lt-LT', {
      style: 'currency',
      currency,
    }).format(value);
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  // Success State
  if (flow.success && flow.donationId) {
    return (
      <DonationSuccess
        amount={flow.finalAmount * 100}
        currency={currency}
        parishName={parishName}
        transactionId={flow.donationId}
        date={new Date()}
        receiptUrl={`/api/v1/donations/${flow.donationId}/receipt/`}
        onClose={flow.handleReset}
        onDownloadReceipt={flow.handleDownloadReceipt}
      />
    );
  }

  // Error State
  if (flow.error && !flow.showPaymentForm) {
    return (
      <DonationErrorComponent
        error={flow.error}
        onRetry={flow.handleRetry}
        onContactSupport={() => window.location.href = 'mailto:support@jol-hub.eu'}
      />
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div 
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: '#00843D' }}
          >
            <HeartIcon />
          </div>
          <div>
            <CardTitle>Support {parishName}</CardTitle>
            <CardDescription>Your donation makes a difference</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {!flow.showPaymentForm && (
          <DonationDetailsForm
            defaultAmounts={defaultAmounts}
            amount={flow.amount}
            customAmount={flow.customAmount}
            frequency={flow.frequency}
            purpose={flow.purpose}
            name={flow.name}
            email={flow.email}
            phone={flow.phone}
            consent={flow.consent}
            isLoading={flow.isLoading}
            finalAmount={flow.finalAmount}
            parishName={parishName}
            privacyPolicyUrl={privacyPolicyUrl}
            formatAmount={formatAmount}
            onAmountSelect={flow.handleAmountSelect}
            onCustomAmountChange={flow.handleCustomAmountChange}
            onFrequencyChange={flow.setFrequency}
            onPurposeChange={flow.setPurpose}
            onNameChange={flow.setName}
            onEmailChange={flow.setEmail}
            onPhoneChange={flow.setPhone}
            onConsentChange={flow.setConsent}
            onSubmit={flow.handleSubmit}
          />
        )}

        {flow.showPaymentForm && flow.clientSecret && (
          <DonationPaymentStep
            stripePromise={stripePromise}
            clientSecret={flow.clientSecret}
            finalAmount={flow.finalAmount}
            parishName={parishName}
            isLoading={flow.isLoading}
            formatAmount={formatAmount}
            onSuccess={flow.handlePaymentSuccess}
            onError={flow.handlePaymentError}
            onBack={() => flow.setShowPaymentForm(false)}
          />
        )}

        {/* Security Notice */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <LockIcon />
          <span>PCI DSS Compliant • Powered by Stripe</span>
        </div>
      </CardContent>
    </Card>
  );
}
