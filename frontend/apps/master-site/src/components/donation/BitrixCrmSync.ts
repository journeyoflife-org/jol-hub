/**
 * Bitrix24 CRM Integration for Donations
 * Syncs donor contacts and donation deals to Bitrix24
 * 
 * NOTE: These functions are typically called from Django backend.
 * This file provides client-side types and fallback implementations.
 */

import type { BitrixContactData, BitrixDealData, DonorData } from './types';

// =============================================================================
// CONFIGURATION
// =============================================================================

const BITRIX_WEBHOOK_URL = process.env.NEXT_PUBLIC_BITRIX_WEBHOOK_URL;

// =============================================================================
// AUDIT LOGGING
// =============================================================================

/**
 * Logs CRM operations for audit trail
 */
function logCrmOperation(
  operation: string,
  data: Record<string, unknown>,
  success: boolean
): void {
  console.log(`[BITRIX CRM] ${operation}`, {
    timestamp: new Date().toISOString(),
    success,
    data: {
      ...data,
      // Mask sensitive data
      email: data.email ? '***@***.***' : undefined,
      phone: data.phone ? '***' : undefined,
    },
  });
}

// =============================================================================
// CONTACT MANAGEMENT
// =============================================================================

/**
 * Creates or updates a donor contact in Bitrix24 CRM
 * 
 * In production, this is called from Django backend.
 * Client-side implementation is for fallback/edge cases only.
 * 
 * @param donorData - Donor information
 * @param parishCompanyId - Bitrix24 company ID for the parish
 * @returns Contact ID
 */
export async function createCrmDonationContact(
  donorData: DonorData,
  parishCompanyId?: string
): Promise<string | null> {
  // Client-side implementation is limited
  // Full implementation should be server-side
  
  if (!BITRIX_WEBHOOK_URL) {
    console.warn('[BITRIX CRM] Webhook URL not configured');
    return null;
  }
  
  const contactData: BitrixContactData = {
    NAME: donorData.name.split(' ')[0] || donorData.name,
    LAST_NAME: donorData.name.split(' ').slice(1).join(' ') || '',
    EMAIL: donorData.email,
    PHONE: donorData.phone,
    COMPANY_ID: parishCompanyId,
    SOURCE_ID: 'JOL_WEBSITE_DONATION',
    COMMENTS: `Donor from JOL-HUB donation widget\nRegistered: ${new Date().toISOString()}`,
  };
  
  try {
    // Check if contact exists by email
    const existingContact = await findContactByEmail(donorData.email);
    
    if (existingContact) {
      // Update existing contact
      logCrmOperation('UPDATE_CONTACT', { contactId: existingContact }, true);
      return existingContact;
    }
    
    // Create new contact
    logCrmOperation('CREATE_CONTACT', { email: donorData.email }, true);
    
    // In production, Django handles this
    // This is a placeholder for the actual API call
    console.log('[BITRIX CRM] Would create contact:', {
      ...contactData,
      EMAIL: '***@***.***',
      PHONE: '***',
    });
    
    return 'placeholder-contact-id';
  } catch (error) {
    logCrmOperation('CREATE_CONTACT_ERROR', { error: String(error) }, false);
    return null;
  }
}

/**
 * Finds a contact by email
 */
async function findContactByEmail(email: string): Promise<string | null> {
  if (!BITRIX_WEBHOOK_URL) return null;
  
  try {
    const response = await fetch(
      `${BITRIX_WEBHOOK_URL}/crm.contact.list.json?filter[EMAIL]=${encodeURIComponent(email)}&select[]=ID`
    );
    
    const data = await response.json();
    
    if (data.result && data.result.length > 0) {
      return data.result[0].ID;
    }
    
    return null;
  } catch (error) {
    console.error('[BITRIX CRM] Error finding contact:', error);
    return null;
  }
}

// =============================================================================
// DEAL MANAGEMENT
// =============================================================================

/**
 * Creates a donation deal in Bitrix24 CRM
 * 
 * @param contactId - Bitrix24 contact ID
 * @param amount - Donation amount
 * @param currency - Currency code
 * @param purpose - Donation purpose
 * @param parishCompanyId - Parish company ID
 * @returns Deal ID
 */
