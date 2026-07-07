/**
 * GDPR-compliant Donation Widget for JOL-HUB
 * Integrates with Django backend and Bitrix24 CRM
 */

'use client';

import { useState, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Button } from '../button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../card';
import { Input } from '../input';
import { Label } from '../label';
import { Checkbox } from '../checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';
// Imports cleaned
import { Separator } from '../separator';
import { StripePaymentForm } from './StripePaymentForm';
import { DonationSuccess } from './DonationSuccess';
import { DonationErrorComponent } from './DonationError';
import { useDonation } from './useDonation';
import { createPaymentIntent, confirmDonation, downloadTaxReceipt } from './DonationApi';
import type { DonationWidgetProps, DonationData, DonationError, StripeError } from './types';

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

const DONATION_PURPOSES = [
  { value: 'general', label: 'General donation' },
  { value: 'renovation', label: 'Church renovation' },
  { value: 'charity', label: 'Charity' },
  { value: 'liturgical', label: 'Liturgical supplies' },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function DonationWidget({
  parishId,
  parishName,
  defaultAmounts = DEFAULT_AMOUNTS,
  language = 'en',
  currency = 'EUR',
  privacyPolicyUrl = '/privacy',
}: DonationWidgetProps): JSX.Element {
  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------

  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [frequency, setFrequency] = useState<'one-time' | 'monthly'>('one-time');
  const [purpose, setPurpose] = useState('general');
  const [consent, setConsent] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [donationId, setDonationId] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<DonationError | null>(null);
  const [success, setSuccess] = useState(false);

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------

  const handleAmountSelect = useCallback((value: number) => {
    setAmount(value);
    setCustomAmount('');
  }, []);

  const handleCustomAmountChange = useCallback((value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    setCustomAmount(numericValue);
    setAmount(numericValue ? parseInt(numericValue, 10) : null);
  }, []);

  const validateForm = useCallback((): DonationError | null => {
    const finalAmount = amount || parseInt(customAmount, 10);
    
    if (!finalAmount || finalAmount < 1) {
      return {
        type: 'validation',
        message: 'Please select or enter a donation amount',
        retryable: true,
      };
    }
    
    if (finalAmount > 10000) {
      return {
        type: 'validation',
        message: 'Maximum donation amount is 10,000 EUR',
        retryable: true,
      };
    }
    
    if (!name.trim() || name.length < 2) {
      return {
        type: 'validation',
        message: 'Please enter your full name',
        retryable: true,
      };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        type: 'validation',
        message: 'Please enter a valid email address',
        retryable: true,
      };
    }
    
    if (!consent) {
      return {
        type: 'validation',
        message: 'You must consent to the processing of personal data',
        retryable: true,
      };
    }
    
    return null;
  }, [amount, customAmount, name, email, consent]);

  const handleSubmit = useCallback(async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    const finalAmount = (amount || parseInt(customAmount, 10)) * 100; // Convert to cents

    // Audit log
    console.log('[DONATION WIDGET] Initiating donation:', {
      timestamp: new Date().toISOString(),
      parishId,
      amount: finalAmount,
      frequency,
      purpose,
      hasConsent: consent,
    });

    try {
      const response = await createPaymentIntent(
        finalAmount,
        currency,
        parishId,
        frequency,
        { name, email, phone: phone || undefined }
      );

      if (!response.success || !response.data) {
        throw {
          type: 'server',
          message: response.error?.message || 'Failed to initialize payment',
          code: response.error?.code,
          retryable: true,
        } as DonationError;
      }

      setClientSecret(response.data.clientSecret);
      setDonationId(response.data.donationId);
      setShowPaymentForm(true);

      console.log('[DONATION WIDGET] Payment intent created:', {
        donationId: response.data.donationId,
      });

    } catch (err) {
      setError(err as DonationError);
      console.error('[DONATION WIDGET] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [amount, customAmount, name, email, phone, consent, frequency, purpose, parishId, currency, validateForm]);

  const handlePaymentSuccess = useCallback(async (paymentIntentId: string) => {
    if (!donationId) return;

    setIsLoading(true);

    try {
      const response = await confirmDonation(donationId, paymentIntentId);

      if (!response.success) {
        throw {
          type: 'server',
          message: response.error?.message || 'Payment confirmed but donation recording failed',
          retryable: false,
        } as DonationError;
      }

      setSuccess(true);
      setShowPaymentForm(false);

      // Audit log
      console.log('[DONATION WIDGET] Donation completed:', {
        donationId,
        paymentIntentId,
        timestamp: new Date().toISOString(),
      });

    } catch (err) {
      setError(err as DonationError);
      console.error('[DONATION WIDGET] Confirmation error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [donationId]);

  const handlePaymentError = useCallback((stripeError: StripeError) => {
    const error: DonationError = {
      type: stripeError.type === 'card_error' ? 'card' : 
           stripeError.type === 'authentication_error' ? 'authentication' : 'server',
      message: stripeError.message,
      code: stripeError.code,
      retryable: stripeError.type !== 'authentication_error',
    };
    
    setError(error);
    console.error('[DONATION WIDGET] Payment error:', stripeError);
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    if (showPaymentForm) {
      // Retry payment
      setShowPaymentForm(false);
      setTimeout(() => setShowPaymentForm(true), 100);
    }
  }, [showPaymentForm]);

  const handleReset = useCallback(() => {
    setAmount(null);
    setCustomAmount('');
    setFrequency('one-time');
    setPurpose('general');
    setConsent(false);
    setName('');
    setEmail('');
    setPhone('');
    setClientSecret(null);
    setDonationId(null);
    setShowPaymentForm(false);
    setError(null);
    setSuccess(false);
  }, []);

  const handleDownloadReceipt = useCallback(async () => {
    if (!donationId) return;
    
    try {
      await downloadTaxReceipt(donationId);
    } catch (err) {
      console.error('[DONATION WIDGET] Failed to download receipt:', err);
    }
  }, [donationId]);

  // ---------------------------------------------------------------------------
  // RENDER HELPERS
  // ---------------------------------------------------------------------------

  const formatAmount = (value: number): string => {
    return new Intl.NumberFormat('lt-LT', {
      style: 'currency',
      currency,
    }).format(value);
  };

  const finalAmount = amount || parseInt(customAmount, 10) || 0;

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  // Success State
  if (success && donationId) {
    return (
      <DonationSuccess
        amount={finalAmount * 100}
        currency={currency}
        parishName={parishName}
        transactionId={donationId}
        date={new Date()}
        receiptUrl={`/api/v1/donations/${donationId}/receipt/`}
        onClose={handleReset}
        onDownloadReceipt={handleDownloadReceipt}
      />
    );
  }

  // Error State
  if (error && !showPaymentForm) {
    return (
      <DonationErrorComponent
        error={error}
        onRetry={handleRetry}
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
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div>
            <CardTitle>Support {parishName}</CardTitle>
            <CardDescription>Your donation makes a difference</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Amount Selection */}
        {!showPaymentForm && (
          <>
            <div className="space-y-3">
              <Label>Select Amount</Label>
              <div className="grid grid-cols-3 gap-2">
                {defaultAmounts.map((value) => (
                  <Button
                    key={value}
                    type="button"
                    variant={amount === value ? 'default' : 'outline'}
                    onClick={() => handleAmountSelect(value)}
                    className={amount === value ? 'bg-[#00843D] hover:bg-[#006b32]' : ''}
                  >
                    {formatAmount(value)}
                  </Button>
                ))}
              </div>
              
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Custom amount"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  className="pl-8"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  €
                </span>
              </div>
            </div>

            {/* Frequency Toggle */}
            <div className="space-y-3">
              <Label>Frequency</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={frequency === 'one-time' ? 'default' : 'outline'}
                  onClick={() => setFrequency('one-time')}
                  className={`flex-1 ${frequency === 'one-time' ? 'bg-[#00843D] hover:bg-[#006b32]' : ''}`}
                >
                  One-time
                </Button>
                <Button
                  type="button"
                  variant={frequency === 'monthly' ? 'default' : 'outline'}
                  onClick={() => setFrequency('monthly')}
                  className={`flex-1 ${frequency === 'monthly' ? 'bg-[#00843D] hover:bg-[#006b32]' : ''}`}
                >
                  Monthly
                </Button>
              </div>
            </div>

            {/* Purpose Selection */}
            <div className="space-y-3">
              <Label>Purpose</Label>
              <Select value={purpose} onValueChange={setPurpose}>
                <SelectTrigger>
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  {DONATION_PURPOSES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Donor Information */}
            <div className="space-y-3">
              <Label>Your Information</Label>
              <Input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                type="tel"
                placeholder="Phone (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {/* GDPR Consent */}
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="consent"
                  checked={consent}
                  onCheckedChange={(checked) => setConsent(checked as boolean)}
                />
                <label htmlFor="consent" className="text-sm text-gray-600 cursor-pointer">
                  I consent to processing personal data for donation purposes and tax receipt 
                  issuance (GDPR Article 6(1)(a)). I understand my data will be shared with{' '}
                  {parishName} and payment processor.{' '}
                  <a 
                    href={privacyPolicyUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#00843D] hover:underline"
                  >
                    Privacy Policy
                  </a>
                </label>
              </div>
            </div>

            <Separator />

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !consent || finalAmount < 1}
              className="w-full"
              style={{ backgroundColor: '#00843D' }}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                `Donate ${finalAmount > 0 ? formatAmount(finalAmount) : ''}`
              )}
            </Button>
          </>
        )}

        {/* Payment Form */}
        {showPaymentForm && clientSecret && (
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
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                isLoading={isLoading}
              />
              
              <Button
                variant="ghost"
                onClick={() => setShowPaymentForm(false)}
                className="w-full"
              >
                ← Back to donation details
              </Button>
            </div>
          </Elements>
        )}

        {/* Security Notice */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>PCI DSS Compliant • Powered by Stripe</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default DonationWidget;
