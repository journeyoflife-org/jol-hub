'use client';

import * as React from 'react';
import { useState } from 'react';
import { format, isAfter, parseISO } from 'date-fns';
import { lt } from 'date-fns/locale';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';

export interface DiocesanEvent {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  date: string;
  endDate?: string;
  time?: string;
  location: string;
  category: 'liturgical' | 'diocesan' | 'pilgrimage' | 'conference' | 'youth' | 'music';
  organizer?: string;
  registrationRequired?: boolean;
  registrationUrl?: string;
}

export interface DiocesanEventsCalendarProps {
  events?: DiocesanEvent[];
  onEventSelect?: (event: DiocesanEvent) => void;
  className?: string;
}

const categoryColors: Record<string, string> = {
  liturgical: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
  diocesan: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  pilgrimage: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  conference: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  youth: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
  music: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
};

const categoryLabels: Record<string, { lt: string; en: string }> = {
  liturgical: { lt: 'Liturginis', en: 'Liturgical' },
  diocesan: { lt: 'Arkivyskupijos', en: 'Diocesan' },
  pilgrimage: { lt: 'Piligrimystė', en: 'Pilgrimage' },
  conference: { lt: 'Konferencija', en: 'Conference' },
  youth: { lt: 'Jaunimui', en: 'Youth' },
  music: { lt: 'Muzikos', en: 'Music' },
};

const defaultEvents: DiocesanEvent[] = [
  {
    id: '1',
    title: 'Vyskupų šventimo metinės',
    titleEn: 'Ordination Anniversary',
    description: 'Arkivyskupo metinės progomis vyks iškilmingos Šv. Mišios.',
    date: '2026-04-15',
    time: '11:00',
    location: 'Kauno arkikatedra',
    category: 'liturgical',
  },
  {
    id: '2',
    title: 'Jaunimo diena',
    titleEn: 'Youth Day',
    description: 'Arkivyskupijos jaunimo susitikimas su vyskupu.',
    date: '2026-04-20',
    time: '14:00',
    location: 'Kauno Šv. Jurgio bažnyčia',
    category: 'youth',
    registrationRequired: true,
  },
  {
    id: '3',
    title: 'Vargonų muzikos koncertas',
    titleEn: 'Organ Music Concert',
    description: 'Klasikinės vargonų muzikos koncertas Katedroje.',
    date: '2026-04-25',
    time: '18:00',
    location: 'Kauno arkikatedra',
    category: 'music',
    registrationRequired: true,
  },
];

export function DiocesanEventsCalendar({
  events = defaultEvents,
  onEventSelect,
  className,
}: DiocesanEventsCalendarProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const now = new Date();
  
  const upcomingEvents = events
    .filter((e) => isAfter(parseISO(e.date), now))
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

  const filteredEvents = selectedCategory
    ? upcomingEvents.filter((e) => e.category === selectedCategory)
    : upcomingEvents;

  const categories = [...new Set(events.map((e) => e.category))];

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-heading">Arkivyskupijos renginiai</CardTitle>
        <p className="text-sm text-gray-600">Diocesan Events Calendar</p>
        
        <div className="flex flex-wrap gap-2 mt-4">
          <Button variant={selectedCategory === null ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory(null)}>
            Visi
          </Button>
          {categories.map((cat) => (
            <Button key={cat} variant={selectedCategory === cat ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory(cat)}>
              {categoryLabels[cat]?.lt || cat}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              onClick={() => onEventSelect?.(event)}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium text-primary">{event.title}</h3>
                  {event.titleEn && <p className="text-sm text-gray-600">{event.titleEn}</p>}
                </div>
                <Badge className={categoryColors[event.category]}>
                  {categoryLabels[event.category]?.lt}
                </Badge>
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
                <span>📅 {format(parseISO(event.date), 'yyyy-MM-dd', { locale: lt })}</span>
                {event.time && <span>🕐 {event.time}</span>}
                <span>📍 {event.location}</span>
              </div>
              
              <p className="text-sm text-gray-600">{event.description}</p>
              
              {event.registrationRequired && (
                <Badge variant="secondary" className="mt-2">Reikalinga registracija</Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default DiocesanEventsCalendar;