export async function createCrmDonationDeal(
  contactId: string,
  amount: number,
  currency: string,
  purpose: string,
  parishCompanyId?: string
): Promise<string | null> {
  if (!BITRIX_WEBHOOK_URL) {
    console.warn('[BITRIX CRM] Webhook URL not configured');
    return null;
  }
  
  const dealData: BitrixDealData = {
    TITLE: `Donation - ${purpose} (${new Date().toLocaleDateString()})`,
    CONTACT_ID: contactId,
    COMPANY_ID: parishCompanyId,
    OPPORTUNITY: amount,
    CURRENCY_ID: currency,
    CATEGORY_ID: 'DONATIONS',
    STAGE_ID: 'NEW',
    COMMENTS: `Purpose: ${purpose}\nSource: JOL-HUB Donation Widget`,
    UF_CRM_PURPOSE: purpose,
  };
  
  try {
    logCrmOperation('CREATE_DEAL', { 
      contactId, 
      amount, 
      currency,
      purpose 
    }, true);
    
    // In production, Django handles this
    console.log('[BITRIX CRM] Would create deal:', dealData);
    
    return 'placeholder-deal-id';
  } catch (error) {
    logCrmOperation('CREATE_DEAL_ERROR', { error: String(error) }, false);
    return null;
  }
}

/**
 * Updates deal status after payment confirmation
 * 
 * @param dealId - Bitrix24 deal ID
 * @param status - 'received' or 'failed'
 * @param paymentIntentId - Stripe payment intent ID
 */
export async function updateCrmDealStatus(
  dealId: string,
  status: 'received' | 'failed' | 'pending',
  paymentIntentId?: string
): Promise<boolean> {
  if (!BITRIX_WEBHOOK_URL) {
    console.warn('[BITRIX CRM] Webhook URL not configured');
    return false;
  }
  
  const stageMap: Record<string, string> = {
    received: 'WON',
    failed: 'LOSE',
    pending: 'NEW',
  };
  
  try {
    logCrmOperation('UPDATE_DEAL_STATUS', { 
      dealId, 
      status,
      paymentIntentId 
    }, true);
    
    // In production, Django handles this
    console.log('[BITRIX CRM] Would update deal:', {
      dealId,
      stage: stageMap[status],
      paymentIntentId,
    });
    
    return true;
  } catch (error) {
    logCrmOperation('UPDATE_DEAL_ERROR', { error: String(error) }, false);
    return false;
  }
}

// =============================================================================
// BATCH OPERATIONS
// =============================================================================

/**
 * Syncs donation to Bitrix24 (contact + deal)
 * This is the main entry point for donation sync
 * 
 * @param donorData - Donor information
 * @param donationDetails - Donation details
 * @returns Sync result
 */
export async function syncDonationToCrm(
  donorData: DonorData,
  donationDetails: {
    amount: number;
    currency: string;
    purpose: string;
    parishCompanyId?: string;
  }
): Promise<{
  success: boolean;
  contactId?: string;
  dealId?: string;
  error?: string;
}> {
  try {
    // Step 1: Create or get contact
    const contactId = await createCrmDonationContact(
      donorData,
      donationDetails.parishCompanyId
    );
    
    if (!contactId) {
      return {
        success: false,
        error: 'Failed to create contact',
      };
    }
    
    // Step 2: Create deal
    const dealId = await createCrmDonationDeal(
      contactId,
      donationDetails.amount,
      donationDetails.currency,
      donationDetails.purpose,
      donationDetails.parishCompanyId
    );
    
    return {
      success: true,
      contactId,
      dealId: dealId || undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

// =============================================================================
// REPORTING
// =============================================================================

/**
 * Gets donation statistics from Bitrix24
 * Note: This should be called from Django backend
 */
export async function getDonationStats(
  parishCompanyId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalAmount: number;
  totalCount: number;
  averageAmount: number;
} | null> {
  if (!BITRIX_WEBHOOK_URL) return null;
  
  // In production, Django handles this
  console.log('[BITRIX CRM] Would get stats:', {
    parishCompanyId,
    startDate,
    endDate,
  });
  
  return {
    totalAmount: 0,
    totalCount: 0,
    averageAmount: 0,
  };
}

// =============================================================================
// EXPORT
// =============================================================================

export default {
  createCrmDonationContact,
  createCrmDonationDeal,
  updateCrmDealStatus,
  syncDonationToCrm,
  getDonationStats,
};
