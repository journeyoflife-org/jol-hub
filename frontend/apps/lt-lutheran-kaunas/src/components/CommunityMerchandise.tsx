'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';

export interface MerchandiseItem {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  price: number;
  category: 'books' | 'music' | 'souvenirs' | 'apparel' | 'other';
  inStock: boolean;
  image?: string;
}

export interface CommunityMerchandiseProps {
  items?: MerchandiseItem[];
  onAddToCart?: (item: MerchandiseItem, quantity: number) => void;
  className?: string;
}

const categoryLabels: Record<string, { lt: string; en: string }> = {
  books: { lt: 'Knygos', en: 'Books' },
  music: { lt: 'Muzika', en: 'Music' },
  souvenirs: { lt: 'Suvenyrai', en: 'Souvenirs' },
  apparel: { lt: 'Apranga', en: 'Apparel' },
  other: { lt: 'Kita', en: 'Other' },
};

const defaultItems: MerchandiseItem[] = [
  {
    id: 'item-1',
    name: 'Mažasis Katekizmas',
    nameEn: "Luther's Small Catechism",
    description: 'Martino Liuterio Mažasis Katekizmas lietuvių kalba',
    price: 8,
    category: 'books',
    inStock: true,
  },
  {
    id: 'item-2',
    name: 'Parapijos istorija',
    nameEn: 'Parish History',
    description: 'Kauno evangelikų liuteronų bažnyčios istorijos knyga',
    price: 15,
    category: 'books',
    inStock: true,
  },
  {
    id: 'item-3',
    name: 'Choro albumas "Giesmės"',
    nameEn: 'Choir Album "Hymns"',
    description: 'Parapijos choro įrašytas giesmių albumas',
    price: 12,
    category: 'music',
    inStock: true,
  },
  {
    id: 'item-4',
    name: 'Lutherio rožės ženklas',
    nameEn: 'Luther Rose Pin',
    description: 'Klasikinis Liuterio rožės ženklas',
    price: 5,
    category: 'souvenirs',
    inStock: true,
  },
  {
    id: 'item-5',
    name: 'Parapijos marškinėliai',
    nameEn: 'Parish T-Shirt',
    description: 'Balti marškinėliai su parapijos logotipu',
    price: 18,
    category: 'apparel',
    inStock: true,
  },
  {
    id: 'item-6',
    name: 'Giesmynas',
    nameEn: 'Hymnal',
    description: 'Evangelikų liuteronų giesmynas',
    price: 20,
    category: 'books',
    inStock: true,
  },
  {
    id: 'item-7',
    name: 'Medinis kryžius',
    nameEn: 'Wooden Cross',
    description: 'Rankų darbo medinis kryžius',
    price: 25,
    category: 'souvenirs',
    inStock: false,
  },
  {
    id: 'item-8',
    name: 'Kalėdinis CD rinkinys',
    nameEn: 'Christmas CD Collection',
    description: 'Kalėdinių giesmių rinkinys',
    price: 10,
    category: 'music',
    inStock: true,
  },
];

export function CommunityMerchandise({
  items = defaultItems,
  onAddToCart,
  className,
}: CommunityMerchandiseProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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

  const addToCart = (item: MerchandiseItem) => {
    const quantity = quantities[item.id] || 1;
    onAddToCart?.(item, quantity);
    setQuantities((prev) => ({ ...prev, [item.id]: 0 }));
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-heading">Bendruomenės prekės</CardTitle>
        <p className="text-sm text-gray-600">Community Merchandise</p>

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
                  <h3 className="font-medium text-primary">{item.name}</h3>
                  <p className="text-sm text-gray-600">{item.nameEn}</p>
                </div>
                <Badge className="bg-lutheran-gold text-gray-900">
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
          </div>
        )}

        {/* Pickup Info */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Atsiėmimas / Pickup</h4>
          <p className="text-xs text-gray-600">
            Prekes galima atsiimti parapijos biure sekmadieniais po pamaldų arba
            biuro darbo valandomis.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default CommunityMerchandise;
