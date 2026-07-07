'use client';

import * as React from 'react';
import { useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';

/**
 * Candle Offering Component
 * Online store item for candle donations
 */

export interface CandleOption {
  id: string;
  nameLt: string;
  nameEn: string;
  descriptionLt: string;
  descriptionEn: string;
  price: number;
  duration?: string;
  image?: string;
}

export interface CandleOfferingProps {
  options?: CandleOption[];
  onSelect?: (candle: CandleOption, quantity: number) => void;
  className?: string;
}

const defaultCandleOptions: CandleOption[] = [
  {
    id: 'votive-small',
    nameLt: 'Votyvinė žvakė (maža)',
    nameEn: 'Votive Candle (small)',
    descriptionLt: 'Degs apie 3 valandas',
    descriptionEn: 'Burns for approximately 3 hours',
    price: 1,
    duration: '3h',
  },
  {
    id: 'votive-medium',
    nameLt: 'Votyvinė žvakė (vidutinė)',
    nameEn: 'Votive Candle (medium)',
    descriptionLt: 'Degs apie 8 valandas',
    descriptionEn: 'Burns for approximately 8 hours',
    price: 3,
    duration: '8h',
  },
  {
    id: 'votive-large',
    nameLt: 'Votyvinė žvakė (didelė)',
    nameEn: 'Votive Candle (large)',
    descriptionLt: 'Degs apie 24 valandas',
    descriptionEn: 'Burns for approximately 24 hours',
    price: 5,
    duration: '24h',
  },
  {
    id: 'memorial',
    nameLt: 'Atminimo žvakė',
    nameEn: 'Memorial Candle',
    descriptionLt: 'Dedikuota mirusiojo atminimui',
    descriptionEn: 'Dedicated to the memory of a deceased loved one',
    price: 10,
    duration: '48h',
  },
];

export function CandleOffering({
  options = defaultCandleOptions,
  onSelect,
  className,
}: CandleOfferingProps) {
  const [selectedCandle, setSelectedCandle] = useState<CandleOption | null>(null);
  const [quantity, setQuantity] = useState(1);

  const handleSelect = (candle: CandleOption) => {
    setSelectedCandle(candle);
  };

  const handleAddToCart = () => {
    if (selectedCandle) {
      onSelect?.(selectedCandle, quantity);
    }
  };

  return (
    <Card className={cn('max-w-2xl', className)}>
      <CardHeader>
        <CardTitle className="text-xl font-heading">
          Žvakių užsakymas
        </CardTitle>
        <p className="text-sm text-gray-600">Candle Offering</p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {options.map((candle) => (
            <div
              key={candle.id}
              className={cn(
                'p-4 rounded-lg border-2 cursor-pointer transition-all',
                selectedCandle?.id === candle.id
                  ? 'border-liturgical-gold bg-liturgical-gold/10'
                  : 'border-gray-200 hover:border-gray-300'
              )}
              onClick={() => handleSelect(candle)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium">{candle.nameLt}</h3>
                <Badge variant="secondary">€{candle.price}</Badge>
              </div>
              <p className="text-sm text-gray-600">{candle.nameEn}</p>
              <p className="text-xs text-gray-500 mt-2">{candle.descriptionLt}</p>
              {candle.duration && (
                <p className="text-xs text-liturgical-purple mt-1">
                  Trukmė: {candle.duration}
                </p>
              )}
            </div>
          ))}
        </div>

        {selectedCandle && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium">{selectedCandle.nameLt}</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </Button>
                <span className="w-8 text-center">{quantity}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">Iš viso: €{selectedCandle.price * quantity}</span>
              <Button onClick={handleAddToCart}>
                Pridėti į krepšelį
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CandleOffering;