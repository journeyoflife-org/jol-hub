// Main SDK exports
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
