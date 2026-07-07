'use client';

import * as React from 'react';
import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, cn } from '@jol-hub/ui';
import { entityConfig } from '@/config/entity';

export interface GuestHouseBooking {
  guestName: string;
  email: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  roomCount: number;
  guestCount: number;
  purpose: 'retreat' | 'pilgrimage' | 'personal' | 'other';
  mealPreference: 'regular' | 'vegetarian' | 'none';
  specialRequests?: string;
  totalNights: number;
  totalAmount: number;
}

export interface GuestHouseProps {
  onSubmit?: (booking: GuestHouseBooking) => void;
  className?: string;
}

const PURPOSES = [
  { id: 'retreat', nameLt: 'Rekolekcijos', nameEn: 'Retreat' },
  { id: 'pilgrimage', nameLt: 'Piligrimystė', nameEn: 'Pilgrimage' },
  { id: 'personal', nameLt: 'Asmeninės priežastys', nameEn: 'Personal reasons' },
  { id: 'other', nameLt: 'Kita', nameEn: 'Other' },
] as const;

export function GuestHouse({ onSubmit, className }: GuestHouseProps) {
  const [step, setStep] = useState(1);
  const [guestName, setGuestName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [roomCount, setRoomCount] = useState(1);
  const [guestCount, setGuestCount] = useState(1);
  const [purpose, setPurpose] = useState<'retreat' | 'pilgrimage' | 'personal' | 'other'>('retreat');
  const [mealPreference, setMealPreference] = useState<'regular' | 'vegetarian' | 'none'>('regular');
  const [specialRequests, setSpecialRequests] = useState('');

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const calculateTotal = () => {
    const nights = calculateNights();
    return nights * roomCount * (entityConfig.guestHouse.rates?.perNight || 35);
  };

  const handleSubmit = () => {
    if (!checkIn || !checkOut) return;

    const booking: GuestHouseBooking = {
      guestName,
      email,
      phone,
      checkIn,
      checkOut,
      roomCount,
      guestCount,
      purpose,
      mealPreference,
      specialRequests: specialRequests || undefined,
      totalNights: calculateNights(),
      totalAmount: calculateTotal(),
    };

    onSubmit?.(booking);

    // Reset form
    setStep(1);
    setGuestName('');
    setEmail('');
    setPhone('');
    setCheckIn('');
    setCheckOut('');
    setRoomCount(1);
    setGuestCount(1);
    setPurpose('retreat');
    setMealPreference('regular');
    setSpecialRequests('');
  };

  const isStep1Valid = guestName && email && phone;
  const isStep2Valid = checkIn && checkOut && roomCount > 0 && guestCount > 0;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-heading">Svečių namai / Guest House</CardTitle>
        <p className="text-sm text-gray-600">{entityConfig.guestHouse.rooms} kambariai</p>
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

        {/* Step 1: Contact Information */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Kontaktai / Contact Information</h3>

            <div>
              <label className="block text-sm font-medium mb-2">
                Svečio vardas / Guest name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Vardenis Pavardenis"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                El. paštas / Email <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Telefono numeris / Phone number <span className="text-red-500">*</span>
              </label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+370 XXX XXXXX"
                className="w-full"
              />
            </div>

            <Button
              className="w-full mt-4"
              disabled={!isStep1Valid}
              onClick={() => setStep(2)}
            >
              Tęsti / Continue
            </Button>
          </div>
        )}

        {/* Step 2: Booking Details */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Rezervacijos informacija / Booking Details</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Atvykimas / Check-in <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={checkIn}
                  onChange={(e) => {
                    setCheckIn(e.target.value);
                    if (checkOut && e.target.value >= checkOut) {
                      setCheckOut(format(addDays(new Date(e.target.value), 1), 'yyyy-MM-dd'));
                    }
                  }}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Išvykimas / Check-out <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={checkIn || format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                  className="w-full"
                />
              </div>
            </div>

            {checkIn && checkOut && (
              <p className="text-sm text-gray-600">
                Nakvynių skaičius: {calculateNights()}
              </p>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Kambarių skaičius / Number of rooms
                </label>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setRoomCount(Math.max(1, roomCount - 1))}
                    disabled={roomCount <= 1}
                  >
                    -
                  </Button>
                  <span className="text-xl font-bold">{roomCount}</span>
                  <Button
                    variant="outline"
                    onClick={() => setRoomCount(Math.min(entityConfig.guestHouse.rooms, roomCount + 1))}
                    disabled={roomCount >= entityConfig.guestHouse.rooms}
                  >
                    +
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Svečių skaičius / Number of guests
                </label>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                    disabled={guestCount <= 1}
                  >
                    -
                  </Button>
                  <span className="text-xl font-bold">{guestCount}</span>
                  <Button
                    variant="outline"
                    onClick={() => setGuestCount(guestCount + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Apsilankymo tikslas / Purpose of visit
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PURPOSES.map((p) => (
                  <Button
                    key={p.id}
                    variant={purpose === p.id ? 'default' : 'outline'}
                    onClick={() => setPurpose(p.id as typeof purpose)}
                  >
                    {p.nameLt}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Maitinimas / Meals
              </label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={mealPreference === 'regular' ? 'default' : 'outline'}
                  onClick={() => setMealPreference('regular')}
                >
                  Įprastas
                </Button>
                <Button
                  variant={mealPreference === 'vegetarian' ? 'default' : 'outline'}
                  onClick={() => setMealPreference('vegetarian')}
                >
                  Vegetariškas
                </Button>
                <Button
                  variant={mealPreference === 'none' ? 'default' : 'outline'}
                  onClick={() => setMealPreference('none')}
                >
                  Be maitinimo
                </Button>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Atgal / Back
              </Button>
              <Button
                className="flex-1"
                disabled={!isStep2Valid}
                onClick={() => setStep(3)}
              >
                Tęsti / Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Patvirtinimas / Confirmation</h3>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
              <p className="text-sm">
                <strong>Svečias:</strong> {guestName}
              </p>
              <p className="text-sm">
                <strong>El. paštas:</strong> {email}
              </p>
              <p className="text-sm">
                <strong>Telefonas:</strong> {phone}
              </p>
              <p className="text-sm">
                <strong>Atvykimas:</strong> {checkIn}
              </p>
              <p className="text-sm">
                <strong>Išvykimas:</strong> {checkOut}
              </p>
              <p className="text-sm">
                <strong>Nakvynių:</strong> {calculateNights()}
              </p>
              <p className="text-sm">
                <strong>Kambariai:</strong> {roomCount}
              </p>
              <p className="text-sm">
                <strong>Svečiai:</strong> {guestCount}
              </p>
              <p className="text-sm">
                <strong>Tikslas:</strong> {PURPOSES.find(p => p.id === purpose)?.nameLt}
              </p>
              <p className="text-sm">
                <strong>Maitinimas:</strong> {mealPreference === 'regular' ? 'Įprastas' : mealPreference === 'vegetarian' ? 'Vegetariškas' : 'Be maitinimo'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Specialūs pageidavimai / Special requests
              </label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Įrašykite specialius pageidavimus..."
                className="w-full p-2 border rounded-lg"
                rows={3}
              />
            </div>

            <div className="p-4 bg-liturgical-gold/10 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">Iš viso / Total:</span>
                <span className="text-2xl font-bold text-primary">€{calculateTotal()}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                €{entityConfig.guestHouse.rates?.perNight || 35}/naktis × {calculateNights()} naktys × {roomCount} kambariai
              </p>
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Atgal / Back
              </Button>
              <Button
                className="flex-1 bg-liturgical-gold text-gray-900 hover:bg-liturgical-gold/90"
                onClick={handleSubmit}
              >
                Rezervuoti / Book
              </Button>
            </div>
          </div>
        )}

        {/* Amenities */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Patogumai / Amenities</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            {entityConfig.guestHouse.amenities.map((amenity, i) => (
              <li key={i}>• {amenity}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default GuestHouse;
