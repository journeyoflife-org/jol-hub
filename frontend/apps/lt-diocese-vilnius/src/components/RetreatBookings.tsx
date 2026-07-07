'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';

export interface RetreatEvent {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  type: 'spiritual' | 'silent' | 'youth' | 'family' | 'clergy';
  capacity: number;
  available: number;
  price: number;
  currency: string;
  director: string;
  imageUrl?: string;
}

export interface RetreatBookingsProps {
  retreats?: RetreatEvent[];
  onBook?: (retreatId: string, participants: number) => void;
  className?: string;
}

const typeLabels: Record<string, { lt: string; en: string }> = {
  spiritual: { lt: 'Dvasinės rekolekcijos', en: 'Spiritual Retreat' },
  silent: { lt: 'Tylos rekolekcijos', en: 'Silent Retreat' },
  youth: { lt: 'Jaunimo rekolekcijos', en: 'Youth Retreat' },
  family: { lt: 'Šeimų rekolekcijos', en: 'Family Retreat' },
  clergy: { lt: 'Kunigų rekolekcijos', en: 'Clergy Retreat' },
};

const defaultRetreats: RetreatEvent[] = [
  { id: 'r-1', title: 'Velykinės rekolekcijos', titleEn: 'Easter Retreat', description: 'Pasirengimas Velykoms per maldą ir kontempliaciją.', startDate: '2026-04-10', endDate: '2026-04-12', location: 'Birutės vienuolynas, Palanga', type: 'spiritual', capacity: 40, available: 12, price: 85, currency: 'EUR', director: 'Kun. A. Klimas' },
  { id: 'r-2', title: 'Tylos savaitgalis', titleEn: 'Silent Weekend', description: 'Rekolekcijos tyloje su dvasiniais pratimais.', startDate: '2026-05-01', endDate: '2026-05-03', location: 'Kernavės rekolekcijų namai', type: 'silent', capacity: 25, available: 8, price: 65, currency: 'EUR', director: 'Kun. J. Petrauskas' },
  { id: 'r-3', title: 'Jaunimo vasaros stovykla', titleEn: 'Youth Summer Camp', description: 'Vasarinės rekolekcijos jaunimui.', startDate: '2026-07-15', endDate: '2026-07-22', location: 'Šiluva', type: 'youth', capacity: 60, available: 45, price: 120, currency: 'EUR', director: 'Jaunimo centras' },
  { id: 'r-4', title: 'Šeimų savaitgalis', titleEn: 'Family Weekend', description: 'Rekolekcijos šeimoms su vaikais.', startDate: '2026-06-20', endDate: '2026-06-22', location: 'Trakai', type: 'family', capacity: 30, available: 20, price: 150, currency: 'EUR', director: 'Šeimų tarnyba' },
  { id: 'r-5', title: 'Kunigų rekolekcijos', titleEn: 'Clergy Retreat', description: 'Metinės kunigų rekolekcijos.', startDate: '2026-09-01', endDate: '2026-09-05', location: 'Vilniaus kunigų seminarija', type: 'clergy', capacity: 50, available: 30, price: 0, currency: 'EUR', director: 'Vysk. G. Grušas' },
];

export function RetreatBookings({ retreats = defaultRetreats, onBook, className }: RetreatBookingsProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedRetreat, setSelectedRetreat] = useState<RetreatEvent | null>(null);
  const [participants, setParticipants] = useState(1);

  const filteredRetreats = selectedType
    ? retreats.filter((r) => r.type === selectedType)
    : retreats;

  const types = [...new Set(retreats.map((r) => r.type))];

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-heading">Rekolekcijos</CardTitle>
        <p className="text-sm text-gray-600">Retreat Bookings</p>

        <div className="flex flex-wrap gap-2 mt-4">
          <Button variant={selectedType === null ? 'default' : 'outline'} size="sm" onClick={() => setSelectedType(null)}>
            Visos
          </Button>
          {types.map((type) => (
            <Button key={type} variant={selectedType === type ? 'default' : 'outline'} size="sm" onClick={() => setSelectedType(type)}>
              {typeLabels[type]?.lt}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {!selectedRetreat ? (
          <div className="space-y-4">
            {filteredRetreats.map((retreat) => (
              <div
                key={retreat.id}
                className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                onClick={() => { setSelectedRetreat(retreat); setParticipants(1); }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">{retreat.title}</h3>
                    {retreat.titleEn && <p className="text-sm text-gray-600">{retreat.titleEn}</p>}
                  </div>
                  <div className="text-right">
                    <Badge>{typeLabels[retreat.type]?.lt}</Badge>
                    {retreat.price > 0 && <p className="text-lg font-semibold mt-1">{retreat.price} {retreat.currency}</p>}
                    {retreat.price === 0 && <p className="text-sm text-green-600 mt-1">Nemokamai</p>}
                  </div>
                </div>
                
                <div className="flex gap-4 text-sm text-gray-600 mb-2">
                  <span>📅 {retreat.startDate} - {retreat.endDate}</span>
                  <span>📍 {retreat.location}</span>
                </div>
                
                <p className="text-sm text-gray-600">{retreat.description}</p>
                
                <div className="flex justify-between items-center mt-3">
                  <span className="text-sm text-gray-500">Vadovas: {retreat.director}</span>
                  <span className={`text-sm ${retreat.available < 10 ? 'text-amber-600' : 'text-green-600'}`}>
                    Laisvų vietų: {retreat.available}/{retreat.capacity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <Button variant="ghost" onClick={() => setSelectedRetreat(null)} className="mb-4">
              ← Atgal į sąrašą
            </Button>

            <div className="p-4 border rounded-lg mb-6">
              <h3 className="text-xl font-medium mb-2">{selectedRetreat.title}</h3>
              {selectedRetreat.titleEn && <p className="text-gray-600 mb-2">{selectedRetreat.titleEn}</p>}
              
              <div className="flex gap-4 text-sm text-gray-600 mb-3">
                <span>📅 {selectedRetreat.startDate} - {selectedRetreat.endDate}</span>
                <span>📍 {selectedRetreat.location}</span>
              </div>
              
              <p className="text-gray-600 mb-3">{selectedRetreat.description}</p>
              <p className="text-sm text-gray-500">Vadovas: {selectedRetreat.director}</p>
              
              <div className="mt-4">
                <Badge variant="secondary">Laisvų vietų: {selectedRetreat.available}</Badge>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Dalyvių skaičius:</h4>
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => setParticipants(Math.max(1, participants - 1))}>-</Button>
                <span className="w-12 text-center text-xl">{participants}</span>
                <Button variant="outline" onClick={() => setParticipants(Math.min(selectedRetreat.available, participants + 1))}>+</Button>
              </div>

              {selectedRetreat.price > 0 && (
                <p className="text-lg">Viso: <span className="font-semibold">{selectedRetreat.price * participants} {selectedRetreat.currency}</span></p>
              )}

              <Button
                className="w-full"
                onClick={() => onBook?.(selectedRetreat.id, participants)}
                disabled={participants > selectedRetreat.available}
              >
                Registruotis
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RetreatBookings;
