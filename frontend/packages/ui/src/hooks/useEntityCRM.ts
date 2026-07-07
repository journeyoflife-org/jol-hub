/**
 * Entity CRM Integration Hook
 * Shared hook for Bitrix24 CRM operations across all entity types
 * GDPR Article 44: Country-scoped data processing
 */

'use client';

import { useCallback, useState } from 'react';

// =============================================================================
// TYPES
// =============================================================================

export type EntityType = 
  | 'basilica' 
  | 'cathedral' 
  | 'diocese' 
  | 'deanery' 
  | 'church' 
  | 'protestant' 
  | 'orthodox' 
  | 'greek_catholic'
  | 'funeral_home' 
  | 'cemetery';

export interface CRMContact {
  id?: string;
  bitrixId?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  category?: 'parishioner' | 'visitor' | 'donor' | 'volunteer' | 'clergy' | 'media' | 'family' | 'vendor';
  consentGiven: boolean;
  consentDate?: string;
  source: 'website' | 'event' | 'donation' | 'manual';
}

export interface CRMDeal {
  id?: string;
  bitrixId?: number;
  contactId: string;
  title: string;
  amount: number;
  currency: string;
  category: 'donation' | 'service' | 'product' | 'pre_need' | 'maintenance';
  stage: string;
  paymentMethod?: 'stripe' | 'paypal' | 'bank_link' | 'cash';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: string;
}

export interface AuditLogEntry {
  type: string;
  timestamp: string;
  entityId: string;
  entityType: string;
  action: string;
  details?: Record<string, unknown>;
  hash?: string;
  previousHash?: string;
}

export interface EntityCRMMConfig {
  entityId: string;
  entityType: EntityType;
  country: string;
  bitrix24Portal?: string;
  apiUrl?: string;
}

export interface EntityCRMMState {
  isLoading: boolean;
  error: string | null;
  lastSync: string | null;
  pendingOperations: number;
}

export interface EntityCRMOperations {
  createContact: (contact: Omit<CRMContact, 'id' | 'bitrixId'>) => Promise<CRMContact>;
  updateContact: (id: string, data: Partial<CRMContact>) => Promise<CRMContact>;
  getContact: (id: string) => Promise<CRMContact | null>;
  createDeal: (deal: Omit<CRMDeal, 'id' | 'bitrixId'>) => Promise<CRMDeal>;
  updateDeal: (id: string, data: Partial<CRMDeal>) => Promise<CRMDeal>;
  logAuditEvent: (type: string, entityId: string, details?: Record<string, unknown>) => Promise<void>;
  syncNow: () => Promise<void>;
}

export interface UseEntityCRMReturn extends EntityCRMOperations {
  state: EntityCRMMState;
  config: EntityCRMMConfig;
}

// =============================================================================
// IMPLEMENTATION
// =============================================================================

/**
 * Hook for entity-specific CRM operations with GDPR compliance
 * 
 * @example
 * ```tsx
 * const { createContact, createDeal, state, logAuditEvent } = useEntityCRM({
 *   entityId: 'lt-basilica-vilnius-cathedral',
 *   entityType: 'basilica',
 *   country: 'lt',
 *   bitrix24Portal: 'jolhub.bitrix24.eu'
 * });
 * 
 * const contact = await createContact({
 *   firstName: 'Jonas',
 *   lastName: 'Petraitis',
 *   email: 'jonas@example.com',
 *   consentGiven: true,
 *   source: 'website'
 * });
 * ```
 */
