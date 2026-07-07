'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';

export interface OrthodoxItem {
  id: string;
  nameLt: string;
  nameEn: string;
  category: 'books' | 'crosses' | 'incense' | 'oil' | 'other';
  price: number;
  inStock: boolean;
  description: string;
}

export interface OrthodoxItemsProps {
  items?: OrthodoxItem[];
  onAddToCart?: (item: OrthodoxItem, quantity: number) => void;
  className?: string;
}

const categoryLabels: Record<string, { lt: string; en: string }> = {
  books: { lt: 'Knygos', en: 'Books' },
  crosses: { lt: 'Kryžiai', en: 'Crosses' },
  incense: { lt: 'Kvapiejai', en: 'Incense' },
  oil: { lt: 'Aliejai', en: 'Holy Oils' },
  other: { lt: 'Kita', en: 'Other' },
};

const defaultItems: OrthodoxItem[] = [
  {
    id: 'item-1',
    nameLt: 'Maldynas stačiatikiams',
    nameEn: 'Orthodox Prayer Book',
    category: 'books',
    price: 12,
    inStock: true,
    description: 'Maldų rinkinys su pagrindinėmis stačiatikių maldomis',
  },
  {
    id: 'item-2',
    nameLt: 'Kryžius su grandinėle',
    nameEn: 'Pectoral Cross with Chain',
    category: 'crosses',
    price: 25,
    inStock: true,
    description: 'Kryžius su grandinėle, pašventintas',
  },
  {
    id: 'item-3',
    nameLt: 'Kvapiejai (100g)',
    nameEn: 'Incense (100g)',
    category: 'incense',
    price: 8,
    inStock: true,
    description: 'Aukštos kokybės stačiatikių kvapiejai',
  },
  {
    id: 'item-4',
    nameLt: 'Švęstas aliejus',
    nameEn: 'Holy Oil',
    category: 'oil',
    price: 10,
    inStock: true,
    description: 'Pašventintas aliejus namams',
  },
  {
    id: 'item-5',
    nameLt: 'Stačiatikių katekizmas',
    nameEn: 'Orthodox Catechism',
    category: 'books',
    price: 18,
    inStock: true,
    description: 'Pilnas stačiatikių tikėjimo katekizmas',
  },
  {
    id: 'item-6',
    nameLt: 'Ikona-kabantis kryžius',
    nameEn: 'Wall Cross Icon',
    category: 'crosses',
    price: 35,
    inStock: false,
    description: 'Sieninis kryžius su ikona',
  },
  {
    id: 'item-7',
    nameLt: 'Pravoslavų kalendorius',
    nameEn: 'Orthodox Calendar',
    category: 'other',
    price: 5,
    inStock: true,
    description: 'Metinis ortodoksų kalendorius su šventėmis',
  },
  {
    id: 'item-8',
    nameLt: 'Kvapiejai - Auksinis mišinys',
    nameEn: 'Incense - Golden Blend',
    category: 'incense',
    price: 15,
    inStock: true,
    description: 'Prabangus kvapieji mišinys su auksu',
  },
];

export function OrthodoxItems({
  items = defaultItems,
  onAddToCart,
  className,
}: OrthodoxItemsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const filteredItems = items.filter(
    (item) => !selectedCategory || item.category === selectedCategory
  );

  const categories = [...new Set(items.map((item) => item.category))];

  const updateQuantity = (id: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) + delta),
    }));
  };

  const addToCart = (item: OrthodoxItem) => {
    onAddToCart?.(item, quantities[item.id] || 1);
    setQuantities((prev) => ({ ...prev, [item.id]: 1 }));
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-orthodox">Stačiatikių prekės</CardTitle>
        <p className="text-sm text-gray-600">Orthodox Items</p>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            Visi ({items.length})
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {categoryLabels[category]?.lt}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="grid md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={cn(
                'p-4 border rounded-lg',
                item.inStock
                  ? 'border-gray-200 dark:border-gray-700'
                  : 'border-gray-200 dark:border-gray-700 opacity-60'
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-primary">{item.nameLt}</h3>
                  <p className="text-sm text-gray-600">{item.nameEn}</p>
                </div>
                <Badge className="bg-orthodox-gold text-gray-900">
                  €{item.price}
                </Badge>
              </div>

              <p className="text-sm text-gray-600 mb-3">{item.description}</p>

              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {categoryLabels[item.category]?.lt}
                </Badge>

                {item.inStock ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border rounded-lg">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateQuantity(item.id, -1)}
                        disabled={(quantities[item.id] || 1) <= 1}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center text-sm">
                        {quantities[item.id] || 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        +
                      </Button>
                    </div>
                    <Button size="sm" onClick={() => addToCart(item)}>
                      Į krepšį
                    </Button>
                  </div>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    Neturime
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>Šioje kategorijoje prekių nėra.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default OrthodoxItems;
