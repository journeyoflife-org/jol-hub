'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';

export interface ReligiousItem {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  price: number;
  category: 'books' | 'rosaries' | 'candles' | 'icons' | 'statues' | 'other';
  inStock: boolean;
  image?: string;
}

export interface CartItem extends ReligiousItem {
  quantity: number;
}

export interface ReligiousItemsProps {
  items?: ReligiousItem[];
  onAddToCart?: (item: ReligiousItem, quantity: number) => void;
  className?: string;
}

const categoryLabels: Record<string, { lt: string; en: string }> = {
  books: { lt: 'Knygos', en: 'Books' },
  rosaries: { lt: 'Vėrinėliai', en: 'Rosaries' },
  candles: { lt: 'Žvakės', en: 'Candles' },
  icons: { lt: 'Ikonos', en: 'Icons' },
  statues: { lt: 'Statulėlės', en: 'Statues' },
  other: { lt: 'Kita', en: 'Other' },
};

const defaultItems: ReligiousItem[] = [
  {
    id: 'item-1',
    name: 'Maldynėlis "Šv. Jonas',
    nameEn: 'St. John Prayer Book',
    description: 'Maldų rinkinys su Šv. Jono bažnyčios istorija',
    price: 8,
    category: 'books',
    inStock: true,
  },
  {
    id: 'item-2',
    name: 'Vėrinėlis iš alyvmedžio',
    nameEn: 'Olive Wood Rosary',
    description: 'Rankų darbo vėrinėlis iš Šventosios Žemės',
    price: 15,
    category: 'rosaries',
    inStock: true,
  },
  {
    id: 'item-3',
    name: 'Votyvinė žvakė',
    nameEn: 'Votive Candle',
    description: 'Natūralus vaškas, dega 48 valandas',
    price: 3,
    category: 'candles',
    inStock: true,
  },
  {
    id: 'item-4',
    name: 'Šv. Jono Krikštytojo ikona',
    nameEn: 'St. John the Baptist Icon',
    description: 'Rankų darbo ikona ant medžio lentos',
    price: 45,
    category: 'icons',
    inStock: true,
  },
  {
    id: 'item-5',
    name: 'Mažoji Marijos statulėlė',
    nameEn: 'Small Mary Statue',
    description: 'Porceliano statulėlė, 15 cm aukščio',
    price: 25,
    category: 'statues',
    inStock: false,
  },
  {
    id: 'item-6',
    name: 'Atminimo šv. Jonas kortelė',
    nameEn: 'St. John Memorial Card',
    description: 'Su maldos atspaudu, 10 vnt. rinkinys',
    price: 5,
    category: 'other',
    inStock: true,
  },
  {
    id: 'item-7',
    name: 'Katekizmas lietuvių kalba',
    nameEn: 'Catechism in Lithuanian',
    description: 'Katalikų Bažnyčios katekizmas',
    price: 20,
    category: 'books',
    inStock: true,
  },
  {
    id: 'item-8',
    name: 'Naktinė žvakė',
    nameEn: 'Night Light Candle',
    description: 'Elektrinė žvakė su lempute, saugi namams',
    price: 12,
    category: 'candles',
    inStock: true,
  },
];

export function ReligiousItems({
  items = defaultItems,
  onAddToCart,
  className,
}: ReligiousItemsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const filteredItems = items.filter(
    (item) => !selectedCategory || item.category === selectedCategory
  );

  const categories = [...new Set(items.map((item) => item.category))];

  const updateQuantity = (itemId: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + delta),
    }));
  };

  const addToCart = (item: ReligiousItem) => {
    const quantity = quantities[item.id] || 1;
    onAddToCart?.(item, quantity);
    setQuantities((prev) => ({ ...prev, [item.id]: 0 }));
  };

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-heading">Religiniai daiktai</CardTitle>
            <p className="text-sm text-gray-600">Religious Items</p>
          </div>
          {totalCartItems > 0 && (
            <Badge className="bg-primary text-white">
              Krepšelyje: {totalCartItems}
            </Badge>
          )}
        </div>

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
              {categoryLabels[category]?.lt} ({items.filter((i) => i.category === category).length})
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
                  <h3 className="font-medium text-primary">{item.name}</h3>
                  <p className="text-sm text-gray-600">{item.nameEn}</p>
                </div>
                <Badge className="bg-liturgical-gold text-gray-900">
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
                        disabled={(quantities[item.id] || 0) === 0}
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
                    Neturime / Out of stock
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>Šioje kategorijoje prekių nėra.</p>
            <p className="text-sm">No items in this category.</p>
          </div>
        )}

        {/* Pickup Info */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Atsiėmimas / Pickup</h4>
          <p className="text-xs text-gray-600">
            Prekes galima atsiimti bažnyčios zakristijoje po pamaldų.
            <br />
            Items can be picked up at the church sacristy after services.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default ReligiousItems;
