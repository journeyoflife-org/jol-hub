'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, cn } from '@jol-hub/ui';
import { entityConfig } from '@/config/entity';

export interface CandleType {
  type: string;
  nameLt: string;
  nameEn: string;
  price: number;
}

export interface CandleOrder {
  candleType: CandleType;
  quantity: number;
  intention?: string;
  donorName?: string;
  total: number;
}

export interface CandleServicesProps {
  onSubmit?: (order: CandleOrder) => void;
  className?: string;
}

export function CandleServices({ onSubmit, className }: CandleServicesProps) {
  const [selectedCandle, setSelectedCandle] = useState<CandleType | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [intention, setIntention] = useState('');
  const [donorName, setDonorName] = useState('');

  const candleTypes = entityConfig.candleServices.types;

  const handleOrder = () => {
    if (!selectedCandle) return;

    const order: CandleOrder = {
      candleType: selectedCandle,
      quantity,
      intention: intention || undefined,
      donorName: donorName || undefined,
      total: selectedCandle.price * quantity,
    };

    onSubmit?.(order);

    // Reset form
    setSelectedCandle(null);
    setQuantity(1);
    setIntention('');
    setDonorName('');
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-heading">Žvakės / Candles</CardTitle>
        <p className="text-sm text-gray-600">Light a candle for your intentions</p>
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-6">
          {/* Candle Selection */}
          <div>
            <h3 className="font-medium text-lg mb-3 text-primary">Pasirinkite žvakę / Select Candle</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {candleTypes.map((candle) => (
                <div
                  key={candle.type}
                  className={cn(
                    'p-4 rounded-lg border-2 cursor-pointer transition-all text-center',
                    selectedCandle?.type === candle.type
                      ? 'border-primary bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                  )}
                  onClick={() => setSelectedCandle(candle)}
                >
                  <div className="text-3xl mb-2">🕯️</div>
                  <h4 className="font-medium">{candle.nameLt}</h4>
                  <p className="text-sm text-gray-600">{candle.nameEn}</p>
                  <Badge className="mt-2 bg-liturgical-gold text-gray-900">€{candle.price}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Quantity */}
          {selectedCandle && (
            <div>
              <h3 className="font-medium text-lg mb-3 text-primary">Kiekis / Quantity</h3>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <span className="text-2xl font-bold">{quantity}</span>
                <Button
                  variant="outline"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </Button>
              </div>
            </div>
          )}

          {/* Intention (Optional) */}
          {selectedCandle && (
            <div>
              <h3 className="font-medium text-lg mb-3 text-primary">Intencija (nebūtina) / Intention (optional)</h3>
              <textarea
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                placeholder="Už ką deginate žvakę? / For whom are you lighting this candle?"
                className="w-full p-3 border rounded-lg"
                rows={3}
              />
            </div>
          )}

          {/* Donor Name */}
          {selectedCandle && (
            <div>
              <label className="block font-medium mb-2 text-primary">Jūsų vardas (nebūtina) / Your name (optional)</label>
              <input
                type="text"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="Vardas / Name"
                className="w-full p-2 border rounded-lg"
              />
            </div>
          )}

          {/* Summary & Submit */}
          {selectedCandle && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-medium">Iš viso / Total:</span>
                <span className="text-2xl font-bold text-primary">
                  €{selectedCandle.price * quantity}
                </span>
              </div>
              <Button
                className="w-full bg-liturgical-gold text-gray-900 hover:bg-liturgical-gold/90"
                onClick={handleOrder}
              >
                Užsakyti / Order
              </Button>
            </div>
          )}

          {/* Info */}
          <div className="mt-4 p-4 bg-liturgical-purple/10 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Apie žvakes / About Candles</h4>
            <p className="text-xs text-gray-600">
              Žvakės yra tradicinis maldos simbolis. Jas uždegus meldžiamasi už konkrečius
              žmones ar intencijas. Žvakių auka skirta koplyčios išlaikymui.
              <br />
              <br />
              Candles are a traditional symbol of prayer. When lit, they represent prayers
              for specific people or intentions. Candle donations support the chapel.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default CandleServices;
