// =============================================================================
// STEP 9 — hub-backed CRM surface (PREFERRED)
//
// The frontend NEVER talks to Bitrix24 directly: data flows
//   frontend → jol-hub backend → jol-bitrix24-integration → Bitrix24 API.
// Use `CrmBackendClient` + the CRM hooks below. No Bitrix24 tokens exist in
// this path (SOC 2 CC6.1).
// =============================================================================
export {
  CrmBackendClient,
  backoffDelay,
  classifyStatus,
  type CrmApiError,
  type CrmErrorKind,
  type CrmResult,
  type CrmBackendClientOptions,
} from './backend-client';
export { captureUtm, sanitizeUtmValue, UTM_MAX_LENGTH } from './utm';
// NOTE: the React hooks (useCrmLead/useCrmDeals/useCrmTasks/useCreateLead)
// live behind the client-only subpath `@jol-hub/bitrix-sdk/hooks` so server
// modules (route handlers) can import this barrel without crossing the
// React server/client boundary.
export type {
  Activity,
  BitrixWebhookPayload,
  Contact,
  CreateLeadPayload,
  CreateLeadResult,
  CrmEntityType,
  Deal,
  DealStage,
  DealStatus,
  Lead,
  LeadSource,
  LeadStatus,
  Task,
  UtmParams,
} from './crm-types';

// Main SDK exports
//
// SECURITY WARNING (STEP 9): `Bitrix24Client` and the `api/*` classes are a
// DIRECT Bitrix24 API surface that requires an access token. They are legacy
// stubs for server-side tooling ONLY and MUST NOT be used from any browser
// bundle — use `CrmBackendClient` (backend-proxied, token-free) instead.
export { Bitrix24Client } from './client';
export { Bitrix24Error, Bitrix24ApiError, Bitrix24AuthError } from './errors';

// API endpoints
export { UserApi } from './api/user';
export { DepartmentApi } from './api/department';
export { CalendarApi } from './api/calendar';
export { ContactApi, DealApi, DEAL_CATEGORIES } from './api/crm';
export { EventApi } from './api/events';
export { EmailApi } from './api/email';

// Types
export type {
  Bitrix24Config,
  Bitrix24Response,
  Bitrix24ListResponse,
  Bitrix24BatchResponse,
} from './types';

export type {
  Bitrix24User,
  Bitrix24Department,
  Bitrix24CalendarEvent,
} from './api/types';

// CRM Types
export type {
  Bitrix24Contact,
  Bitrix24ContactAddParams,
  Bitrix24ContactUpdateParams,
  Bitrix24Deal,
  Bitrix24DealAddParams,
  CreateDonationDealParams,
  DonationType,
  PaymentMethod,
} from './api/crm';

// Event Types
export type {
  Bitrix24Event,
  CreateEventParams,
  EventType,
  SacramentType,
  MassSchedule,
} from './api/events';

// Email Types
export type {
  Bitrix24EmailTemplate,
  Bitrix24EmailCampaign,
  SendEmailParams,
  EmailTemplateType,
  CampaignStats,
} from './api/email';
