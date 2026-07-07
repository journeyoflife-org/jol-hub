'use client';

import * as React from 'react';
import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';

export interface MassIntention {
  id?: string;
  intentionFor: string;
  requestedBy: string;
  date: string;
  massTime: string;
  donation: number;
  notes?: string;
}

export interface MassIntentionsProps {
  onSubmit?: (intention: MassIntention) => void;
  className?: string;
}

const SUGGESTED_DONATIONS = [5, 10, 15, 20];

export function MassIntentions({ onSubmit, className }: MassIntentionsProps) {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [intentionFor, setIntentionFor] = useState<string>('');
  const [requestedBy, setRequestedBy] = useState<string>('');
  const [donation, setDonation] = useState<number>(10);
  const [notes, setNotes] = useState<string>('');

  // Get available dates (next 30 days, excluding some restrictions)
  const today = new Date();
  // TODO: Use availableDates for date picker restrictions
  // const availableDates = Array.from({ length: 30 }, (_, i) => addDays(today, i + 3));

  const getAvailableTimes = (date: string) => {
    const d = new Date(date);
    const dayOfWeek = d.getDay();

    // Sunday times
    if (dayOfWeek === 0) {
      return ['09:00', '11:00', '18:00'];
    }
    // Saturday times
    if (dayOfWeek === 6) {
      return ['09:00', '18:00'];
    }
    // Weekday times
    return ['07:30', '18:30'];
  };

  const handleSubmit = () => {
    const intention: MassIntention = {
      intentionFor,
      requestedBy,
      date: selectedDate,
      massTime: selectedTime,
      donation,
      notes,
    };
    onSubmit?.(intention);
    // Reset form
    setStep(1);
    setSelectedDate('');
    setSelectedTime('');
    setIntentionFor('');
    setRequestedBy('');
    setDonation(10);
    setNotes('');
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-heading">Šv. Mišių intencijos</CardTitle>
        <p className="text-sm text-gray-600">Mass Intentions</p>
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

        {/* Step 1: Select Date and Time */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Pasirinkite datą ir laiką / Select Date and Time</h3>

            <div>
              <label className="block text-sm font-medium mb-2">Data / Date</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedTime('');
                }}
                min={format(addDays(today, 3), 'yyyy-MM-dd')}
                className="w-full"
              />
            </div>

            {selectedDate && (
              <div>
                <label className="block text-sm font-medium mb-2">Mišių laikas / Mass Time</label>
                <div className="grid grid-cols-3 gap-2">
                  {getAvailableTimes(selectedDate).map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? 'default' : 'outline'}
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <Button
              className="w-full mt-4"
              disabled={!selectedDate || !selectedTime}
              onClick={() => setStep(2)}
            >
              Tęsti / Continue
            </Button>
          </div>
        )}

        {/* Step 2: Intention Details */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Intencijos informacija / Intention Details</h3>

            <div>
              <label className="block text-sm font-medium mb-2">
                Intencija už / Intention for <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={intentionFor}
                onChange={(e) => setIntentionFor(e.target.value)}
                placeholder="Vardas / Name"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Pvz.: "Už Joną Petraitį" / E.g., "For John Petraitis"
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Užsakė / Requested by <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={requestedBy}
                onChange={(e) => setRequestedBy(e.target.value)}
                placeholder="Jūsų vardas / Your name"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Pastabos / Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Papildoma informacija / Additional information"
                className="w-full p-2 border rounded-lg"
                rows={3}
              />
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Atgal / Back
              </Button>
              <Button
                className="flex-1"
                disabled={!intentionFor || !requestedBy}
                onClick={() => setStep(3)}
              >
                Tęsti / Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Donation and Submit */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Auka / Donation</h3>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm">
                <strong>Data:</strong> {format(new Date(selectedDate), 'yyyy-MM-dd')}
              </p>
              <p className="text-sm">
                <strong>Laikas:</strong> {selectedTime}
              </p>
              <p className="text-sm">
                <strong>Intencija:</strong> {intentionFor}
              </p>
              <p className="text-sm">
                <strong>Užsakė:</strong> {requestedBy}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Pasirinkite auką / Select donation</label>
              <div className="grid grid-cols-4 gap-2">
                {SUGGESTED_DONATIONS.map((amount) => (
                  <Button
                    key={amount}
                    variant={donation === amount ? 'default' : 'outline'}
                    onClick={() => setDonation(amount)}
                  >
                    €{amount}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Auka nėra privaloma, bet padeda išlaikyti bažnyčią.
                <br />
                Donation is optional but helps support the church.
              </p>
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Atgal / Back
              </Button>
              <Button className="flex-1 bg-liturgical-gold text-gray-900 hover:bg-liturgical-gold/90" onClick={handleSubmit}>
                Pateikti / Submit (€{donation})
              </Button>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 p-4 bg-liturgical-purple/10 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Informacija / Information</h4>
          <p className="text-xs text-gray-600">
            Šv. Mišių intencijos tvirtinamos po užsakymo pateikimo.
            Gausite patvirtinimą el. paštu.
            <br />
            <br />
            Mass intentions are confirmed after submission.
            You will receive confirmation by email.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default MassIntentions;
