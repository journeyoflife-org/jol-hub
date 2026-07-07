'use client';

import * as React from 'react';
import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Badge, cn } from '@jol-hub/ui';
import { entityConfig } from '@/config/entity';

export interface RetreatRegistration {
  retreatType: string;
  participantName: string;
  email: string;
  phone: string;
  startDate: string;
  endDate: string;
  roomType: 'single' | 'shared';
  mealPreference: 'regular' | 'vegetarian' | 'other';
  specialNeeds?: string;
  spiritualDirection: boolean;
  totalAmount: number;
}

export interface RetreatRegistrationProps {
  onSubmit?: (registration: RetreatRegistration) => void;
  className?: string;
}

const RETREAT_TYPES = [
  { id: 'silent', nameLt: 'Tylioji rekolekcija', nameEn: 'Silent Retreat', duration: 3, price: 105 },
  { id: 'guided', nameLt: 'Vadovaujamos rekolekcijos', nameEn: 'Guided Retreat', duration: 5, price: 200 },
  { id: 'benedictine', nameLt: 'Benediktiniškos rekolekcijos', nameEn: 'Benedictine Retreat', duration: 7, price: 280 },
  { id: 'weekend', nameLt: 'Savaitgalio rekolekcija', nameEn: 'Weekend Retreat', duration: 2, price: 70 },
] as const;

