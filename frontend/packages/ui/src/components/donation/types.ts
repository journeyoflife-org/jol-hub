/**
 * Type definitions for donation widget
 * GDPR-compliant donation processing for JOL-HUB
 */

// =============================================================================
// DONATION DATA TYPES
// =============================================================================

export interface DonationData {
  amount: number;
  frequency: 'one-time' | 'monthly';
  purpose: string;
  consent: boolean;
  email: string;
  phone?: string;
  name: string;
}

export interface DonationWidgetProps {
  parishId: string;
  parishName: string;
  bankAccount?: string;
  defaultAmounts?: number[];
  language?: 'lt' | 'ru' | 'en';
  currency?: string;
  privacyPolicyUrl?: string;
}

// =============================================================================
// PAYMENT TYPES
// =============================================================================

export interface PaymentIntentResponse {
  clientSecret: string;
  donationId: string;
}

export interface TaxReceipt {
  url: string;
  expiresAt: string;
}

export interface DonorData {
  name: string;
  email: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
}

// =============================================================================
// STRIPE TYPES
// =============================================================================

export interface StripePaymentFormProps {
  clientSecret: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: StripeError) => void;
  isLoading?: boolean;
}

// StripeError is now an alias for DonationError since we map Stripe errors internally
export type StripeError = DonationError;

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface DonationApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface DonationConfirmation {
  donationId: string;
  status: 'pending' | 'completed' | 'failed';
  amount: number;
  currency: string;
  createdAt: string;
}

// =============================================================================
// BITRIX CRM TYPES
// =============================================================================

export interface BitrixContactData {
  NAME: string;
  LAST_NAME?: string;
  EMAIL: string;
  PHONE?: string;
  COMPANY_ID?: string;
  SOURCE_ID: string;
  COMMENTS?: string;
}

export interface BitrixDealData {
  TITLE: string;
  CONTACT_ID: string;
  COMPANY_ID?: string;
  OPPORTUNITY: number;
  CURRENCY_ID: string;
  CATEGORY_ID: string;
  STAGE_ID: string;
  COMMENTS?: string;
  UF_CRM_PURPOSE?: string;
}

// =============================================================================
// HOOK RETURN TYPES
// =============================================================================

export interface UseDonationReturn {
  donate: (data: DonationData) => Promise<void>;
  isLoading: boolean;
  error: DonationError | null;
  success: boolean;
  receiptUrl: string | null;
  donationId: string | null;
  reset: () => void;
}

export interface DonationError {
  type: 'validation' | 'network' | 'card' | 'server' | 'authentication';
  message: string;
  code?: string;
  retryable: boolean;
}

// =============================================================================
// COMPONENT PROP TYPES
// =============================================================================

export interface DonationSuccessProps {
  amount: number;
  currency: string;
  parishName: string;
  transactionId: string;
  date: Date;
  receiptUrl?: string;
  onClose?: () => void;
  onDownloadReceipt?: () => void;
}

export interface DonationErrorProps {
  error: DonationError;
  onRetry?: () => void;
  onContactSupport?: () => void;
}

// =============================================================================
// I18N TYPES
// =============================================================================

export interface DonationTranslations {
  title: string;
  subtitle: string;
  amount: {
    label: string;
    custom: string;
    minError: string;
    maxError: string;
  };
  frequency: {
    label: string;
    oneTime: string;
    monthly: string;
  };
  purpose: {
    label: string;
    general: string;
    renovation: string;
    charity: string;
    liturgical: string;
  };
  gdprConsent: string;
  privacyPolicyLink: string;
  button: {
    donate: string;
    processing: string;
    retry: string;
  };
  success: {
    title: string;
    message: string;
    downloadReceipt: string;
    returnHome: string;
  };
  error: {
    cardDeclined: string;
    networkError: string;
    authenticationFailed: string;
    validationError: string;
    contactSupport: string;
  };
}
