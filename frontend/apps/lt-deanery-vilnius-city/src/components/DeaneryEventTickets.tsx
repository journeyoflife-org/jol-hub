'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';

export interface EventTicket {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  date: string;
  time: string;
  location: string;
  parishId?: string;
  parishName?: string;
  ticketTypes: TicketType[];
  status: 'available' | 'limited' | 'sold_out';
}

export interface TicketType {
  id: string;
  name: string;
  nameEn?: string;
  price: number;
  currency: string;
  available: number;
}

export interface DeaneryEventTicketsProps {
  events?: EventTicket[];
  onPurchase?: (eventId: string, ticketTypeId: string, quantity: number) => void;
  className?: string;
}

const statusColors: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  limited: 'bg-amber-100 text-amber-800',
  sold_out: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, { lt: string; en: string }> = {
  available: { lt: 'Bilietų yra', en: 'Available' },
  limited: { lt: 'Likę nedaug', en: 'Limited' },
  sold_out: { lt: 'Išparduota', en: 'Sold Out' },
};

const defaultEvents: EventTicket[] = [
  {
    id: 't-1',
    title: 'Vargonų muzikos vakaras',
    titleEn: 'Organ Music Evening',
    description: 'Klasikinės muzikos koncertas dekanato bažnyčiose.',
    date: '2026-04-20',
    time: '18:00',
    location: 'Vilniaus Šv. Kazimiero bažnyčia',
    parishId: 'p-3',
    parishName: 'Šv. Kazimiero parapija',
    status: 'available',
    ticketTypes: [
      { id: 'tt-1', name: 'Įprastas', nameEn: 'Standard', price: 12, currency: 'EUR', available: 100 },
      { id: 'tt-2', name: 'VIP', nameEn: 'VIP', price: 20, currency: 'EUR', available: 20 },
    ],
  },
  {
    id: 't-2',
    title: 'Jaunimo koncertas',
    titleEn: 'Youth Concert',
    description: 'Jaunimo muzikos grupių koncertas.',
    date: '2026-04-25',
    time: '17:00',
    location: 'Vilniaus Šv. Jonų bažnyčia',
    parishId: 'p-2',
    parishName: 'Šv. Jonų parapija',
    status: 'limited',
    ticketTypes: [
      { id: 'tt-3', name: 'Bilietas', nameEn: 'Ticket', price: 8, currency: 'EUR', available: 25 },
    ],
  },
  {
    id: 't-3',
    title: 'Labdaros vakaras',
    titleEn: 'Charity Evening',
    description: 'Labdaros koncertas vargšams paremti.',
    date: '2026-05-05',
    time: '19:00',
    location: 'Vilniaus Šv. Petro ir Pauliaus bažnyčia',
    parishId: 'p-1',
    parishName: 'Šv. Petro ir Pauliaus parapija',
    status: 'available',
    ticketTypes: [
      { id: 'tt-4', name: 'Įprastas', nameEn: 'Standard', price: 15, currency: 'EUR', available: 80 },
      { id: 'tt-5', name: 'Rėmėjo', nameEn: 'Supporter', price: 30, currency: 'EUR', available: 30 },
    ],
  },
];

export function DeaneryEventTickets({ events = defaultEvents, onPurchase, className }: DeaneryEventTicketsProps) {
  const [selectedEvent, setSelectedEvent] = useState<EventTicket | null>(null);
  const [quantities, setQuantities] = useState<Map<string, number>>(new Map());

  const updateQuantity = (ticketTypeId: string, delta: number) => {
    setQuantities((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(ticketTypeId) || 0;
      const newQty = Math.max(0, current + delta);
      if (newQty === 0) newMap.delete(ticketTypeId);
      else newMap.set(ticketTypeId, newQty);
      return newMap;
    });
  };

  const handlePurchase = () => {
    if (!selectedEvent) return;
    quantities.forEach((quantity, ticketTypeId) => {
      onPurchase?.(selectedEvent.id, ticketTypeId, quantity);
    });
    setQuantities(new Map());
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-heading">Renginių bilietai</CardTitle>
        <p className="text-sm text-gray-600">Deanery Event Tickets</p>
      </CardHeader>

      <CardContent className="p-4">
        {!selectedEvent ? (
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                onClick={() => setSelectedEvent(event)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">{event.title}</h3>
                    {event.titleEn && <p className="text-sm text-gray-600">{event.titleEn}</p>}
                  </div>
                  <Badge className={statusColors[event.status]}>{statusLabels[event.status]?.lt}</Badge>
                </div>

                <div className="flex gap-4 text-sm text-gray-600 mb-2">
                  <span>📅 {event.date}</span>
                  <span>🕐 {event.time}</span>
                </div>
                <p className="text-sm text-gray-500">📍 {event.location}</p>
                <p className="text-sm mt-2">{event.description}</p>

                <div className="mt-3 flex gap-2 flex-wrap">
                  {event.parishName && <Badge variant="outline">{event.parishName}</Badge>}
                  {event.ticketTypes.map((tt) => (
                    <Badge key={tt.id} variant="secondary">{tt.name}: {tt.price} {tt.currency}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <Button variant="ghost" onClick={() => setSelectedEvent(null)} className="mb-4">
              ← Atgal į sąrašą
            </Button>

            <div className="p-4 border rounded-lg mb-6">
              <h3 className="text-xl font-medium mb-2">{selectedEvent.title}</h3>
              {selectedEvent.titleEn && <p className="text-gray-600 mb-2">{selectedEvent.titleEn}</p>}
              <div className="flex gap-4 text-sm text-gray-600 mb-2">
                <span>📅 {selectedEvent.date}</span>
                <span>🕐 {selectedEvent.time}</span>
              </div>
              <p className="text-sm">📍 {selectedEvent.location}</p>
              {selectedEvent.parishName && (
                <Badge variant="outline" className="mt-2">{selectedEvent.parishName}</Badge>
              )}
            </div>

            <h4 className="font-medium mb-3">Pasirinkite bilietus:</h4>
            <div className="space-y-3">
              {selectedEvent.ticketTypes.map((tt) => {
                const qty = quantities.get(tt.id) || 0;
                return (
                  <div key={tt.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{tt.name}</p>
                      {tt.nameEn && <p className="text-sm text-gray-600">{tt.nameEn}</p>}
                      <p className="text-sm text-gray-600">{tt.price} {tt.currency} • Laisvų: {tt.available}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {qty > 0 && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => updateQuantity(tt.id, -1)}>-</Button>
                          <span className="w-8 text-center">{qty}</span>
                        </>
                      )}
                      <Button size="sm" onClick={() => updateQuantity(tt.id, 1)}>+</Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {quantities.size > 0 && (
              <Button className="w-full mt-4" onClick={handlePurchase}>
                Pirkti bilietus
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DeaneryEventTickets;
