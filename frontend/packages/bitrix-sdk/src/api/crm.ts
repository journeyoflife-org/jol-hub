/**
 * Bitrix24 CRM API - Contacts, Deals, and Donation tracking
 * JOL-HUB Integration for religious institutions
 */

import type { Bitrix24Client } from '../client';
import type { Bitrix24Response, Bitrix24ListResponse } from '../types';

// Contact types
export interface Bitrix24Contact {
  ID: string;
  NAME: string;
  LAST_NAME: string;
  SECOND_NAME?: string;
  EMAIL?: Array<{ VALUE: string; TYPE: string }>;
  PHONE?: Array<{ VALUE: string; TYPE: string }>;
  WEB?: Array<{ VALUE: string; TYPE: string }>;
  BIRTHDATE?: string;
  ADDRESS?: string;
  ADDRESS_CITY?: string;
  ADDRESS_COUNTRY?: string;
  ADDRESS_POSTAL_CODE?: string;
  ADDRESS_PROVINCE?: string;
  ADDRESS_REGION?: string;
  COMMENTS?: string;
  COMPANY_ID?: string;
  COMPANY_NAME?: string;
  CREATED?: string;
  DATE_CREATE?: string;
  DATE_MODIFY?: string;
  MODIFIED?: string;
  ASSIGNED_BY_ID?: string;
  SOURCE_ID?: string;
  SOURCE_DESCRIPTION?: string;
  TYPE_ID?: string;
  OPENED?: string;
  ORIGINATOR_ID?: string;
  ORIGIN_ID?: string;
  UTM_SOURCE?: string;
  UTM_MEDIUM?: string;
  UTM_CAMPAIGN?: string;
  // JOL-HUB custom fields
  UF_PARISHIONER_ID?: string;
  UF_FAMILY_ID?: string;
  UF_PARISH_CODE?: string;
  UF_ENVELOPE_NUMBER?: string;
  UF_SACRAMENTS_RECEIVED?: string[];
}

export interface Bitrix24ContactAddParams {
  NAME: string;
  LAST_NAME?: string;
  EMAIL?: Array<{ VALUE: string; TYPE?: string }>;
  PHONE?: Array<{ VALUE: string; TYPE?: string }>;
  ADDRESS?: string;
  ADDRESS_CITY?: string;
  COMMENTS?: string;
  ASSIGNED_BY_ID?: string;
  SOURCE_ID?: string;
  OPENED?: string;
  // Custom fields
  UF_PARISHIONER_ID?: string;
  UF_FAMILY_ID?: string;
  UF_PARISH_CODE?: string;
}

export interface Bitrix24ContactUpdateParams {
  id: string;
  fields: Partial<Omit<Bitrix24ContactAddParams, 'id'>>;
}

// Deal types
export interface Bitrix24Deal {
  ID: string;
  TITLE: string;
  TYPE_ID?: string;
  CATEGORY_ID?: string;
  STAGE_ID?: string;
  STAGE_SEMANTIC_ID?: string;
  PROBABILITY?: number;
  CURRENCY_ID?: string;
  OPPORTUNITY?: number;
  LEAD_ID?: string;
  COMPANY_ID?: string;
  CONTACT_ID?: string;
  CONTACT_IDS?: string[];
  QUOTE_ID?: string;
  BEGINDATE?: string;
  CLOSEDATE?: string;
  CLOSED?: string;
  COMMENTS?: string;
  ASSIGNED_BY_ID?: string;
  CREATED_BY_ID?: string;
  MODIFIED_BY_ID?: string;
  DATE_CREATE?: string;
  DATE_MODIFY?: string;
  SOURCE_ID?: string;
  SOURCE_DESCRIPTION?: string;
  OPENED?: string;
  // JOL-HUB custom fields for donations
  UF_DONATION_TYPE?: string;
  UF_PAYMENT_METHOD?: string;
  UF_MASS_INTENTION_TYPE?: string;
  UF_RECURRING?: string;
  UF_TAX_DEDUCTIBLE?: string;
  UF_RECEIPT_SENT?: string;
}

export interface Bitrix24DealAddParams {
  TITLE: string;
  TYPE_ID?: string;
  CATEGORY_ID?: string;
  STAGE_ID?: string;
  PROBABILITY?: number;
  CURRENCY_ID?: string;
  OPPORTUNITY?: number;
  COMPANY_ID?: string;
  CONTACT_ID?: string;
  CONTACT_IDS?: string[];
  BEGINDATE?: string;
  CLOSEDATE?: string;
  COMMENTS?: string;
  ASSIGNED_BY_ID?: string;
  SOURCE_ID?: string;
  // Custom fields
  UF_DONATION_TYPE?: string;
  UF_PAYMENT_METHOD?: string;
  UF_MASS_INTENTION_TYPE?: string;
  UF_RECURRING?: string;
  UF_TAX_DEDUCTIBLE?: string;
  UF_RECEIPT_SENT?: string;
}

// Deal categories for religious institutions
export const DEAL_CATEGORIES = {
  DONATION: 'donations',
  MASS_INTENTION: 'mass_intentions',
  FUNERAL_SERVICE: 'funeral_services',
  CEMETERY_SERVICE: 'cemetery_services',
  EVENT_REGISTRATION: 'event_registrations',
} as const;

// Donation types
export type DonationType = 'one_time' | 'recurring' | 'mass_offering' | 'candle_offering' | 'special_collection';
export type PaymentMethod = 'stripe' | 'paypal' | 'bank_link' | 'cash';

export interface CreateDonationDealParams {
  contactId: string;
  amount: number;
  currency: string;
  donationType: DonationType;
  paymentMethod: PaymentMethod;
  isRecurring?: boolean;
  massIntentionType?: 'living' | 'deceased' | 'special_intention';
  taxDeductible?: boolean;
  comments?: string;
}

