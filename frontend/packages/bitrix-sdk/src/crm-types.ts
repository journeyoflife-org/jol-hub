/**
 * CRM domain types — STEP 9 (Bitrix24 integration layer).
 *
 * These describe the HUB-BACKED CRM surface (`/api/v1/crm/*`), NOT the raw
 * Bitrix24 REST API. The frontend NEVER talks to Bitrix24 directly
 * (CORS + token exposure): data flows
 *   frontend → jol-hub backend → jol-bitrix24-integration → Bitrix24 API.
 * No Bitrix24 tokens ever appear in these types, client code, or logs.
 *
 * SECURITY (SOC 2 CC6.1 / GDPR Art. 32): every record carries its
 * `tenantSlug` for RLS isolation; the backend enforces the tenant boundary.
 */

/** Lead lifecycle (mirrors the backend `Lead.LeadStatus` choices). */
export type LeadStatus = 'NEW' | 'IN_PROGRESS' | 'CONVERTED' | 'CLOSED';

/** Lead origin (mirrors the backend `Lead.LeadSource` choices). */
export type LeadSource =
  | 'WEBSITE'
  | 'PHONE'
  | 'EMAIL'
  | 'WALK_IN'
  | 'REFERRAL'
  | 'OTHER';

/** Sanitized UTM attribution captured from the submitting page URL. */
export interface UtmParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

/** A CRM lead created from a public contact-form submission. */
export interface Lead {
  id: string;
  tenantSlug: string;
  name: string;
  email?: string;
  phone?: string;
  message?: string;
  status: LeadStatus;
  source: LeadSource;
  utm?: UtmParams;
  /** Bitrix24-side responsible user id (auto-assigned by the backend). */
  responsibleId?: number;
  /** Deep link into Bitrix24 (admin-facing; opened in a new tab). */
  bitrixUrl?: string;
  createdAt: string;
}

/** Payload for creating a lead (frontend → hub backend). */
export interface CreateLeadPayload {
  tenantSlug: string;
  name: string;
  email?: string;
  phone?: string;
  message?: string;
  source: LeadSource;
  utm?: UtmParams;
  /** GDPR consent captured by the contact form. */
  consent: boolean;
}

export interface CreateLeadResult {
  /** Backend reference number shown to the submitter. */
  reference: string;
  leadId: string;
}

/** A CRM contact (tenant-scoped). */
export interface Contact {
  id: string;
  tenantSlug: string;
  name: string;
  email?: string;
  phone?: string;
  organization?: string;
  createdAt: string;
}

/** Deal stage — the read-only sales pipeline stages surfaced by the backend. */
export interface DealStage {
  id: string;
  name: string;
}

export type DealStatus = 'NEW' | 'IN_PROGRESS' | 'WON' | 'LOST';

/** A CRM deal (tenant-scoped). Read-only in the frontend. */
export interface Deal {
  id: string;
  tenantSlug: string;
  title: string;
  stageId: string;
  stageName?: string;
  status: DealStatus;
  /** Amount in EUR cents (VAT-inclusive). */
  amountCents?: number;
  currency?: string;
  bitrixUrl?: string;
  createdAt: string;
}

/** A CRM task attached to an entity. */
export interface Task {
  id: string;
  tenantSlug: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE';
  dueDate?: string;
  entityId?: string;
  entityType?: CrmEntityType;
}

/** Activity log entry (calls, emails, notes). */
export interface Activity {
  id: string;
  tenantSlug: string;
  type: 'CALL' | 'EMAIL' | 'NOTE' | 'MEETING';
  subject: string;
  entityId?: string;
  entityType?: CrmEntityType;
  createdAt: string;
}

export type CrmEntityType = 'lead' | 'contact' | 'deal';

// =============================================================================
// WEBHOOK PAYLOADS (received by the BACKEND; typed here for contract tests)
// =============================================================================

/**
 * Bitrix24 → backend webhook envelope. The hub backend verifies signatures
 * and applies changes; the frontend only observes the result via polling/SSE.
 */
export interface BitrixWebhookPayload {
  event: string;
  ts: number;
  data: {
    FIELDS: Record<string, unknown>;
  };
}
