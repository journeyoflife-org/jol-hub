'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';

export interface ConcertEvent {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  date: string;
  time: string;
  location: string;
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

export interface ConcertTicketsProps {
  events?: ConcertEvent[];
  onPurchase?: (eventId: string, ticketTypeId: string, quantity: number) => void;
  className?: string;
}

const defaultEvents: ConcertEvent[] = [
  { id: 'c-1', title: 'Vargonų muzikos koncertas', titleEn: 'Organ Music Concert', description: 'Klasikinės vargonų muzikos vakaras Kauno arkikatedroje.', date: '2026-04-25', time: '18:00', location: 'Kauno arkikatedra', status: 'available', ticketTypes: [
    { id: 't-1', name: 'Įprastas', nameEn: 'Standard', price: 15, currency: 'EUR', available: 100 },
    { id: 't-2', name: 'VIP', nameEn: 'VIP', price: 25, currency: 'EUR', available: 20 },
  ]},
  { id: 'c-2', title: 'Choro koncertas "Giesmės"', titleEn: 'Choir Concert "Hymns"', description: 'Šv. Jono choro atliekamos giesmės.', date: '2026-05-10', time: '17:00', location: 'Kauno arkikatedra', status: 'limited', ticketTypes: [
    { id: 't-3', name: 'Įprastas', nameEn: 'Standard', price: 12, currency: 'EUR', available: 30 },
  ]},
  { id: 'c-3', title: 'Kalėdinis koncertas', titleEn: 'Christmas Concert', description: 'Kalėdinės muzikos koncertas.', date: '2026-12-20', time: '19:00', location: 'Kauno arkikatedra', status: 'available', ticketTypes: [
    { id: 't-4', name: 'Įprastas', nameEn: 'Standard', price: 20, currency: 'EUR', available: 150 },
    { id: 't-5', name: 'VIP', nameEn: 'VIP', price: 35, currency: 'EUR', available: 25 },
  ]},
];

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

export function ConcertTickets({ events = defaultEvents, onPurchase, className }: ConcertTicketsProps) {
  const [selectedEvent, setSelectedEvent] = useState<ConcertEvent | null>(null);
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
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-heading">Koncertų bilietai</CardTitle>
        <p className="text-sm text-gray-600">Concert Tickets</p>
      </CardHeader>
      <CardContent className="p-4">
        {!selectedEvent ? (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer" onClick={() => setSelectedEvent(event)}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">{event.title}</h3>
                    {event.titleEn && <p className="text-sm text-gray-600">{event.titleEn}</p>}
                  </div>
                  <Badge className={statusColors[event.status]}>{statusLabels[event.status]?.lt}</Badge>
                </div>
                <div className="flex gap-4 text-sm text-gray-600">
                  <span>📅 {event.date}</span>
                  <span>🕐 {event.time}</span>
                </div>
                <p className="text-sm text-gray-500">📍 {event.location}</p>
                <p className="text-sm mt-2">{event.description}</p>
                <div className="mt-3 flex gap-2">
                  {event.ticketTypes.map((tt) => (
                    <Badge key={tt.id} variant="secondary">{tt.name}: {tt.price} {tt.currency}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <Button variant="ghost" onClick={() => setSelectedEvent(null)} className="mb-4">← Atgal į sąrašą</Button>
            <div className="p-4 border rounded-lg mb-4">
              <h3 className="text-xl font-medium mb-2">{selectedEvent.title}</h3>
              {selectedEvent.titleEn && <p className="text-gray-600 mb-2">{selectedEvent.titleEn}</p>}
              <div className="flex gap-4 text-sm text-gray-600 mb-2">
                <span>📅 {selectedEvent.date}</span>
                <span>🕐 {selectedEvent.time}</span>
              </div>
              <p className="text-sm">📍 {selectedEvent.location}</p>
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
                      <p className="text-sm text-gray-600">{tt.price} {tt.currency} • {tt.available} available</p>
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
            {quantities.size > 0 && <Button className="w-full mt-4" onClick={handlePurchase}>Pirkti bilietus</Button>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ConcertTickets;