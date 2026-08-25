/**
 * useDonationWidgetFlow — state machine behind DonationWidget, extracted
 * for the STEP 3 250-line rule. Pure orchestration: validation, payment
 * intent lifecycle, confirmation, reset. No JSX.
 */

'use client';

import { useState, useCallback } from 'react';
import { validateDonationForm } from './donation-validation';
import { createPaymentIntent, confirmDonation, downloadTaxReceipt } from './DonationApi';
import type { DonationError, StripeError } from './types';

export interface DonationWidgetFlowOptions {
  parishId: string;
  currency: string;
}

export function useDonationWidgetFlow({ parishId, currency }: DonationWidgetFlowOptions) {
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

  const handleSubmit = useCallback(async () => {
    const validationError = validateDonationForm({ amount, customAmount, name, email, consent });
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
  }, [amount, customAmount, name, email, phone, consent, frequency, purpose, parishId, currency]);

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
    // StripeError is now same as DonationError, no mapping needed
    setError(stripeError);
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

  const finalAmount = amount || parseInt(customAmount, 10) || 0;

  return {
    // values
    amount, customAmount, frequency, purpose, consent, name, email, phone,
    clientSecret, donationId, showPaymentForm, isLoading, error, success,
    finalAmount,
    // setters (form inputs)
    setFrequency, setPurpose, setConsent, setName, setEmail, setPhone,
    setShowPaymentForm,
    // handlers
    handleAmountSelect, handleCustomAmountChange, handleSubmit,
    handlePaymentSuccess, handlePaymentError, handleRetry, handleReset,
    handleDownloadReceipt,
  };
}
