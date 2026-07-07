'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';
import { entityConfig } from '@/config/entity';

export interface CandleOrder {
  candleType: string;
  quantity: number;
  intention?: string;
  forHealth?: boolean;
  forRepose?: boolean;
}

export interface CandleOrdersProps {
  onSubmit?: (order: CandleOrder) => void;
  className?: string;
}

export function CandleOrders({ onSubmit, className }: CandleOrdersProps) {
  const [step, setStep] = useState(1);
  const [selectedCandle, setSelectedCandle] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [intention, setIntention] = useState('');
  const [candlePurpose, setCandlePurpose] = useState<'health' | 'repose' | 'general'>('general');

  const candleTypes = entityConfig.candleTypes;

  const selectedCandleDetails = candleTypes.find((c) => c.id === selectedCandle);

  const handleSubmit = () => {
    if (selectedCandle) {
      onSubmit?.({
        candleType: selectedCandle,
        quantity,
        intention: intention || undefined,
        forHealth: candlePurpose === 'health',
        forRepose: candlePurpose === 'repose',
      });
      // Reset
      setStep(1);
      setSelectedCandle(null);
      setQuantity(1);
      setIntention('');
      setCandlePurpose('general');
    }
  };

  const totalCost = selectedCandleDetails ? selectedCandleDetails.price * quantity : 0;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-orthodox">Užsakyti žvakes</CardTitle>
        <p className="text-sm text-gray-600">Order Candles</p>
      </CardHeader>

      <CardContent className="p-4">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Pasirinkite žvakę / Select Candle Type</h3>

            <div className="grid md:grid-cols-2 gap-3">
              {candleTypes.map((candle) => (
                <div
                  key={candle.id}
                  className={cn(
                    'p-4 border rounded-lg cursor-pointer transition-all',
                    selectedCandle === candle.id
                      ? 'border-orthodox-gold bg-orthodox-gold/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-orthodox-gold/50'
                  )}
                  onClick={() => setSelectedCandle(candle.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{candle.nameLt}</h4>
                      <p className="text-sm text-gray-600">{candle.nameEn}</p>
                    </div>
                    <Badge className="bg-orthodox-gold text-gray-900">
                      €{candle.price}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">Degimo laikas: {candle.burnTime}</p>
                </div>
              ))}
            </div>

            <Button
              className="w-full mt-4"
              disabled={!selectedCandle}
              onClick={() => setStep(2)}
            >
              Tęsti / Continue
            </Button>
          </div>
        )}

        {step === 2 && selectedCandleDetails && (
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="font-medium">{selectedCandleDetails.nameLt}</p>
              <p className="text-sm text-gray-600">
                €{selectedCandleDetails.price} | {selectedCandleDetails.burnTime}
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
                >
                  +
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Žvakės paskirtis / Candle Purpose</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={candlePurpose === 'general' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCandlePurpose('general')}
                >
                  Bendroji
                </Button>
                <Button
                  variant={candlePurpose === 'health' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCandlePurpose('health')}
                >
                  Už sveikatą
                </Button>
                <Button
                  variant={candlePurpose === 'repose' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCandlePurpose('repose')}
                >
                  Už ramybę
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Intencija (neprivaloma) / Intention (optional)
              </label>
              <textarea
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                placeholder="Už ką degs žvakė..."
                className="w-full p-2 border rounded-lg"
                rows={3}
              />
            </div>

            <div className="p-4 bg-orthodox-gold/10 rounded-lg">
              <p className="text-lg font-bold">Iš viso: €{totalCost}</p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Atgal
              </Button>
              <Button className="flex-1 bg-orthodox-red text-white" onClick={handleSubmit}>
                Užsakyti / Order
              </Button>
            </div>
          </div>
        )}

        {/* Candle Information */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-medium mb-2">Apie žvakes / About Candles</h4>
          <p className="text-sm text-gray-600">
            Stačiatikių tradicijoje žvakės simbolizuoja maldą, kuri kyla į Dievą.
            Uždegus žvakę bažnyčioje, tikintysis melsdamasi perduoda savo intenciją Dievui.
            <br /><br />
            In Orthodox tradition, candles symbolize prayer rising to God.
            When lighting a candle in church, the faithful person lifts their intention to God in prayer.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default CandleOrders;
