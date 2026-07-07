'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';

export interface IconProduct {
  id: string;
  nameLt: string;
  nameEn: string;
  size: string;
  material: string;
  price: number;
  inStock: boolean;
  handmade: boolean;
  blessed: boolean;
}

export interface IconsStoreProps {
  icons?: IconProduct[];
  onAddToCart?: (icon: IconProduct, quantity: number) => void;
  className?: string;
}

const defaultIcons: IconProduct[] = [
  {
    id: 'icon-p1',
    nameLt: 'Dievo Motinos ikona',
    nameEn: 'Icon of the Mother of God',
    size: '15x20 cm',
    material: 'Medis, tempera',
    price: 45,
    inStock: true,
    handmade: true,
    blessed: true,
  },
  {
    id: 'icon-p2',
    nameLt: 'Kristus Pantokrator',
    nameEn: 'Christ Pantocrator',
    size: '20x30 cm',
    material: 'Medis, aukso lapai',
    price: 85,
    inStock: true,
    handmade: true,
    blessed: true,
  },
  {
    id: 'icon-p3',
    nameLt: 'Šv. Nikolajus Stebukladarys',
    nameEn: 'St. Nicholas the Wonderworker',
    size: '10x15 cm',
    material: 'Medis, tempera',
    price: 35,
    inStock: true,
    handmade: true,
    blessed: true,
  },
  {
    id: 'icon-p4',
    nameLt: 'Šv. Jurgis Pergalėtojas',
    nameEn: 'St. George the Victorious',
    size: '15x20 cm',
    material: 'Medis, tempera',
    price: 50,
    inStock: true,
    handmade: true,
    blessed: true,
  },
  {
    id: 'icon-p5',
    nameLt: 'Švč. Trejybė',
    nameEn: 'Holy Trinity',
    size: '25x35 cm',
    material: 'Medis, aukso lapai',
    price: 120,
    inStock: false,
    handmade: true,
    blessed: true,
  },
  {
    id: 'icon-p6',
    nameLt: 'Maža kelioninė ikona',
    nameEn: 'Small Travel Icon',
    size: '5x7 cm',
    material: 'Medis',
    price: 15,
    inStock: true,
    handmade: false,
    blessed: true,
  },
];

export function IconsStore({
  icons = defaultIcons,
  onAddToCart,
  className,
}: IconsStoreProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const updateQuantity = (id: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) + delta),
    }));
  };

  const addToCart = (icon: IconProduct) => {
    onAddToCart?.(icon, quantities[icon.id] || 1);
    setQuantities((prev) => ({ ...prev, [icon.id]: 1 }));
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-orthodox">Ikonos</CardTitle>
        <p className="text-sm text-gray-600">Icons</p>
      </CardHeader>

      <CardContent className="p-4">
        <div className="grid md:grid-cols-2 gap-4">
          {icons.map((icon) => (
            <div
              key={icon.id}
              className={cn(
                'border rounded-lg overflow-hidden',
                icon.inStock
                  ? 'border-gray-200 dark:border-gray-700'
                  : 'border-gray-200 dark:border-gray-700 opacity-60'
              )}
            >
              {/* Icon Image Placeholder */}
              <div className="aspect-square bg-gradient-to-b from-orthodox-gold/20 to-orthodox-blue/20 flex items-center justify-center">
                <span className="text-5xl">☦</span>
              </div>

              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-primary">{icon.nameLt}</h3>
                    <p className="text-sm text-gray-600">{icon.nameEn}</p>
                  </div>
                  <Badge className="bg-orthodox-gold text-gray-900">
                    €{icon.price}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  <Badge variant="outline" className="text-xs">{icon.size}</Badge>
                  <Badge variant="outline" className="text-xs">{icon.material}</Badge>
                  {icon.handmade && (
                    <Badge className="text-xs bg-orthodox-blue text-white">Rankų darbo</Badge>
                  )}
                  {icon.blessed && (
                    <Badge className="text-xs bg-orthodox-red text-white">Palaiminta</Badge>
                  )}
                </div>

                {icon.inStock ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border rounded-lg">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateQuantity(icon.id, -1)}
                        disabled={(quantities[icon.id] || 1) <= 1}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center text-sm">
                        {quantities[icon.id] || 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateQuantity(icon.id, 1)}
                      >
                        +
                      </Button>
                    </div>
                    <Button size="sm" onClick={() => addToCart(icon)}>
                      Į krepšį
                    </Button>
                  </div>
                ) : (
                  <Badge variant="secondary" className="w-full justify-center">
                    Neturime / Out of stock
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-orthodox-gold/10 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Apie ikonas / About Icons</h4>
          <p className="text-xs text-gray-600">
            Visos mūsų ikonos yra palaimintos ir paruoštos garbinimui.
            Rankų darbo ikonos gaminamos tradiciniais metodais pagal kanonines taisykles.
            <br /><br />
            All our icons are blessed and ready for veneration.
            Handmade icons are crafted using traditional methods following canonical guidelines.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default IconsStore;
