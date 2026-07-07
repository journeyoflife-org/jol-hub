'use client';

import * as React from 'react';
import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';

export interface EventTicket {
  id: string;
  eventId: string;
  eventName: string;
  eventNameEn?: string;
  date: string;
  time: string;
  location: string;
  ticketTypes: {
    id: string;
    name: string;
    nameEn: string;
    price: number;
    available: number;
    description?: string;
  }[];
}

export interface EventTicketsProps {
  tickets?: EventTicket[];
  onPurchase?: (eventId: string, ticketTypeId: string, quantity: number) => void;
  className?: string;
}

const defaultTickets: EventTicket[] = [
  {
    id: 't-1',
    eventId: 'e-2',
    eventName: 'Jaunimo savaitgalis',
    eventNameEn: 'Youth Weekend',
    date: '2026-04-18',
    time: '18:00',
    location: 'Parapijos namai',
    ticketTypes: [
      {
        id: 'tt-1',
        name: 'Pilnas bilietas',
        nameEn: 'Full Ticket',
        price: 25,
        available: 30,
        description: 'Apgyvendinimas, maitinimas, medžiaga',
      },
      {
        id: 'tt-2',
        name: 'Dienos bilietas',
        nameEn: 'Day Pass',
        price: 10,
        available: 50,
        description: 'Tik šeštadienio programai',
      },
    ],
  },
  {
    id: 't-2',
    eventId: 'e-3',
    eventName: 'Bacho koncertas',
    eventNameEn: 'Bach Concert',
    date: '2026-04-25',
    time: '17:00',
    location: 'Bažnyčia',
    ticketTypes: [
      {
        id: 'tt-3',
        name: 'Bendras bilietas',
        nameEn: 'General Admission',
        price: 15,
        available: 100,
      },
      {
        id: 'tt-4',
        name: 'Paramos bilietas',
        nameEn: 'Supporter Ticket',
        price: 25,
        available: 20,
        description: 'Parama parapijos muzikos programai',
      },
    ],
  },
  {
    id: 't-3',
    eventId: 'e-6',
    eventName: 'Labdaros vakaras',
    eventNameEn: 'Charity Evening',
    date: '2026-04-30',
    time: '18:00',
    location: 'Parapijos salė',
    ticketTypes: [
      {
        id: 'tt-5',
        name: 'Įėjimo bilietas',
        nameEn: 'Entry Ticket',
        price: 20,
        available: 80,
        description: 'Įėjimas, vakarienė, programa',
      },
    ],
  },
];

export function EventTickets({
  tickets = defaultTickets,
  onPurchase,
  className,
}: EventTicketsProps) {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [selectedTicketType, setSelectedTicketType] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [step, setStep] = useState(1);

  const handlePurchase = () => {
    if (selectedEvent && selectedTicketType) {
      onPurchase?.(selectedEvent, selectedTicketType, quantity);
      setStep(1);
      setSelectedEvent(null);
      setSelectedTicketType(null);
      setQuantity(1);
    }
  };

  const selectedEventDetails = tickets.find((t) => t.eventId === selectedEvent);
  const selectedTicketDetails = selectedEventDetails?.ticketTypes.find(
    (tt) => tt.id === selectedTicketType
  );

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-heading">Renginių bilietai</CardTitle>
        <p className="text-sm text-gray-600">Event Tickets</p>
      </CardHeader>

      <CardContent className="p-4">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Pasirinkite renginį / Select Event</h3>

            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={cn(
                    'p-4 border rounded-lg cursor-pointer transition-all',
                    selectedEvent === ticket.eventId
                      ? 'border-primary bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                  )}
                  onClick={() => {
                    setSelectedEvent(ticket.eventId);
                    setSelectedTicketType(null);
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-primary">{ticket.eventName}</h4>
                      {ticket.eventNameEn && (
                        <p className="text-sm text-gray-600">{ticket.eventNameEn}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge className="bg-lutheran-gold text-gray-900">
                        Nuo €{Math.min(...ticket.ticketTypes.map((t) => t.price))}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>📅 {format(new Date(ticket.date), 'yyyy-MM-dd')}</span>
                    <span>🕐 {ticket.time}</span>
                    <span>📍 {ticket.location}</span>
                  </div>

                  <div className="flex gap-2 mt-2">
                    {ticket.ticketTypes.map((tt) => (
                      <Badge key={tt.id} variant="outline" className="text-xs">
                        {tt.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <Button
              className="w-full mt-4"
              disabled={!selectedEvent}
              onClick={() => setStep(2)}
            >
              Tęsti / Continue
            </Button>
          </div>
        )}

        {step === 2 && selectedEventDetails && (
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Pasirinkite bilieto tipą / Select Ticket Type</h3>

            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="font-medium">{selectedEventDetails.eventName}</p>
              <p className="text-sm text-gray-600">
                {format(new Date(selectedEventDetails.date), 'yyyy-MM-dd')} | {selectedEventDetails.time}
              </p>
            </div>

            <div className="space-y-3">
              {selectedEventDetails.ticketTypes.map((tt) => (
                <div
                  key={tt.id}
                  className={cn(
                    'p-4 border rounded-lg cursor-pointer transition-all',
                    selectedTicketType === tt.id
                      ? 'border-primary bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                  )}
                  onClick={() => setSelectedTicketType(tt.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{tt.name}</h4>
                      <p className="text-sm text-gray-600">{tt.nameEn}</p>
                      {tt.description && (
                        <p className="text-xs text-gray-500 mt-1">{tt.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">€{tt.price}</p>
                      <p className="text-xs text-gray-500">Liko: {tt.available}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Atgal / Back
              </Button>
              <Button
                className="flex-1"
                disabled={!selectedTicketType}
                onClick={() => setStep(3)}
              >
                Tęsti / Continue
              </Button>
            </div>
          </div>
        )}

        {step === 3 && selectedEventDetails && selectedTicketDetails && (
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Patvirtinkite užsakymą / Confirm Order</h3>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="font-medium">{selectedEventDetails.eventName}</p>
              <p className="text-sm text-gray-600">
                {format(new Date(selectedEventDetails.date), 'yyyy-MM-dd')} | {selectedEventDetails.time}
              </p>
              <p className="text-sm mt-2">
                {selectedTicketDetails.name} - €{selectedTicketDetails.price}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Kiekis / Quantity</label>
              <div className="flex items-center border rounded-lg w-fit">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <span className="w-12 text-center">{quantity}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={quantity >= selectedTicketDetails.available}
                >
                  +
                </Button>
              </div>
            </div>

            <div className="p-4 bg-lutheran-gold/10 rounded-lg">
              <p className="text-lg font-bold">
                Iš viso: €{selectedTicketDetails.price * quantity}
              </p>
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Atgal / Back
              </Button>
              <Button
                className="flex-1 bg-lutheran-red text-white hover:bg-lutheran-red/90"
                onClick={handlePurchase}
              >
                Pirkti / Purchase
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EventTickets;