export function RetreatRegistration({ onSubmit, className }: RetreatRegistrationProps) {
  const [step, setStep] = useState(1);
  const [retreatType, setRetreatType] = useState<string>('');
  const [participantName, setParticipantName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [startDate, setStartDate] = useState('');
  const [roomType, setRoomType] = useState<'single' | 'shared'>('single');
  const [mealPreference, setMealPreference] = useState<'regular' | 'vegetarian' | 'other'>('regular');
  const [specialNeeds, setSpecialNeeds] = useState('');
  const [spiritualDirection, setSpiritualDirection] = useState(false);

  const selectedRetreat = RETREAT_TYPES.find(r => r.id === retreatType);
  const endDate = startDate && selectedRetreat
    ? format(addDays(new Date(startDate), selectedRetreat.duration), 'yyyy-MM-dd')
    : '';

  const calculateTotal = () => {
    if (!selectedRetreat) return 0;
    let total = selectedRetreat.price;
    if (roomType === 'single') total += selectedRetreat.duration * 10; // Single room supplement
    if (spiritualDirection) total += 30; // Spiritual direction fee
    return total;
  };

  const handleSubmit = () => {
    if (!selectedRetreat || !startDate) return;

    const registration: RetreatRegistration = {
      retreatType,
      participantName,
      email,
      phone,
      startDate,
      endDate,
      roomType,
      mealPreference,
      specialNeeds: specialNeeds || undefined,
      spiritualDirection,
      totalAmount: calculateTotal(),
    };

    onSubmit?.(registration);

    // Reset form
    setStep(1);
    setRetreatType('');
    setParticipantName('');
    setEmail('');
    setPhone('');
    setStartDate('');
    setRoomType('single');
    setMealPreference('regular');
    setSpecialNeeds('');
    setSpiritualDirection(false);
  };

  const isStep1Valid = retreatType && participantName && email;
  const isStep2Valid = startDate && roomType && mealPreference;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-heading">Rekolekcijos / Retreats</CardTitle>
        <p className="text-sm text-gray-600">{entityConfig.name.lt}</p>
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

        {/* Step 1: Retreat Selection & Contact */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Pasirinkite rekolekcijas / Select Retreat</h3>

            <div className="grid md:grid-cols-2 gap-4">
              {RETREAT_TYPES.map((retreat) => (
                <div
                  key={retreat.id}
                  className={cn(
                    'p-4 rounded-lg border-2 cursor-pointer transition-all',
                    retreatType === retreat.id
                      ? 'border-primary bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                  )}
                  onClick={() => setRetreatType(retreat.id)}
                >
                  <h4 className="font-medium">{retreat.nameLt}</h4>
                  <p className="text-sm text-gray-600">{retreat.nameEn}</p>
                  <p className="text-xs text-gray-500 mt-1">Trukmė: {retreat.duration} d.</p>
                  <Badge className="mt-2 bg-liturgical-gold text-gray-900">€{retreat.price}</Badge>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium text-lg mb-3">Kontaktai / Contact</h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Vardas Pavardė / Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
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
                  <label className="block text-sm font-medium mb-2">Telefonas / Phone</label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+370 XXX XXXXX"
                    className="w-full"
                  />
                </div>
              </div>
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

        {/* Step 2: Accommodation Details */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Apgyvendinimas / Accommodation</h3>

            <div>
              <label className="block text-sm font-medium mb-2">
                Pageidaujama data / Preferred date <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={format(addDays(new Date(), 7), 'yyyy-MM-dd')}
                className="w-full"
              />
              {selectedRetreat && startDate && (
                <p className="text-sm text-gray-600 mt-1">
                  Išvykimas: {endDate}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Kambario tipas / Room type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={cn(
                    'p-4 rounded-lg border-2 cursor-pointer text-center',
                    roomType === 'single'
                      ? 'border-primary bg-primary-50'
                      : 'border-gray-200 hover:border-primary/50'
                  )}
                  onClick={() => setRoomType('single')}
                >
                  <p className="font-medium">Vienenvietis</p>
                  <p className="text-sm text-gray-600">Single room</p>
                  <p className="text-xs text-gray-500">+€10/naktis</p>
                </div>
                <div
                  className={cn(
                    'p-4 rounded-lg border-2 cursor-pointer text-center',
                    roomType === 'shared'
                      ? 'border-primary bg-primary-50'
                      : 'border-gray-200 hover:border-primary/50'
                  )}
                  onClick={() => setRoomType('shared')}
                >
                  <p className="font-medium">Dvivietis</p>
                  <p className="text-sm text-gray-600">Shared room</p>
                  <p className="text-xs text-gray-500">Įtraukta / Included</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Maitinimas / Meals <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'regular', name: 'Įprastas' },
                  { id: 'vegetarian', name: 'Vegetariškas' },
                  { id: 'other', name: 'Kitas' },
                ].map((meal) => (
                  <Button
                    key={meal.id}
                    variant={mealPreference === meal.id ? 'default' : 'outline'}
                    onClick={() => setMealPreference(meal.id as typeof mealPreference)}
                  >
                    {meal.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="spiritualDirection"
                checked={spiritualDirection}
                onChange={(e) => setSpiritualDirection(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="spiritualDirection" className="text-sm">
                Dvasinė konsultacija (+€30) / Spiritual direction
              </label>
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
                <strong>Rekolekcijos:</strong> {selectedRetreat?.nameLt}
              </p>
              <p className="text-sm">
                <strong>Dalyvis:</strong> {participantName}
              </p>
              <p className="text-sm">
                <strong>El. paštas:</strong> {email}
              </p>
              {phone && (
                <p className="text-sm">
                  <strong>Telefonas:</strong> {phone}
                </p>
              )}
              <p className="text-sm">
                <strong>Data:</strong> {startDate} - {endDate}
              </p>
              <p className="text-sm">
                <strong>Kambarys:</strong> {roomType === 'single' ? 'Vienenvietis' : 'Dvivietis'}
              </p>
              <p className="text-sm">
                <strong>Maitinimas:</strong> {mealPreference}
              </p>
              {spiritualDirection && (
                <Badge className="bg-liturgical-purple text-white">Dvasinė konsultacija</Badge>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Specialieji poreikiai / Special needs
              </label>
              <textarea
                value={specialNeeds}
                onChange={(e) => setSpecialNeeds(e.target.value)}
                placeholder="Nurodykite specialiuosius poreikius ar pageidavimus..."
                className="w-full p-2 border rounded-lg"
                rows={3}
              />
            </div>

            <div className="p-4 bg-liturgical-gold/10 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">Iš viso / Total:</span>
                <span className="text-2xl font-bold text-primary">€{calculateTotal()}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Atgal / Back
              </Button>
              <Button
                className="flex-1 bg-liturgical-gold text-gray-900 hover:bg-liturgical-gold/90"
                onClick={handleSubmit}
              >
                Registruotis / Register
              </Button>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 p-4 bg-liturgical-purple/10 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Apie rekolekcijas / About Retreats</h4>
          <p className="text-xs text-gray-600">
            Rekolekcijos vyksta vienuolyno tylioje aplinkoje.
            Dalyviai kviečiami dalyvauti bendruomenės maldoje.
            <br />
            <br />
            Retreats take place in the monastery&apos;s quiet environment.
            Participants are invited to join the community prayer.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default RetreatRegistration;
