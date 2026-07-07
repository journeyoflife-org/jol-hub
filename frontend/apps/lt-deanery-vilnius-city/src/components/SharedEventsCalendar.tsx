'use client';

import * as React from 'react';
import { useState } from 'react';
import { format, parseISO, isAfter } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';

export interface SharedEvent {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  date: string;
  time: string;
  location: string;
  parishId?: string;
  parishName?: string;
  type: 'mass' | 'concert' | 'pilgrimage' | 'retreat' | 'youth' | 'charity';
  organizer: string;
  registrationRequired?: boolean;
  registrationUrl?: string;
}

export interface SharedEventsCalendarProps {
  events?: SharedEvent[];
  onEventSelect?: (event: SharedEvent) => void;
  className?: string;
}

const typeColors: Record<string, string> = {
  mass: 'bg-purple-100 text-purple-800',
  concert: 'bg-red-100 text-red-800',
  pilgrimage: 'bg-amber-100 text-amber-800',
  retreat: 'bg-green-100 text-green-800',
  youth: 'bg-blue-100 text-blue-800',
  charity: 'bg-pink-100 text-pink-800',
};

const typeLabels: Record<string, { lt: string; en: string }> = {
  mass: { lt: 'Šv. Mišios', en: 'Holy Mass' },
  concert: { lt: 'Koncertas', en: 'Concert' },
  pilgrimage: { lt: 'Piligrimystė', en: 'Pilgrimage' },
  retreat: { lt: 'Rekolekcijos', en: 'Retreat' },
  youth: { lt: 'Jaunimui', en: 'Youth' },
  charity: { lt: 'Labdara', en: 'Charity' },
};

const defaultEvents: SharedEvent[] = [
  {
    id: 'e-1',
    title: 'Dekanato jaunimo susitikimas',
    titleEn: 'Deanery Youth Meeting',
    description: 'Visų dekanato jaunimo susitikimas su dekanu.',
    date: '2026-04-15',
    time: '18:00',
    location: 'Vilniaus Šv. Jonų bažnyčia',
    type: 'youth',
    organizer: 'Dekanato jaunimo centras',
    registrationRequired: true,
  },
  {
    id: 'e-2',
    title: 'Vargonų muzikos vakaras',
    titleEn: 'Organ Music Evening',
    description: 'Klasikinės muzikos koncertas dekanato bažnyčiose.',
    date: '2026-04-20',
    time: '18:00',
    location: 'Vilniaus Šv. Kazimiero bažnyčia',
    parishId: 'p-3',
    parishName: 'Šv. Kazimiero parapija',
    type: 'concert',
    organizer: 'Dekanato kultūros tarnyba',
    registrationRequired: true,
  },
  {
    id: 'e-3',
    title: 'Bendros Velykinės rekolekcijos',
    titleEn: 'Shared Easter Retreat',
    description: 'Dekanato bendros rekolekcijos prieš Velykas.',
    date: '2026-04-10',
    time: '10:00',
    location: 'Aušros Vartai',
    type: 'retreat',
    organizer: 'Kun. Dr. J. Ivanauskas',
  },
  {
    id: 'e-4',
    title: 'Piligrimystė į Trakus',
    titleEn: 'Pilgrimage to Trakai',
    description: 'Dekanato piligrimystė į Trakų bažnyčią.',
    date: '2026-05-01',
    time: '08:00',
    location: 'Trakai',
    type: 'pilgrimage',
    organizer: 'Dekanato piligrimų grupė',
    registrationRequired: true,
  },
  {
    id: 'e-5',
    title: 'Labdaros koncertas',
    titleEn: 'Charity Concert',
    description: 'Labdaros koncertas vargšams paremti.',
    date: '2026-04-25',
    time: '17:00',
    location: 'Vilniaus Šv. Petro ir Pauliaus bažnyčia',
    parishId: 'p-1',
    parishName: 'Šv. Petro ir Pauliaus parapija',
    type: 'charity',
    organizer: 'Caritas Vilnius',
  },
];

export function SharedEventsCalendar({
  events = defaultEvents,
  onEventSelect,
  className,
}: SharedEventsCalendarProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedParish, setSelectedParish] = useState<string | null>(null);
  const now = new Date();

  const upcomingEvents = events
    .filter((e) => isAfter(parseISO(e.date), now))
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

  const filteredEvents = upcomingEvents.filter((event) => {
    const matchesType = !selectedType || event.type === selectedType;
    const matchesParish = !selectedParish || event.parishId === selectedParish;
    return matchesType && matchesParish;
  });

  const types = [...new Set(events.map((e) => e.type))];
  const parishes = events.filter((e) => e.parishId && e.parishName).map((e) => ({ id: e.parishId!, name: e.parishName! }));

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-heading">Dekanato renginiai</CardTitle>
        <p className="text-sm text-gray-600">Shared Events Calendar</p>

        {/* Type Filter */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Button variant={selectedType === null ? 'default' : 'outline'} size="sm" onClick={() => setSelectedType(null)}>
            Visi
          </Button>
          {types.map((type) => (
            <Button
              key={type}
              variant={selectedType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType(type)}
            >
              {typeLabels[type]?.lt}
            </Button>
          ))}
        </div>

        {/* Parish Filter */}
        {parishes.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            <Button variant={selectedParish === null ? 'default' : 'outline'} size="sm" onClick={() => setSelectedParish(null)}>
              Visos parapijos
            </Button>
            {parishes.map((parish) => (
              <Button
                key={parish.id}
                variant={selectedParish === parish.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedParish(parish.id)}
              >
                {parish.name}
              </Button>
            ))}
          </div>
        )}
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
                <Badge className={typeColors[event.type]}>
                  {typeLabels[event.type]?.lt}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
                <span>📅 {format(parseISO(event.date), 'yyyy-MM-dd')}</span>
                <span>🕐 {event.time}</span>
                <span>📍 {event.location}</span>
              </div>

              <p className="text-sm text-gray-600">{event.description}</p>

              <div className="flex items-center justify-between mt-3">
                <span className="text-sm text-gray-500">Organizuoja: {event.organizer}</span>
                {event.registrationRequired && (
                  <Badge variant="secondary">Reikalinga registracija</Badge>
                )}
              </div>

              {event.parishName && (
                <div className="mt-2">
                  <Badge variant="outline">{event.parishName}</Badge>
                </div>
              )}
            </div>
          ))}

          {filteredEvents.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>Nėra būsimų renginių.</p>
              <p className="text-sm">No upcoming events.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default SharedEventsCalendar;
