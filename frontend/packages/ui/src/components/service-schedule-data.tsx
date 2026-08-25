/**
 * ServiceSchedule data layer — types, Bitrix24 calendar fetch, mock
 * fallback and list helpers. Extracted from service-schedule.tsx for the
 * STEP 3 250-line rule.
 */

import { Clock, Church, Users, Calendar } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

export interface ScheduleItem {
  id: string;
  type: 'mass' | 'confession' | 'office' | 'adoration' | 'other';
  title: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // HH:MM format
  endTime?: string; // HH:MM format
  location?: string;
  notes?: string;
  language?: string;
  isHolyDay?: boolean;
}

export interface BitrixCalendarEvent {
  ID: string;
  NAME: string;
  DATE_FROM: string;
  DATE_TO: string;
  LOCATION?: string;
  DESCRIPTION?: string;
  UF_CRM_TYPE?: string;
  UF_CRM_LANGUAGE?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const SERVICE_TYPES = {
  mass: {
    label: 'Holy Mass',
    icon: <Church className="h-4 w-4" />,
    color: 'bg-red-100 text-red-800 border-red-200',
  },
  confession: {
    label: 'Confession',
    icon: <Users className="h-4 w-4" />,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  office: {
    label: 'Office Hours',
    icon: <Clock className="h-4 w-4" />,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  adoration: {
    label: 'Adoration',
    icon: <Church className="h-4 w-4" />,
    color: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  other: {
    label: 'Other',
    icon: <Calendar className="h-4 w-4" />,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
  },
};

// =============================================================================
// BITRIX24 API INTEGRATION
// =============================================================================

export async function fetchScheduleFromBitrix(
  parishId: string
): Promise<ScheduleItem[]> {
  const webhookUrl = process.env.NEXT_PUBLIC_BITRIX_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error('[SERVICE SCHEDULE] Bitrix webhook URL not configured');
    return getMockSchedule();
  }

  try {
    // Fetch calendar events from Bitrix24
    const response = await fetch(
      `${webhookUrl}calendar.event.get.json?` +
      new URLSearchParams({
        type: 'user',
        ownerId: parishId,
        from: new Date().toISOString().slice(0, 10),
        to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      })
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error_description || result.error);
    }

    // Transform Bitrix events to ScheduleItems
    return (result.result || []).map((event: BitrixCalendarEvent): ScheduleItem => {
      const date = new Date(event.DATE_FROM);
      return {
        id: event.ID,
        type: (event.UF_CRM_TYPE as ScheduleItem['type']) || 'other',
        title: event.NAME,
        dayOfWeek: date.getDay(),
        startTime: event.DATE_FROM.split(' ')[1]?.substring(0, 5) || '09:00',
        endTime: event.DATE_TO?.split(' ')[1]?.substring(0, 5),
        location: event.LOCATION,
        notes: event.DESCRIPTION,
        language: event.UF_CRM_LANGUAGE,
      };
    });
  } catch (error) {
    console.error('[SERVICE SCHEDULE] Error fetching from Bitrix:', error);
    return getMockSchedule();
  }
}

// Mock data for development/fallback
export function getMockSchedule(): ScheduleItem[] {
  return [
    { id: '1', type: 'mass', title: 'Sunday Mass', dayOfWeek: 0, startTime: '09:00', location: 'Main Church', language: 'Lithuanian' },
    { id: '2', type: 'mass', title: 'Sunday Mass', dayOfWeek: 0, startTime: '11:00', location: 'Main Church', language: 'Polish' },
    { id: '3', type: 'mass', title: 'Sunday Mass', dayOfWeek: 0, startTime: '18:00', location: 'Main Church', language: 'Lithuanian' },
    { id: '4', type: 'mass', title: 'Daily Mass', dayOfWeek: 1, startTime: '08:00', location: 'Chapel', language: 'Lithuanian' },
    { id: '5', type: 'mass', title: 'Daily Mass', dayOfWeek: 2, startTime: '08:00', location: 'Chapel', language: 'Lithuanian' },
    { id: '6', type: 'mass', title: 'Daily Mass', dayOfWeek: 3, startTime: '08:00', location: 'Chapel', language: 'Lithuanian' },
    { id: '7', type: 'mass', title: 'Daily Mass', dayOfWeek: 4, startTime: '08:00', location: 'Chapel', language: 'Lithuanian' },
    { id: '8', type: 'mass', title: 'Daily Mass', dayOfWeek: 5, startTime: '08:00', location: 'Chapel', language: 'Lithuanian' },
    { id: '9', type: 'mass', title: 'Saturday Mass', dayOfWeek: 6, startTime: '09:00', location: 'Main Church', language: 'Lithuanian' },
    { id: '10', type: 'confession', title: 'Confession', dayOfWeek: 6, startTime: '15:00', endTime: '16:00', location: 'Confessional', notes: 'Or by appointment' },
    { id: '11', type: 'office', title: 'Parish Office', dayOfWeek: 1, startTime: '09:00', endTime: '17:00', location: 'Parish House' },
    { id: '12', type: 'office', title: 'Parish Office', dayOfWeek: 2, startTime: '09:00', endTime: '17:00', location: 'Parish House' },
    { id: '13', type: 'office', title: 'Parish Office', dayOfWeek: 3, startTime: '09:00', endTime: '17:00', location: 'Parish House' },
    { id: '14', type: 'office', title: 'Parish Office', dayOfWeek: 4, startTime: '09:00', endTime: '17:00', location: 'Parish House' },
    { id: '15', type: 'office', title: 'Parish Office', dayOfWeek: 5, startTime: '09:00', endTime: '16:00', location: 'Parish House' },
    { id: '16', type: 'adoration', title: 'Eucharistic Adoration', dayOfWeek: 4, startTime: '16:00', endTime: '17:00', location: 'Chapel' },
  ];
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function groupByDay(schedule: ScheduleItem[]): Record<number, ScheduleItem[]> {
  return schedule.reduce((acc, item) => {
    if (!acc[item.dayOfWeek]) {
      acc[item.dayOfWeek] = [];
    }
    acc[item.dayOfWeek]!.push(item);
    return acc;
  }, {} as Record<number, ScheduleItem[]>);
}

export function sortByTime(items: ScheduleItem[]): ScheduleItem[] {
  return [...items].sort((a, b) => a.startTime.localeCompare(b.startTime));
}
