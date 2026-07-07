'use client';

import * as React from 'react';
import { cn } from '@jol-hub/ui';

/**
 * Mass Schedule Component for Vilnius Cathedral Basilica
 * Displays liturgical Mass times with language indicators
 */

export interface MassTime {
  time: string;
  language: 'lt' | 'en' | 'pl' | 'la';
  type?: 'ordinary' | 'solemn' | 'vigil';
  notes?: string;
}

export interface DaySchedule {
  day: string;
  masses: MassTime[];
}

export interface MassScheduleProps {
  schedule?: {
    weekdays?: MassTime[];
    saturdays?: MassTime[];
    sundays?: MassTime[];
    holyDays?: MassTime[];
  };
  className?: string;
}

const languageLabels: Record<string, string> = {
  lt: 'Lietuvių',
  en: 'English',
  pl: 'Polski',
  la: 'Latina',
};

const languageFlags: Record<string, string> = {
  lt: '🇱🇹',
  en: '🇬🇧',
  pl: '🇵🇱',
  la: '⛪',
};

const defaultSchedule = {
  weekdays: [
    { time: '07:00', language: 'lt' as const },
    { time: '18:00', language: 'lt' as const },
  ],
  saturdays: [
    { time: '18:00', language: 'lt' as const, notes: 'Sekmadienio vigilija' },
  ],
  sundays: [
    { time: '09:00', language: 'lt' as const },
    { time: '11:00', language: 'lt' as const, type: 'solemn' as const, notes: 'Solemn Mass with Choir' },
    { time: '18:00', language: 'lt' as const },
  ],
  holyDays: [
    { time: '09:00', language: 'lt' as const },
    { time: '11:00', language: 'lt' as const, type: 'solemn' as const },
    { time: '18:00', language: 'lt' as const },
  ],
};

export function MassSchedule({ schedule = defaultSchedule, className }: MassScheduleProps) {
  const [expandedDay, setExpandedDay] = React.useState<string | null>('sunday');

  const scheduleData: DaySchedule[] = [
    { day: 'Darbo dienos', masses: schedule.weekdays || [] },
    { day: 'Šeštadienis', masses: schedule.saturdays || [] },
    { day: 'Sekmadienis', masses: schedule.sundays || [] },
    { day: 'Šventės', masses: schedule.holyDays || [] },
  ];

  return (
    <div className={cn('rounded-lg bg-white dark:bg-gray-900 shadow-lg', className)}>
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <h2 className="text-2xl font-heading font-semibold text-primary">
          Šv. Mišių tvarkaraštis
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Mass Schedule</p>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {scheduleData.map((daySchedule) => (
          <div
            key={daySchedule.day}
            className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            onClick={() => setExpandedDay(expandedDay === daySchedule.day ? null : daySchedule.day)}
          >
            <div className="px-6 py-4 flex items-center justify-between">
              <span className="font-medium text-primary">{daySchedule.day}</span>
              <span className="text-sm text-gray-500">{daySchedule.masses.length} laikai</span>
            </div>

            {expandedDay === daySchedule.day && (
              <div className="px-6 pb-4 space-y-2">
                {daySchedule.masses.map((mass, index) => (
                  <div
                    key={`${mass.time}-${index}`}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg',
                      mass.type === 'solemn'
                        ? 'bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'
                        : 'bg-gray-50 dark:bg-gray-800'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-heading font-bold text-primary">{mass.time}</span>
                      <span className="text-sm" title={languageLabels[mass.language]}>
                        {languageFlags[mass.language]}
                      </span>
                      {mass.type === 'solemn' && (
                        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded dark:bg-amber-900/40 dark:text-amber-200">
                          Iškilmingos
                        </span>
                      )}
                    </div>
                    {mass.notes && (
                      <span className="text-xs text-gray-500 italic">{mass.notes}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Confession Schedule */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
        <h3 className="font-medium text-primary mb-2">Išpažintis / Confession</h3>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p>Šeštadienis: 16:00 - 17:00</p>
          <p>Sekmadienis: 08:30 - 09:00</p>
        </div>
      </div>
    </div>
  );
}

export default MassSchedule;