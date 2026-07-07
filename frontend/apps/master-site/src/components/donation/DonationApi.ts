/**
 * Django Backend API Integration for Donations
 * GDPR-compliant donation processing
 */

import type {
  DonationData,
  PaymentIntentResponse,
  DonationConfirmation,
  DonationApiResponse,
  TaxReceipt,
} from './types';

// =============================================================================
// CONFIGURATION
// =============================================================================

const DJANGO_API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://api.jol-hub.eu';

// =============================================================================
// CSRF TOKEN MANAGEMENT
// =============================================================================

/**
 * Gets Django CSRF token from cookies
 */
function getCsrfToken(): string | undefined {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  const csrfCookie = cookies.find(cookie => 
    cookie.trim().startsWith('csrftoken=')
  );
  
  return csrfCookie ? csrfCookie.split('=')[1] : null;
}

/**
 * Gets authorization token from localStorage
 */
function getAuthToken(): string | undefined {
  if (typeof window === 'undefined') return null;
  
  // Try to get from parish-prefixed storage first
  const parishId = window.location.hostname.split('.')[0];
  const token = localStorage.getItem(`parish:${parishId}:auth-token`) ||
                localStorage.getItem('auth-token');
  
  return token;
}

/**
 * Gets current parish subdomain from hostname
 */
function getParishSubdomain(): string | undefined {
  if (typeof window === 'undefined') return null;
  
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  // Pattern: parish-name.jol-hub.eu
  if (parts.length >= 3) {
    return parts[0];
  }
  
  return null;
}

// =============================================================================
// API CLIENT
// =============================================================================

/**
 * Base API request function with security headers
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<DonationApiResponse<T>> {
  const url = `${DJANGO_API_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  
  // Add CSRF token for mutating requests
  if (options.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }
  }
  
  // Add auth token if available
  const authToken = getAuthToken();
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  // Add parish subdomain header for data isolation
  const subdomain = getParishSubdomain();
  if (subdomain) {
    headers['x-parish-subdomain'] = subdomain;
  }
  
  // Audit logging
  console.log(`[DONATION API] ${options.method || 'GET'} ${endpoint}`, {
    timestamp: new Date().toISOString(),
    parishSubdomain: subdomain,
    hasAuth: !!authToken,
  });
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Include cookies for CSRF
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error(`[DONATION API] Error ${response.status}:`, data);
      return {
        success: false,
        error: {
          code: data.code || `HTTP_${response.status}`,
          message: data.message || 'An error occurred',
          details: data.details,
        },
      };
    }
    
    return {
      success: true,
      data: data as T,
    };
  } catch (error) {
    console.error('[DONATION API] Network error:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Network error. Please check your connection and try again.',
      },
    };
  }
}

// =============================================================================
// DONATION API FUNCTIONS
// =============================================================================

/**
 * Creates a Stripe Payment Intent via Django backend
 * 
 * @param amount - Donation amount in cents
 * @param currency - Currency code (EUR)
 * @param parishId - Parish identifier
 * @param frequency - 'one-time' or 'monthly'
 * @param donorData - Donor information
 * @returns Payment intent client secret and donation ID
 */
export async function createPaymentIntent(
  amount: number,
  currency: string,
  parishId: string,
  frequency: 'one-time' | 'monthly',
  donorData: {
    name: string;
    email: string;
    phone?: string;
  }
): Promise<DonationApiResponse<PaymentIntentResponse>> {
  // Validation
  if (amount < 100) { // 1 EUR minimum
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Minimum donation amount is 1 EUR',
      },
    };
  }
  
  if (amount > 1000000) { // 10,000 EUR maximum
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Maximum donation amount is 10,000 EUR',
      },
    };
  }
  
  return apiRequest<PaymentIntentResponse>('/api/v1/donations/intent/', {
    method: 'POST',
    body: JSON.stringify({
      amount,
      currency: currency.toLowerCase(),
      parish_id: parishId,
      frequency,
      donor_name: donorData.name,
      donor_email: donorData.email,
      donor_phone: donorData.phone,
    }),
  });
}

/**
 * Confirms donation after successful Stripe payment
 * Triggers Bitrix24 CRM sync on Django side
 * 
 * @param donationId - Internal donation ID
 * @param stripePaymentIntentId - Stripe payment intent ID
 * @returns Confirmation details
 */
export async function confirmDonation(
  donationId: string,
  stripePaymentIntentId: string
): Promise<DonationApiResponse<DonationConfirmation>> {
  return apiRequest<DonationConfirmation>(`/api/v1/donations/${donationId}/confirm/`, {
    method: 'POST',
    body: JSON.stringify({
      stripe_payment_intent_id: stripePaymentIntentId,
    }),
  });
}

/**
 * Gets tax receipt PDF for download
 * 
 * @param donationId - Donation ID
 * @returns PDF blob URL
 */
export async function getTaxReceipt(
  donationId: string
): Promise<DonationApiResponse<TaxReceipt>> {
  return apiRequest<TaxReceipt>(`/api/v1/donations/${donationId}/receipt/`);
}

/**
 * Downloads tax receipt as PDF file
 * 
 * @param donationId - Donation ID
 * @param filename - Optional custom filename
 */
export async function downloadTaxReceipt(
  donationId: string,
  filename?: string
): Promise<void> {
  const response = await fetch(
    `${DJANGO_API_URL}/api/v1/donations/${donationId}/receipt/download/`,
    {
      headers: {
        'Authorization': `Bearer ${getAuthToken() || ''}`,
        'x-parish-subdomain': getParishSubdomain() || '',
      },
      credentials: 'include',
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to download receipt');
  }
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `donation-receipt-${donationId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  
  // Audit log
  console.log('[DONATION] Tax receipt downloaded:', {
    donationId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Gets donation status
 * 
 * @param donationId - Donation ID
 * @returns Current donation status
 */
export async function getDonationStatus(
  donationId: string
): Promise<DonationApiResponse<DonationConfirmation>> {
  return apiRequest<DonationConfirmation>(`/api/v1/donations/${donationId}/`);
}

/**
 * Cancels a pending donation
 * 
 * @param donationId - Donation ID to cancel
 */
export async function cancelDonation(
  donationId: string
): Promise<DonationApiResponse<void>> {
  return apiRequest<void>(`/api/v1/donations/${donationId}/cancel/`, {
    method: 'POST',
  });
}

// =============================================================================
// WEBHOOK HANDLING (for server-side)
// =============================================================================

/**
 * Verifies Stripe webhook signature
 * Note: This should be done server-side in Django
 * This is just a type definition for reference
 */
export interface StripeWebhookEvent {
  id: string;
  object: 'event';
  api_version: string;
  created: number;
  data: {
    object: unknown;
  };
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string | undefined;
    idempotency_key: string | undefined;
  };
  type: string;
}

// =============================================================================
// EXPORT
// =============================================================================

export default {
  createPaymentIntent,
  confirmDonation,
  getTaxReceipt,
  downloadTaxReceipt,
  getDonationStatus,
  cancelDonation,
};
