/**
 * Donation form validation — extracted from DonationWidget (STEP 3 250-line
 * rule). Pure functions: trivially unit-testable, no React dependency.
 */

import type { DonationError } from './types';

/** Donor email shape check (intentionally simple — backend re-validates). */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Upper bound per single donation (anti-fraud guardrail). */
export const MAX_DONATION_EUR = 10_000;

export interface DonationFormValues {
  amount: number | null;
  customAmount: string;
  name: string;
  email: string;
  consent: boolean;
}

/**
 * Validates the donation details form. Returns the FIRST failing rule as a
 * retryable validation error, or null when the form may be submitted.
 */
export function validateDonationForm(values: DonationFormValues): DonationError | null {
  const finalAmount = values.amount || parseInt(values.customAmount, 10);

  if (!finalAmount || finalAmount < 1) {
    return {
      type: 'validation',
      message: 'Please select or enter a donation amount',
      retryable: true,
    };
  }

  if (finalAmount > MAX_DONATION_EUR) {
    return {
      type: 'validation',
      message: 'Maximum donation amount is 10,000 EUR',
      retryable: true,
    };
  }

  if (!values.name.trim() || values.name.length < 2) {
    return {
      type: 'validation',
      message: 'Please enter your full name',
      retryable: true,
    };
  }

  if (!EMAIL_PATTERN.test(values.email)) {
    return {
      type: 'validation',
      message: 'Please enter a valid email address',
      retryable: true,
    };
  }

  if (!values.consent) {
    return {
      type: 'validation',
      message: 'You must consent to the processing of personal data',
      retryable: true,
    };
  }

  return null;
}
