/**
 * useDonation Hook
 * Manages complete donation flow with Stripe and Django backend
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import type {
  DonationData,
  UseDonationReturn,
  DonationError,
} from './types';
import {
  createPaymentIntent,
  confirmDonation,
  downloadTaxReceipt,
} from './DonationApi';

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useDonation(parishId: string): UseDonationReturn {
  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<DonationError | null>(null);
  const [success, setSuccess] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [donationId, setDonationId] = useState<string | null>(null);
  
  // Refs for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);

  // ---------------------------------------------------------------------------
  // VALIDATION
  // ---------------------------------------------------------------------------

  const validateDonationData = (data: DonationData): DonationError | null => {
    // Amount validation
    if (data.amount < 100) {
      return {
        type: 'validation',
        message: 'Minimum donation amount is 1 EUR',
        retryable: true,
      };
    }
    
    if (data.amount > 1000000) {
      return {
        type: 'validation',
        message: 'Maximum donation amount is 10,000 EUR',
        retryable: true,
      };
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return {
        type: 'validation',
        message: 'Please enter a valid email address',
        retryable: true,
      };
    }

    // Name validation
    if (!data.name.trim() || data.name.length < 2) {
      return {
        type: 'validation',
        message: 'Please enter your full name',
        retryable: true,
      };
    }

    // GDPR consent validation
    if (!data.consent) {
      return {
        type: 'validation',
        message: 'You must consent to the processing of personal data to proceed',
        retryable: true,
      };
    }

    // Phone validation (optional)
    if (data.phone) {
      const phoneRegex = /^[+]?[\d\s-()]{8,20}$/;
      if (!phoneRegex.test(data.phone)) {
        return {
          type: 'validation',
          message: 'Please enter a valid phone number',
          retryable: true,
        };
      }
    }

    return null;
  };

  // ---------------------------------------------------------------------------
  // MAIN DONATION FLOW
  // ---------------------------------------------------------------------------

  const donate = useCallback(async (data: DonationData): Promise<void> => {
    // Reset state
    setError(null);
    setSuccess(false);
    setReceiptUrl(null);
    setDonationId(null);

    // Step 1: Validate
    const validationError = validateDonationData(data);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    // Create abort controller for cleanup
    abortControllerRef.current = new AbortController();

    // Audit log
    console.log('[DONATION] Starting donation flow:', {
      timestamp: new Date().toISOString(),
      parishId,
      amount: data.amount,
      frequency: data.frequency,
      hasConsent: data.consent,
    });

    try {
      // Step 2: Create payment intent
      console.log('[DONATION] Creating payment intent...');
      
      const intentResponse = await createPaymentIntent(
        data.amount,
        'EUR',
        parishId,
        data.frequency,
        {
          name: data.name,
          email: data.email,
          phone: data.phone,
        }
      );

      if (!intentResponse.success || !intentResponse.data) {
        const apiError = intentResponse.error;
        
        if (apiError?.code === 'VALIDATION_ERROR') {
          throw {
            type: 'validation',
            message: apiError.message,
            code: apiError.code,
            retryable: true,
          } as DonationError;
        }
        
        throw {
          type: 'server',
          message: apiError?.message || 'Failed to initialize payment',
          code: apiError?.code,
          retryable: true,
        } as DonationError;
      }

      const { clientSecret, donationId: newDonationId } = intentResponse.data;
      setDonationId(newDonationId);

      // Note: Stripe payment confirmation is handled by StripePaymentForm component
      // We return here and wait for the onSuccess callback from Stripe
      
      // Store data for later confirmation
      sessionStorage.setItem('pendingDonation', JSON.stringify({
        donationId: newDonationId,
        data,
      }));

      console.log('[DONATION] Payment intent created:', {
        donationId: newDonationId,
        hasClientSecret: !!clientSecret,
      });

      // Return client secret for StripePaymentForm
      return;

    } catch (err) {
      const donationError = err as DonationError;
      
      console.error('[DONATION] Error:', donationError);
      
      setError(donationError);
      setIsLoading(false);
      
      // Audit log
      console.log('[DONATION] Failed:', {
        timestamp: new Date().toISOString(),
        error: donationError,
      });
    }
  }, [parishId]);

  // ---------------------------------------------------------------------------
  // CONFIRM DONATION (called after Stripe payment success)
  // ---------------------------------------------------------------------------

  const confirmPayment = useCallback(async (
    paymentIntentId: string,
    donationIdToConfirm: string
  ): Promise<void> => {
    console.log('[DONATION] Confirming payment...', {
      paymentIntentId,
      donationId: donationIdToConfirm,
    });

    try {
      const confirmResponse = await confirmDonation(
        donationIdToConfirm,
        paymentIntentId
      );

      if (!confirmResponse.success) {
        throw {
          type: 'server',
          message: confirmResponse.error?.message || 'Failed to confirm donation',
          code: confirmResponse.error?.code,
          retryable: false,
        } as DonationError;
      }

      // Success!
      setSuccess(true);
      setReceiptUrl(`${DJANGO_API_URL}/api/v1/donations/${donationIdToConfirm}/receipt/`);
      
      // Clear pending donation
      sessionStorage.removeItem('pendingDonation');

      // Audit log
      console.log('[DONATION] Success:', {
        timestamp: new Date().toISOString(),
        donationId: donationIdToConfirm,
        paymentIntentId,
      });

    } catch (err) {
      const donationError = err as DonationError;
      setError(donationError);
      
      console.error('[DONATION] Confirmation error:', donationError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // DOWNLOAD RECEIPT
  // ---------------------------------------------------------------------------

  const downloadReceipt = useCallback(async (): Promise<void> => {
    if (!donationId) return;

    try {
      await downloadTaxReceipt(donationId);
      
      console.log('[DONATION] Receipt downloaded:', {
        donationId,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[DONATION] Failed to download receipt:', err);
      
      setError({
        type: 'network',
        message: 'Failed to download receipt. Please try again later.',
        retryable: true,
      });
    }
  }, [donationId]);

  // ---------------------------------------------------------------------------
  // RESET
  // ---------------------------------------------------------------------------

  const reset = useCallback((): void => {
    setIsLoading(false);
    setError(null);
    setSuccess(false);
    setReceiptUrl(null);
    setDonationId(null);
    
    // Abort any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Clear session storage
    sessionStorage.removeItem('pendingDonation');
  }, []);

  // ---------------------------------------------------------------------------
  // RETURN
  // ---------------------------------------------------------------------------

  return {
    donate,
    isLoading,
    error,
    success,
    receiptUrl,
    donationId,
    reset,
    // Expose additional methods
    confirmPayment,
    downloadReceipt,
  } as UseDonationReturn & {
    confirmPayment: (paymentIntentId: string, donationId: string) => Promise<void>;
    downloadReceipt: () => Promise<void>;
  };
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DJANGO_API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://api.jol-hub.eu';

export default useDonation;
