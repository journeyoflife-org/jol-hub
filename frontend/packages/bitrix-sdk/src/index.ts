// Main SDK exports
export { Bitrix24Client } from './client';
export { Bitrix24Error, Bitrix24ApiError, Bitrix24AuthError } from './errors';

// API endpoints
export { UserApi } from './api/user';
export { DepartmentApi } from './api/department';
export { CalendarApi } from './api/calendar';

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
