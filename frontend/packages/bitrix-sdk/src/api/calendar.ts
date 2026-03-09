import type { Bitrix24Client } from '../client';
import type { Bitrix24Response } from '../types';
import type { Bitrix24CalendarEvent, Bitrix24CalendarSection } from './types';

/**
 * Calendar API endpoints for Bitrix24.
 */
export class CalendarApi {
  constructor(private readonly client: Bitrix24Client) {}

  /**
   * Get calendar events for a date range.
   */
  async getEvents(params: {
    type: 'user' | 'group' | 'company';
    ownerId?: string;
    from: string;
    to: string;
  }): Promise<Bitrix24CalendarEvent[]> {
    const response = await this.client.get<Bitrix24Response<Bitrix24CalendarEvent[]>>('calendar.event.get', {
      type: params.type,
      ownerId: params.ownerId,
      from: params.from,
      to: params.to,
    });
    return response.result;
  }

  /**
   * Get a specific event by ID.
   */
  async getEvent(id: string): Promise<Bitrix24CalendarEvent> {
    const response = await this.client.get<Bitrix24Response<Bitrix24CalendarEvent>>('calendar.event.getbyid', {
      id,
    });
    return response.result;
  }

  /**
   * Create a new calendar event.
   */
  async createEvent(event: Omit<Bitrix24CalendarEvent, 'ID'>): Promise<string> {
    const response = await this.client.post<Bitrix24Response<{ id: string }>>('calendar.event.add', {
      fields: event,
    });
    return response.result.id;
  }

  /**
   * Update a calendar event.
   */
  async updateEvent(id: string, fields: Partial<Bitrix24CalendarEvent>): Promise<boolean> {
    const response = await this.client.post<Bitrix24Response<boolean>>('calendar.event.update', {
      id,
      fields,
    });
    return response.result;
  }

  /**
   * Delete a calendar event.
   */
  async deleteEvent(id: string): Promise<boolean> {
    const response = await this.client.post<Bitrix24Response<boolean>>('calendar.event.delete', {
      id,
    });
    return response.result;
  }

  /**
   * Get calendar sections.
   */
  async getSections(params: { type: 'user' | 'group' | 'company'; ownerId?: string }): Promise<Bitrix24CalendarSection[]> {
    const response = await this.client.get<Bitrix24Response<Bitrix24CalendarSection[]>>('calendar.section.get', {
      type: params.type,
      ownerId: params.ownerId,
    });
    return response.result;
  }

  /**
   * Create a new calendar section.
   */
  async createSection(section: Omit<Bitrix24CalendarSection, 'ID'>): Promise<string> {
    const response = await this.client.post<Bitrix24Response<{ id: string }>>('calendar.section.add', {
      fields: section,
    });
    return response.result.id;
  }
}
