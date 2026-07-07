/**
 * Donation Widget Module Exports
 * GDPR-compliant donation processing for JOL-HUB
 */

// =============================================================================
// COMPONENTS
// =============================================================================

export { DonationWidget } from './DonationWidget';
export { StripePaymentForm } from './StripePaymentForm';
export { DonationSuccess } from './DonationSuccess';
export { DonationErrorComponent as DonationError } from './DonationError';

// =============================================================================
// HOOKS
// =============================================================================

export { useDonation } from './useDonation';

// =============================================================================
// API
// =============================================================================

export {
  createPaymentIntent,
  confirmDonation,
  getTaxReceipt,
  downloadTaxReceipt,
  getDonationStatus,
  cancelDonation,
} from './DonationApi';

// =============================================================================
// CRM SYNC
// =============================================================================

export {
  createCrmDonationContact,
  createCrmDonationDeal,
  updateCrmDealStatus,
  syncDonationToCrm,
  getDonationStats,
} from './BitrixCrmSync';

// =============================================================================
// TYPES
// =============================================================================

export type {
  DonationData,
  DonationWidgetProps,
  PaymentIntentResponse,
  TaxReceipt,
  DonorData,
  StripePaymentFormProps,
  StripeError,
  DonationApiResponse,
  DonationConfirmation,
  BitrixContactData,
  BitrixDealData,
  UseDonationReturn,
  DonationError as DonationErrorType,
  DonationSuccessProps,
  DonationErrorProps,
  DonationTranslations,
} from './types';
