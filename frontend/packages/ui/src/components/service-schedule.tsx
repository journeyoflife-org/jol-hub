/**
 * ServiceSchedule Component
 * Displays Mass times, confession, and office hours
 * Pulls data from Bitrix24 Calendar API
 * WCAG 2.1 AA accessible
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Clock, Church, Users, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from './alert';

// =============================================================================
// TYPES
// =============================================================================

export interface ServiceScheduleProps {
  parishId: string;
  className?: string;
}

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

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const SERVICE_TYPES = {
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

async function fetchScheduleFromBitrix(
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
function getMockSchedule(): ScheduleItem[] {
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

function groupByDay(schedule: ScheduleItem[]): Record<number, ScheduleItem[]> {
  return schedule.reduce((acc, item) => {
    if (!acc[item.dayOfWeek]) {
      acc[item.dayOfWeek] = [];
    }
    acc[item.dayOfWeek]!.push(item);
    return acc;
  }, {} as Record<number, ScheduleItem[]>);
}

function sortByTime(items: ScheduleItem[]): ScheduleItem[] {
  return [...items].sort((a, b) => a.startTime.localeCompare(b.startTime));
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ServiceSchedule({
  parishId,
  className = '',
}: ServiceScheduleProps): JSX.Element {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchScheduleFromBitrix(parishId);
        setSchedule(data);
      } catch (err) {
        setError('Failed to load schedule');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSchedule();
  }, [parishId]);

  const filteredSchedule = useMemo(() => {
    if (activeTab === 'all') return schedule;
    return schedule.filter((item) => item.type === activeTab);
  }, [schedule, activeTab]);

  const groupedSchedule = useMemo(() => {
    return groupByDay(filteredSchedule);
  }, [filteredSchedule]);

  const today = new Date().getDay();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Service Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="mass">Mass</TabsTrigger>
            <TabsTrigger value="confession">Confession</TabsTrigger>
            <TabsTrigger value="office">Office</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {DAYS_OF_WEEK.map((dayName, dayIndex) => {
              const daySchedule = groupedSchedule[dayIndex];
              if (!daySchedule?.length) return null;

              const isToday = dayIndex === today;
              const sortedSchedule = sortByTime(daySchedule);

              return (
                <div
                  key={dayIndex}
                  className={`rounded-lg border p-3 ${isToday ? 'bg-primary/5 border-primary/20' : ''}`}
                >
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    {dayName}
                    {isToday && (
                      <Badge variant="default" className="text-xs">
                        Today
                      </Badge>
                    )}
                  </h4>
                  <div className="space-y-2">
                    {sortedSchedule.map((item) => {
                      const typeConfig = SERVICE_TYPES[item.type];
                      return (
                        <div
                          key={item.id}
                          className="flex items-start gap-3 p-2 rounded-md bg-muted/50"
                        >
                          <div className={`p-1.5 rounded ${typeConfig.color}`}>
                            {typeConfig.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{item.title}</span>
                              <Badge variant="outline" className="text-xs">
                                {item.startTime}
                                {item.endTime && ` - ${item.endTime}`}
                              </Badge>
                              {item.language && (
                                <Badge variant="secondary" className="text-xs">
                                  {item.language}
                                </Badge>
                              )}
                            </div>
                            {item.location && (
                              <p className="text-sm text-muted-foreground">
                                {item.location}
                              </p>
                            )}
                            {item.notes && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {item.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {filteredSchedule.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No services scheduled for this category
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
