'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';
import { entityConfig, type Casket } from '@/config/entity';

export interface CasketsProps {
  caskets?: Casket[];
  onSelect?: (casket: Casket, quantity: number) => void;
  className?: string;
}

export function Caskets({
  caskets = entityConfig.caskets,
  onSelect,
  className,
}: CasketsProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const updateQuantity = (id: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) + delta),
    }));
  };

  const handleSelect = (casket: Casket) => {
    onSelect?.(casket, quantities[casket.id] || 1);
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-heading">Karstai</CardTitle>
        <p className="text-sm text-gray-600">Caskets</p>
      </CardHeader>

      <CardContent className="p-4">
        <div className="grid md:grid-cols-2 gap-4">
          {caskets.map((casket) => (
            <div
              key={casket.id}
              className={cn(
                'border rounded-lg overflow-hidden',
                casket.inStock
                  ? 'border-gray-200 dark:border-gray-700'
                  : 'border-gray-200 dark:border-gray-700 opacity-60'
              )}
            >
              {/* Image Placeholder */}
              <div className="aspect-video bg-gradient-to-b from-memorial-navy/10 to-memorial-gold/10 flex items-center justify-center">
                <span className="text-5xl">⚰️</span>
              </div>

              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-heading text-lg text-primary">{casket.name}</h3>
                  <Badge className="bg-memorial-gold text-white">
                    €{casket.price.toLocaleString()}
                  </Badge>
                </div>

                <div className="space-y-1 text-sm text-gray-600 mb-3">
                  <p><strong>Medžiaga:</strong> {casket.material}</p>
                  <p><strong>Apdaila:</strong> {casket.finish}</p>
                  <p><strong>Interjeras:</strong> {casket.interior}</p>
                </div>

                {casket.inStock ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border rounded-lg">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateQuantity(casket.id, -1)}
                        disabled={(quantities[casket.id] || 1) <= 1}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center text-sm">
                        {quantities[casket.id] || 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateQuantity(casket.id, 1)}
                      >
                        +
                      </Button>
                    </div>
                    <Button size="sm" onClick={() => handleSelect(casket)}>
                      Pasirinkti
                    </Button>
                  </div>
                ) : (
                  <Badge variant="secondary" className="w-full justify-center">
                    Laukiama / Expected Soon
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Apie karstus / About Caskets</h4>
          <p className="text-xs text-gray-600">
            Visi mūsų karstai yra pagaminti iš kokybiškų medžiagų ir atitinka Lietuvos
            Respublikos laidotuvių paslaugų standartus. Galime užsakyti individualų
            karstą pagal specialius pageidavimus.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default Caskets;
