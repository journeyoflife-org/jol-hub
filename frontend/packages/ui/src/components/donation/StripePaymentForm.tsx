/**
 * Stripe Payment Form Component
 * PCI DSS compliant - uses Stripe Elements iframe
 */

'use client';

import { useState, useCallback } from 'react';
import {
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import type { StripeCardElementChangeEvent } from '@stripe/stripe-js';
import type { DonationError } from './types';
import { Button } from '../button';
import { Card, CardContent, CardHeader, CardTitle } from '../card';
import { Alert, AlertDescription } from '../alert';
import type { StripePaymentFormProps } from './types';
import { mapStripeError } from './stripe-error-mapping';

// =============================================================================
// STYLES
// =============================================================================

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
  hidePostalCode: false,
};

// =============================================================================
// COMPONENT
// =============================================================================

export function StripePaymentForm({
  clientSecret,
  onSuccess,
  onError,
  isLoading: externalLoading = false,
}: StripePaymentFormProps): JSX.Element {
  const stripe = useStripe();
  const elements = useElements();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [postalCode, _setPostalCode] = useState('');

  // ---------------------------------------------------------------------------
  // EVENT HANDLERS
  // ---------------------------------------------------------------------------

  const handleCardChange = useCallback((event: StripeCardElementChangeEvent) => {
    setCardComplete(event.complete);
    
    if (event.error) {
      setCardError(event.error.message ?? 'Invalid card details');
    } else {
      setCardError(null);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      return;
    }

    if (!cardComplete) {
      setCardError('Please complete card information');
      return;
    }

    setIsProcessing(true);
    setCardError(null);

    // Audit log
    console.log('[STRIPE] Confirming card payment...', {
      timestamp: new Date().toISOString(),
      hasClientSecret: !!clientSecret,
    });

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
            billing_details: {
              address: {
                postal_code: postalCode,
              },
            },
          },
        }
      );

      if (error) {
        // Handle specific error types - map StripeJS error to our error type
        setCardError(error.message ?? 'Payment failed');
        onError(mapStripeError(error));
      } else if (paymentIntent) {
        // Payment successful
        console.log('[STRIPE] Payment successful:', {
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
        });

        onSuccess(paymentIntent.id);
      }
    } catch (err) {
      console.error('[STRIPE] Unexpected error:', err);
      
      const error: DonationError = {
        type: 'server',
        message: 'An unexpected error occurred. Please try again.',
        retryable: true,
      };
      
      setCardError(error.message);
      onError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  const isLoading = isProcessing || externalLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Card Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card Element */}
          <div className="space-y-2">
            <label 
              htmlFor="card-element"
              className="text-sm font-medium text-gray-700"
            >
              Card Information
            </label>
            <div className="rounded-md border border-gray-300 p-3 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
              <CardElement
                id="card-element"
                options={cardElementOptions}
                onChange={handleCardChange}
              />
            </div>
            <p className="text-xs text-gray-500">
              Test card: 4242 4242 4242 4242 | Any future date | Any CVC
            </p>
          </div>

          {/* Error Display */}
          {cardError && (
            <Alert variant="destructive">
              <AlertDescription>{cardError}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!stripe || isLoading || !cardComplete}
            className="w-full"
            style={{ backgroundColor: '#00843D' }}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg 
                  className="h-4 w-4 animate-spin" 
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </span>
            ) : (
              'Pay Securely'
            )}
          </Button>

          {/* Security Notice */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <svg 
              className="h-4 w-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
              />
            </svg>
            <span>PCI DSS Compliant • Powered by Stripe</span>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

