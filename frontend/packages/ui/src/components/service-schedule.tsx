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
import { Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from './alert';
import {
  DAYS_OF_WEEK,
  SERVICE_TYPES,
  fetchScheduleFromBitrix,
  groupByDay,
  sortByTime,
} from './service-schedule-data';
import type { ScheduleItem } from './service-schedule-data';

// Re-export keeps the existing barrel API stable (STEP 3 250-line split).
export type { ScheduleItem, BitrixCalendarEvent } from './service-schedule-data';

// =============================================================================
// TYPES
// =============================================================================

export interface ServiceScheduleProps {
  parishId: string;
  className?: string;
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