/**
 * Bitrix24 CRM Contact API
 */
export class ContactApi {
  constructor(private readonly client: Bitrix24Client) {}

  /**
   * Get contact by ID
   */
  async get(id: string): Promise<Bitrix24Response<Bitrix24Contact>> {
    return this.client.get('crm.contact.get', { id });
  }

  /**
   * List contacts with optional filtering
   */
  async list(params?: {
    filter?: Record<string, unknown>;
    select?: string[];
    order?: Record<string, string>;
    start?: number;
  }): Promise<Bitrix24ListResponse<Bitrix24Contact>> {
    return this.client.get('crm.contact.list', params);
  }

  /**
   * Create a new contact
   */
  async add(fields: Bitrix24ContactAddParams): Promise<Bitrix24Response<{ result: number }>> {
    return this.client.post('crm.contact.add', { fields });
  }

  /**
   * Update an existing contact
   */
  async update(params: Bitrix24ContactUpdateParams): Promise<Bitrix24Response<{ result: boolean }>> {
    return this.client.post('crm.contact.update', params as unknown as Record<string, unknown>);
  }

  /**
   * Delete a contact
   */
  async delete(id: string): Promise<Bitrix24Response<{ result: boolean }>> {
    return this.client.post('crm.contact.delete', { id });
  }

  /**
   * Find contact by email
   */
  async findByEmail(email: string): Promise<Bitrix24Contact | null> {
    const response = await this.list({
      filter: { EMAIL: email },
      select: ['ID', 'NAME', 'LAST_NAME', 'EMAIL', 'PHONE'],
    });
    return response.result?.[0] ?? null;
  }

  /**
   * Create or update contact (upsert by email)
   */
  async upsert(fields: Bitrix24ContactAddParams): Promise<{ id: string; created: boolean }> {
    if (fields.EMAIL?.[0]?.VALUE) {
      const existing = await this.findByEmail(fields.EMAIL[0].VALUE);
      if (existing) {
        await this.update({ id: existing.ID, fields });
        return { id: existing.ID, created: false };
      }
    }
    const response = await this.add(fields);
    return { id: String(response.result), created: true };
  }
}

/**
 * Bitrix24 CRM Deal API
 */
export class DealApi {
  constructor(private readonly client: Bitrix24Client) {}

  /**
   * Get deal by ID
   */
  async get(id: string): Promise<Bitrix24Response<Bitrix24Deal>> {
    return this.client.get('crm.deal.get', { id });
  }

  /**
   * List deals with optional filtering
   */
  async list(params?: {
    filter?: Record<string, unknown>;
    select?: string[];
    order?: Record<string, string>;
    start?: number;
  }): Promise<Bitrix24ListResponse<Bitrix24Deal>> {
    return this.client.get('crm.deal.list', params);
  }

  /**
   * Create a new deal
   */
  async add(fields: Bitrix24DealAddParams): Promise<Bitrix24Response<{ result: number }>> {
    return this.client.post('crm.deal.add', { fields });
  }

  /**
   * Update an existing deal
   */
  async update(id: string, fields: Partial<Bitrix24DealAddParams>): Promise<Bitrix24Response<{ result: boolean }>> {
    return this.client.post('crm.deal.update', { id, fields });
  }

  /**
   * Delete a deal
   */
  async delete(id: string): Promise<Bitrix24Response<{ result: boolean }>> {
    return this.client.post('crm.deal.delete', { id });
  }

  /**
   * Create a donation deal with CRM sync
   * GDPR compliant - logs transaction for audit trail
   */
  async createDonation(params: CreateDonationDealParams): Promise<{ dealId: string }> {
    const title = this.generateDonationTitle(params);
    
    const dealFields: Bitrix24DealAddParams = {
      TITLE: title,
      CONTACT_ID: params.contactId,
      OPPORTUNITY: params.amount,
      CURRENCY_ID: params.currency,
      CATEGORY_ID: DEAL_CATEGORIES.DONATION,
      STAGE_ID: 'NEW',
      UF_DONATION_TYPE: params.donationType,
      UF_PAYMENT_METHOD: params.paymentMethod,
      UF_RECURRING: params.isRecurring ? 'Y' : 'N',
      UF_TAX_DEDUCTIBLE: params.taxDeductible ? 'Y' : 'N',
      COMMENTS: params.comments,
    };

    if (params.massIntentionType) {
      dealFields.UF_MASS_INTENTION_TYPE = params.massIntentionType;
    }

    const response = await this.add(dealFields);
    return { dealId: String(response.result) };
  }

  /**
   * Move deal to stage
   */
  async moveToStage(dealId: string, stageId: string): Promise<boolean> {
    const response = await this.update(dealId, { STAGE_ID: stageId });
    return response.result?.result ?? false;
  }

  /**
   * Get deals by contact
   */
  async getByContact(contactId: string): Promise<Bitrix24Deal[]> {
    const response = await this.list({
      filter: { CONTACT_ID: contactId },
      select: ['ID', 'TITLE', 'OPPORTUNITY', 'CURRENCY_ID', 'STAGE_ID', 'DATE_CREATE'],
    });
    return response.result ?? [];
  }

  private generateDonationTitle(params: CreateDonationDealParams): string {
    const typeLabels: Record<DonationType, string> = {
      one_time: 'One-time Donation',
      recurring: 'Recurring Donation',
      mass_offering: 'Mass Offering',
      candle_offering: 'Candle Offering',
      special_collection: 'Special Collection',
    };
    return `${typeLabels[params.donationType]} - €${params.amount}`;
  }
}
