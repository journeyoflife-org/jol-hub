/**
 * Bitrix24 Calendar Events API
 * Handles mass scheduling, sacraments, and church events
 */

import type { Bitrix24Client } from '../client';
import type { Bitrix24Response, Bitrix24ListResponse } from '../types';

// Event Types
export type EventType = 
  | 'mass'
  | 'sacrament'
  | 'funeral'
  | 'wedding'
  | 'baptism'
  | 'confession'
  | 'adoration'
  | 'procession'
  | 'parish_meeting'
  | 'special_event';

export type SacramentType =
  | 'baptism'
  | 'first_communion'
  | 'confirmation'
  | 'matrimony'
  | 'holy_orders'
  | 'anointing_sick'
  | 'reconciliation';

// Event interfaces
export interface Bitrix24Event {
  ID: string;
  NAME: string;
  DATE_FROM: string;
  DATE_TO: string;
  DESCRIPTION?: string;
  LOCATION?: string;
  OWNER_ID?: string;
  CREATED?: string;
  MODIFIED?: string;
  // JOL-HUB custom fields
  UF_EVENT_TYPE?: EventType;
  UF_SACRAMENT_TYPE?: SacramentType;
  UF_PARISH_CODE?: string;
  UF_CELEBRANT?: string;
  UF_INTENTION?: string;
  UF_LANGUAGE?: string;
}

export interface CreateEventParams {
  name: string;
  dateFrom: Date;
  dateTo: Date;
  eventType: EventType;
  description?: string;
  location?: string;
  parishCode?: string;
  sacramentType?: SacramentType;
  celebrant?: string;
  intention?: string;
  language?: string;
}

export interface MassSchedule {
  parishCode: string;
  weekdayTimes: string[];
  sundayTimes: string[];
  holyDayTimes: string[];
  language: string;
}

/**
 * Bitrix24 Calendar Events API
 */
export class EventApi {
  constructor(private readonly client: Bitrix24Client) {}

  /**
   * Get event by ID
   */
  async get(eventId: string): Promise<Bitrix24Response<Bitrix24Event>> {
    return this.client.get('calendar.event.getbyid', { id: eventId });
  }

  /**
   * List events with optional filtering
   */
  async list(params?: {
    filter?: Record<string, unknown>;
    from?: string;
    to?: string;
  }): Promise<Bitrix24ListResponse<Bitrix24Event>> {
    return this.client.get('calendar.event.get', params);
  }

  /**
   * Create a new event
   */
  async add(params: CreateEventParams): Promise<Bitrix24Response<{ result: number }>> {
    const fields: Record<string, unknown> = {
      NAME: params.name,
      DATE_FROM: params.dateFrom.toISOString(),
      DATE_TO: params.dateTo.toISOString(),
      UF_EVENT_TYPE: params.eventType,
      UF_LANGUAGE: params.language || 'lt',
    };

    if (params.description) fields.DESCRIPTION = params.description;
    if (params.location) fields.LOCATION = params.location;
    if (params.parishCode) fields.UF_PARISH_CODE = params.parishCode;
    if (params.sacramentType) fields.UF_SACRAMENT_TYPE = params.sacramentType;
    if (params.celebrant) fields.UF_CELEBRANT = params.celebrant;
    if (params.intention) fields.UF_INTENTION = params.intention;

    return this.client.post('calendar.event.add', { fields });
  }

  /**
   * Update an existing event
   */
  async update(
    eventId: string,
    fields: Partial<Omit<CreateEventParams, 'name' | 'dateFrom' | 'dateTo'>>
  ): Promise<Bitrix24Response<{ result: boolean }>> {
    return this.client.post('calendar.event.update', { id: eventId, fields });
  }

  /**
   * Delete an event
   */
  async delete(eventId: string): Promise<Bitrix24Response<{ result: boolean }>> {
    return this.client.post('calendar.event.delete', { id: eventId });
  }

  /**
   * Get parish events
   */
  async getParishEvents(
    parishCode: string,
    fromDate?: Date,
    toDate?: Date
  ): Promise<Bitrix24Event[]> {
    const params: Record<string, unknown> = {
      filter: { UF_PARISH_CODE: parishCode },
    };

    if (fromDate) params.from = fromDate.toISOString();
    if (toDate) params.to = toDate.toISOString();

    const response = await this.list(params);
    return response.result ?? [];
  }

  /**
   * Get mass schedule for a specific date
   */
  async getMassSchedule(parishCode: string, date?: Date): Promise<Bitrix24Event[]> {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const response = await this.list({
      filter: {
        UF_PARISH_CODE: parishCode,
        UF_EVENT_TYPE: 'mass',
      },
      from: startOfDay.toISOString(),
      to: endOfDay.toISOString(),
    });

    return response.result ?? [];
  }

  /**
   * Create a sacrament event
   */
  async createSacramentEvent(params: {
    parishCode: string;
    sacramentType: SacramentType;
    date: Date;
    celebrant?: string;
    participantName?: string;
  }): Promise<{ eventId: string }> {
    const sacramentNames: Record<SacramentType, string> = {
      baptism: 'Krikštas',
      first_communion: 'Pirma komunija',
      confirmation: 'Sutvirtinimas',
      matrimony: 'Vestuvių ceremonija',
      holy_orders: 'Šventimai',
      anointing_sick: 'Ligonių patepimas',
      reconciliation: 'Išpažintis',
    };

    const name = params.participantName
      ? `${sacramentNames[params.sacramentType]} - ${params.participantName}`
      : sacramentNames[params.sacramentType];

    const response = await this.add({
      name,
      dateFrom: params.date,
      dateTo: new Date(params.date.getTime() + 60 * 60 * 1000), // 1 hour
      eventType: 'sacrament',
      parishCode: params.parishCode,
      sacramentType: params.sacramentType,
      celebrant: params.celebrant,
    });

    return { eventId: String(response.result) };
  }
}

export default EventApi;
