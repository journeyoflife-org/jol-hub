'use client';

import * as React from 'react';
import { useState } from 'react';
import { format, parseISO, isAfter } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';

export interface CommunityEvent {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: 'worship' | 'concert' | 'fellowship' | 'youth' | 'educational' | 'outreach';
  organizer: string;
  registrationRequired?: boolean;
  registrationUrl?: string;
  image?: string;
}

export interface CommunityEventsProps {
  events?: CommunityEvent[];
  onEventSelect?: (event: CommunityEvent) => void;
  className?: string;
}

const typeColors: Record<string, string> = {
  worship: 'bg-lutheran-red text-white',
  concert: 'bg-purple-100 text-purple-800',
  fellowship: 'bg-blue-100 text-blue-800',
  youth: 'bg-green-100 text-green-800',
  educational: 'bg-amber-100 text-amber-800',
  outreach: 'bg-pink-100 text-pink-800',
};

const typeLabels: Record<string, { lt: string; en: string }> = {
  worship: { lt: 'Pamaldos', en: 'Worship' },
  concert: { lt: 'Koncertas', en: 'Concert' },
  fellowship: { lt: 'Bendravimas', en: 'Fellowship' },
  youth: { lt: 'Jaunimas', en: 'Youth' },
  educational: { lt: 'Mokymai', en: 'Educational' },
  outreach: { lt: 'Parama', en: 'Outreach' },
};

const defaultEvents: CommunityEvent[] = [
  {
    id: 'e-1',
    title: 'Velykinės pamaldos',
    titleEn: 'Easter Service',
    description: 'Šventės Velykų rytą su Šv. Vakariene ir choro muzika.',
    date: '2026-04-12',
    time: '10:00',
    location: 'Kauno evangelikų liuteronų bažnyčia',
    type: 'worship',
    organizer: 'Parapija',
  },
  {
    id: 'e-2',
    title: 'Jaunimo savaitgalis',
    titleEn: 'Youth Weekend',
    description: 'Jaunimo savaitgalis su Biblijos studijomis ir bendravimu.',
    date: '2026-04-18',
    time: '18:00',
    location: 'Parapijos namai',
    type: 'youth',
    organizer: 'Jaunimo grupė',
    registrationRequired: true,
  },
  {
    id: 'e-3',
    title: 'Bacho koncertas',
    titleEn: 'Bach Concert',
    description: 'J.S. Bacho kūrinių koncertas vargonais ir chorui.',
    date: '2026-04-25',
    time: '17:00',
    location: 'Bažnyčia',
    type: 'concert',
    organizer: 'Muzikos komisija',
    registrationRequired: true,
  },
  {
    id: 'e-4',
    title: 'Moterų draugijos susirinkimas',
    titleEn: "Women's Fellowship Meeting",
    description: 'Mėnesinis moterų draugijos susirinkimas su maldomis ir bendravimu.',
    date: '2026-04-14',
    time: '18:00',
    location: 'Parapijos namai',
    type: 'fellowship',
    organizer: 'Moterų draugija',
  },
  {
    id: 'e-5',
    title: 'Lutherio katekizmo studijos',
    titleEn: 'Luther\'s Catechism Study',
    description: 'Mažojo Katekizmo studijų grupė visiems suaugusiems.',
    date: '2026-04-22',
    time: '18:30',
    location: 'Bažnyčia',
    type: 'educational',
    organizer: 'Kunigas',
  },
  {
    id: 'e-6',
    title: 'Labdaros vakaras',
    titleEn: 'Charity Evening',
    description: 'Labdaros vakaras vietos vargšams paremti.',
    date: '2026-04-30',
    time: '18:00',
    location: 'Parapijos salė',
    type: 'outreach',
    organizer: 'Diakonija',
    registrationRequired: true,
  },
];

export function CommunityEvents({
  events = defaultEvents,
  onEventSelect,
  className,
}: CommunityEventsProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const now = new Date();

  const upcomingEvents = events
    .filter((e) => isAfter(parseISO(e.date), now))
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

  const filteredEvents = upcomingEvents.filter(
    (event) => !selectedType || event.type === selectedType
  );

  const types = [...new Set(events.map((e) => e.type))];

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-heading">Bendruomenės renginiai</CardTitle>
        <p className="text-sm text-gray-600">Community Events</p>

        {/* Type Filter */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            variant={selectedType === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType(null)}
          >
            Visi ({upcomingEvents.length})
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
                  {event.titleEn && (
                    <p className="text-sm text-gray-600">{event.titleEn}</p>
                  )}
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

export default CommunityEvents;
