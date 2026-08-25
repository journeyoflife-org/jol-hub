/**
 * Stripe.js error mapping — extracted from StripePaymentForm (STEP 3
 * 250-line rule). Pure function: StripeJS error → DonationError.
 */

import type { StripeError as StripeJsError } from '@stripe/stripe-js';
import type { DonationError } from './types';

export function mapStripeError(error: StripeJsError): DonationError {
  const stripeErrorType: DonationError['type'] =
    error.type === 'card_error' ? 'card' :
    error.type === 'validation_error' ? 'validation' :
    error.type === 'authentication_error' ? 'authentication' :
    'server';

  console.error('[STRIPE] Payment error:', {
    type: error.type,
    code: error.code,
    declineCode: error.decline_code,
  });

  return {
    type: stripeErrorType,
    message: error.message || 'Payment failed',
    code: error.code ?? undefined,
    retryable: error.type === 'api_error' || error.type === 'card_error',
  };
}