export function useEntityCRM(config: EntityCRMMConfig): UseEntityCRMReturn {
  const [state, setState] = useState<EntityCRMMState>({
    isLoading: false,
    error: null,
    lastSync: null,
    pendingOperations: 0,
  });

  // Audit log hash chain (in production, this would be server-side)
  let lastAuditHash = '0'.repeat(64);

  /**
   * Create immutable audit log entry
   */
  const logAuditEvent = useCallback(async (
    type: string,
    entityId: string,
    details?: Record<string, unknown>
  ): Promise<void> => {
    const timestamp = new Date().toISOString();
    
    const entry: AuditLogEntry = {
      type,
      timestamp,
      entityId,
      entityType: config.entityType,
      action: type,
      details,
      previousHash: lastAuditHash,
    };

    // Generate hash for chain integrity (simplified, production would use crypto)
    const entryString = JSON.stringify(entry);
    const hash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(entryString)
    ).then(hashBuffer => {
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    });
    
    entry.hash = hash;
    lastAuditHash = hash;

    // Send to audit endpoint
    try {
      const apiUrl = config.apiUrl || process.env.NEXT_PUBLIC_API_URL || '/api';
      await fetch(`${apiUrl}/compliance/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      // Don't fail operations if audit logging fails
      console.error('[CRM] Audit log failed:', error);
    }
  }, [config.entityType, config.apiUrl]);

  /**
   * Get country-specific API URL for GDPR Article 44 compliance
   */
  const getCountryApiUrl = useCallback((): string => {
    const defaultUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    const countryUrls: Record<string, string> = {
      lt: process.env.NEXT_PUBLIC_API_URL_LT || defaultUrl,
      pl: process.env.NEXT_PUBLIC_API_URL_PL || defaultUrl,
      de: process.env.NEXT_PUBLIC_API_URL_DE || defaultUrl,
    };
    return countryUrls[config.country] ?? defaultUrl;
  }, [config.country]);

  /**
   * Create a contact in Bitrix24 CRM
   */
  const createContact = useCallback(async (
    contact: Omit<CRMContact, 'id' | 'bitrixId'>
  ): Promise<CRMContact> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const apiUrl = getCountryApiUrl();
      
      const response = await fetch(`${apiUrl}/crm/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Entity-ID': config.entityId,
          'X-Entity-Type': config.entityType,
          'X-Country': config.country,
          'X-Bitrix24-Portal': config.bitrix24Portal || '',
        },
        body: JSON.stringify(contact),
      });

      if (!response.ok) {
        throw new Error(`Failed to create contact: ${response.status}`);
      }

      const created = await response.json();

      // Log for GDPR compliance
      await logAuditEvent('contact_created', created.id, {
        action: 'create',
        entityType: 'contact',
        email: contact.email,
        consentGiven: contact.consentGiven,
        source: contact.source,
      });

      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        lastSync: new Date().toISOString() 
      }));

      return created;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create contact';
      setState(prev => ({ ...prev, isLoading: false, error: message }));
      throw error;
    }
  }, [config, getCountryApiUrl, logAuditEvent]);

  /**
   * Update an existing contact
   */
  const updateContact = useCallback(async (
    id: string,
    data: Partial<CRMContact>
  ): Promise<CRMContact> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const apiUrl = getCountryApiUrl();
      
      const response = await fetch(`${apiUrl}/crm/contacts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Entity-ID': config.entityId,
          'X-Country': config.country,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to update contact: ${response.status}`);
      }

      const updated = await response.json();

      await logAuditEvent('contact_updated', id, {
        action: 'update',
        changes: data,
      });

      setState(prev => ({ ...prev, isLoading: false }));

      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update contact';
      setState(prev => ({ ...prev, isLoading: false, error: message }));
      throw error;
    }
  }, [config, getCountryApiUrl, logAuditEvent]);

  /**
   * Get a contact by ID
   */
  const getContact = useCallback(async (id: string): Promise<CRMContact | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const apiUrl = getCountryApiUrl();
      
      const response = await fetch(`${apiUrl}/crm/contacts/${id}`, {
        headers: {
          'X-Entity-ID': config.entityId,
          'X-Country': config.country,
        },
      });

      if (response.status === 404) {
        setState(prev => ({ ...prev, isLoading: false }));
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to get contact: ${response.status}`);
      }

      const contact = await response.json();
      setState(prev => ({ ...prev, isLoading: false }));

      return contact;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get contact';
      setState(prev => ({ ...prev, isLoading: false, error: message }));
      throw error;
    }
  }, [config, getCountryApiUrl]);

  /**
   * Create a deal in Bitrix24 CRM
   */
  const createDeal = useCallback(async (
    deal: Omit<CRMDeal, 'id' | 'bitrixId'>
  ): Promise<CRMDeal> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const apiUrl = getCountryApiUrl();
      
      const response = await fetch(`${apiUrl}/crm/deals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Entity-ID': config.entityId,
          'X-Entity-Type': config.entityType,
          'X-Country': config.country,
          'X-Bitrix24-Portal': config.bitrix24Portal || '',
        },
        body: JSON.stringify(deal),
      });

      if (!response.ok) {
        throw new Error(`Failed to create deal: ${response.status}`);
      }

      const created = await response.json();

      // Log financial transaction for PCI-DSS/GDPR
      await logAuditEvent('deal_created', created.id, {
        action: 'create',
        entityType: 'deal',
        category: deal.category,
        amount: deal.amount,
        currency: deal.currency,
        paymentMethod: deal.paymentMethod,
      });

      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        lastSync: new Date().toISOString() 
      }));

      return created;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create deal';
      setState(prev => ({ ...prev, isLoading: false, error: message }));
      throw error;
    }
  }, [config, getCountryApiUrl, logAuditEvent]);

  /**
   * Update an existing deal
   */
  const updateDeal = useCallback(async (
    id: string,
    data: Partial<CRMDeal>
  ): Promise<CRMDeal> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const apiUrl = getCountryApiUrl();
      
      const response = await fetch(`${apiUrl}/crm/deals/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Entity-ID': config.entityId,
          'X-Country': config.country,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to update deal: ${response.status}`);
      }

      const updated = await response.json();

      await logAuditEvent('deal_updated', id, {
        action: 'update',
        changes: data,
      });

      setState(prev => ({ ...prev, isLoading: false }));

      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update deal';
      setState(prev => ({ ...prev, isLoading: false, error: message }));
      throw error;
    }
  }, [config, getCountryApiUrl, logAuditEvent]);

  /**
   * Trigger manual sync with CRM
   */
  const syncNow = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const apiUrl = getCountryApiUrl();
      
      const response = await fetch(`${apiUrl}/crm/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Entity-ID': config.entityId,
          'X-Entity-Type': config.entityType,
          'X-Country': config.country,
        },
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
      }

      await logAuditEvent('manual_sync', config.entityId, {
        entityType: config.entityType,
      });

      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        lastSync: new Date().toISOString() 
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed';
      setState(prev => ({ ...prev, isLoading: false, error: message }));
      throw error;
    }
  }, [config, getCountryApiUrl, logAuditEvent]);

  return {
    state,
    config,
    createContact,
    updateContact,
    getContact,
    createDeal,
    updateDeal,
    logAuditEvent,
    syncNow,
  };
}

export default useEntityCRM;
