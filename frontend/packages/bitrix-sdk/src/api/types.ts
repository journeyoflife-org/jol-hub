/**
 * Bitrix24 user entity.
 */
export interface Bitrix24User {
  ID: string;
  ACTIVE: boolean;
  NAME: string;
  LAST_NAME: string;
  SECOND_NAME?: string;
  EMAIL: string;
  LOGIN: string;
  PERSONAL_PHOTO?: string;
  PERSONAL_GENDER?: 'M' | 'F';
  PERSONAL_BIRTHDAY?: string;
  PERSONAL_MOBILE?: string;
  PERSONAL_PHONE?: string;
  PERSONAL_CITY?: string;
  PERSONAL_STREET?: string;
  PERSONAL_COUNTRY?: string;
  WORK_POSITION?: string;
  WORK_PHONE?: string;
  UF_DEPARTMENT?: number[];
  UF_PHONE_INNER?: string;
  TIME_ZONE?: string;
  TIME_ZONE_OFFSET?: number;
  DATE_REGISTER?: string;
  LAST_LOGIN?: string;
}

/**
 * Bitrix24 department entity.
 */
export interface Bitrix24Department {
  ID: string;
  NAME: string;
  SORT?: number;
  PARENT?: string;
  UF_HEAD?: string;
  HEAD?: Bitrix24User;
}

/**
 * Bitrix24 calendar event.
 */
export interface Bitrix24CalendarEvent {
  ID: string;
  NAME: string;
  DESCRIPTION?: string;
  DATE_FROM: string;
  DATE_TO: string;
  SKIP_TIME?: boolean;
  SECTION_ID?: string;
  OWNER_ID?: string;
  ATTENDEES?: string[];
  MEETING?: {
    ID: string;
    HOST_NAME: string;
    IS_HOST?: boolean;
  };
  RRULE?: {
    FREQ: string;
    INTERVAL?: number;
    COUNT?: number;
    UNTIL?: string;
  };
}

/**
 * Calendar section (calendar type).
 */
export interface Bitrix24CalendarSection {
  ID: string;
  NAME: string;
  COLOR?: string;
  OWNER_ID?: string;
  CAL_TYPE: 'user' | 'group' | 'company';
}
