'use client';

import * as React from 'react';
import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';
import { entityConfig, type HallInfo } from '@/config/entity';

export interface HallRentalRequest {
  hallId: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  notes?: string;
  estimatedCost: number;
}

export interface HallRentalProps {
  halls?: HallInfo[];
  onSubmit?: (request: HallRentalRequest) => void;
  className?: string;
}

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00',
];

export function HallRental({
  halls = entityConfig.halls,
  onSubmit,
  className,
}: HallRentalProps) {
  const [step, setStep] = useState(1);
  const [selectedHall, setSelectedHall] = useState<HallInfo | null>(null);
  const [date, setDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');
  const [contactName, setContactName] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const today = new Date();
  const minDate = format(addDays(today, 7), 'yyyy-MM-dd');

  const calculateCost = () => {
    if (!selectedHall || !startTime || !endTime) return 0;
    const start = parseInt(startTime.split(':')[0] ?? '0', 10);
    const end = parseInt(endTime.split(':')[0] ?? '0', 10);
    const hours = end - start;
    return Math.max(0, hours * selectedHall.hourlyRate);
  };

  const handleSubmit = () => {
    if (!selectedHall) return;

    const request: HallRentalRequest = {
      hallId: selectedHall.id,
      date,
      startTime,
      endTime,
      purpose,
      contactName,
      contactEmail,
      contactPhone,
      notes,
      estimatedCost: calculateCost(),
    };

    onSubmit?.(request);
    // Reset
    setStep(1);
    setSelectedHall(null);
    setDate('');
    setStartTime('');
    setEndTime('');
    setPurpose('');
    setContactName('');
    setContactEmail('');
    setContactPhone('');
    setNotes('');
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-heading">Salės nuoma</CardTitle>
        <p className="text-sm text-gray-600">Hall Rental</p>
      </CardHeader>

      <CardContent className="p-4">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
                step >= s
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-600'
              )}
            >
              {s}
            </div>
          ))}
        </div>

        {/* Step 1: Select Hall */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Pasirinkite salę / Select Hall</h3>

            <div className="grid gap-4">
              {halls.map((hall) => (
                <div
                  key={hall.id}
                  className={cn(
                    'p-4 border rounded-lg cursor-pointer transition-all',
                    selectedHall?.id === hall.id
                      ? 'border-primary bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary/50',
                    !hall.available && 'opacity-50 cursor-not-allowed'
                  )}
                  onClick={() => hall.available && setSelectedHall(hall)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-primary">{hall.name}</h4>
                      <p className="text-sm text-gray-600">{hall.nameEn}</p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-liturgical-gold text-gray-900">
                        €{hall.hourlyRate}/val.
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        Talpa: {hall.capacity} žmonių
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {hall.amenities.map((amenity, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                  </div>

                  {!hall.available && (
                    <p className="text-sm text-red-600 mt-2">
                      Šiuo metu neprieinama / Currently unavailable
                    </p>
                  )}
                </div>
              ))}
            </div>

            <Button
              className="w-full mt-4"
              disabled={!selectedHall}
              onClick={() => setStep(2)}
            >
              Tęsti / Continue
            </Button>
          </div>
        )}

        {/* Step 2: Date and Time */}
        {step === 2 && selectedHall && (
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="font-medium">{selectedHall.name}</p>
              <p className="text-sm text-gray-600">€{selectedHall.hourlyRate}/val., talpa: {selectedHall.capacity}</p>
            </div>

            <h3 className="font-medium text-lg">Data ir laikas / Date and Time</h3>

            <div>
              <label className="block text-sm font-medium mb-2">Data / Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={minDate}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nuo / From</label>
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">Pasirinkite</option>
                  {TIME_SLOTS.slice(0, -1).map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Iki / Until</label>
                <select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">Pasirinkite</option>
                  {TIME_SLOTS.filter((t) => !startTime || parseInt(t.split(':')[0] ?? '0', 10) > parseInt(startTime.split(':')[0] ?? '0', 10)).map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            {startTime && endTime && (
              <div className="p-3 bg-liturgical-gold/10 rounded-lg">
                <p className="text-sm">
                  <strong>Numatoma kaina:</strong> €{calculateCost()}
                </p>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Atgal / Back
              </Button>
              <Button
                className="flex-1"
                disabled={!date || !startTime || !endTime}
                onClick={() => setStep(3)}
              >
                Tęsti / Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Contact Info and Submit */}
        {step === 3 && selectedHall && (
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Kontaktai / Contact Information</h3>

            <div>
              <label className="block text-sm font-medium mb-2">
                Renginio tikslas / Purpose <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="pvz., gimtadienis, konferencija"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Vardas / Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                El. paštas / Email <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Telefonas / Phone <span className="text-red-500">*</span>
              </label>
              <Input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Pastabos / Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 border rounded-lg"
                rows={3}
              />
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium mb-2">Rezervacijos suvestinė / Summary</h4>
              <div className="text-sm space-y-1">
                <p><strong>Salė:</strong> {selectedHall.name}</p>
                <p><strong>Data:</strong> {date}</p>
                <p><strong>Laikas:</strong> {startTime} - {endTime}</p>
                <p><strong>Numatoma kaina:</strong> €{calculateCost()}</p>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Atgal / Back
              </Button>
              <Button
                className="flex-1"
                disabled={!purpose || !contactName || !contactEmail || !contactPhone}
                onClick={handleSubmit}
              >
                Pateikti užklausą / Submit Request
              </Button>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 p-4 bg-liturgical-purple/10 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Informacija / Information</h4>
          <p className="text-xs text-gray-600">
            Salės nuoma turi būti suderinta su parapijos administracija.
            Gausite patvirtinimą per 2-3 darbo dienas.
            <br />
            <br />
            Hall rental must be approved by parish administration.
            You will receive confirmation within 2-3 business days.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default HallRental;
