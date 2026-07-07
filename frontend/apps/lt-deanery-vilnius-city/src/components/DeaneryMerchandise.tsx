'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';

export interface MerchandiseItem {
  id: string;
  name: string;
  nameEn?: string;
  description: string;
  price: number;
  currency: string;
  category: 'souvenirs' | 'books' | 'candles' | 'icons';
  inStock: boolean;
  parishId?: string;
}

export interface DeaneryMerchandiseProps {
  items?: MerchandiseItem[];
  onPurchase?: (item: MerchandiseItem, quantity: number) => void;
  className?: string;
}

const categoryLabels: Record<string, { lt: string; en: string }> = {
  souvenirs: { lt: 'Suvenyrai', en: 'Souvenirs' },
  books: { lt: 'Knygos', en: 'Books' },
  candles: { lt: 'Žvakės', en: 'Candles' },
  icons: { lt: 'Ikonos', en: 'Icons' },
};

const defaultItems: MerchandiseItem[] = [
  { id: 'm-1', name: 'Dekanato atminimo žvakė', nameEn: 'Deanery Memorial Candle', description: 'Rankų darbo vaško žvakė su Vilniaus dekanato emblema.', price: 15, currency: 'EUR', category: 'candles', inStock: true },
  { id: 'm-2', name: 'Vilniaus bažnyčių gidas', nameEn: 'Guide to Vilnius Churches', description: 'Knyga apie Vilniaus miesto dekanato bažnyčias.', price: 20, currency: 'EUR', category: 'books', inStock: true },
  { id: 'm-3', name: 'Aušros Vartų koplytėlė', nameEn: 'Gate of Dawn Shrine', description: 'Miniatiūrinė Aušros Vartų koplytėlė.', price: 25, currency: 'EUR', category: 'souvenirs', inStock: true },
  { id: 'm-4', name: 'Šv. Kazimiero ikona', nameEn: 'St. Casimir Icon', description: 'Rankų darbo ikona.', price: 45, currency: 'EUR', category: 'icons', inStock: true },
  { id: 'm-5', name: 'Dekanato emblema', nameEn: 'Deanery Emblem', description: 'Dekanato emblema ant drobės.', price: 18, currency: 'EUR', category: 'souvenirs', inStock: true },
];

export function DeaneryMerchandise({ items = defaultItems, onPurchase, className }: DeaneryMerchandiseProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<Map<string, number>>(new Map());

  const filteredItems = selectedCategory ? items.filter((i) => i.category === selectedCategory) : items;

  const updateCart = (itemId: string, delta: number) => {
    setCart((prev) => {
      const newCart = new Map(prev);
      const current = newCart.get(itemId) || 0;
      const newQty = Math.max(0, current + delta);
      if (newQty === 0) newCart.delete(itemId);
      else newCart.set(itemId, newQty);
      return newCart;
    });
  };

  const handlePurchase = () => {
    cart.forEach((quantity, itemId) => {
      const item = items.find((i) => i.id === itemId);
      if (item) onPurchase?.(item, quantity);
    });
    setCart(new Map());
  };

  const categories = [...new Set(items.map((i) => i.category))];
  const totalItems = Array.from(cart.values()).reduce((sum, qty) => sum + qty, 0);
  const totalPrice = Array.from(cart.entries()).reduce((sum, [id, qty]) => {
    const item = items.find((i) => i.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-heading">Dekanato parduotuvė</CardTitle>
            <p className="text-sm text-gray-600">Deanery Merchandise</p>
          </div>
          {totalItems > 0 && <Badge className="bg-primary text-white">{totalItems} krepšelyje</Badge>}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Button variant={selectedCategory === null ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory(null)}>
            Visi
          </Button>
          {categories.map((cat) => (
            <Button key={cat} variant={selectedCategory === cat ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory(cat)}>
              {categoryLabels[cat]?.lt}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => {
            const qty = cart.get(item.id) || 0;
            return (
              <div key={item.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{item.name}</h3>
                  <Badge variant="secondary">{categoryLabels[item.category]?.lt}</Badge>
                </div>
                {item.nameEn && <p className="text-sm text-gray-600">{item.nameEn}</p>}
                <p className="text-sm text-gray-600 mt-2">{item.description}</p>

                <div className="flex items-center justify-between mt-4">
                  <span className="font-semibold">{item.price} {item.currency}</span>
                  <div className="flex items-center gap-2">
                    {qty > 0 && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => updateCart(item.id, -1)}>-</Button>
                        <span className="w-8 text-center">{qty}</span>
                      </>
                    )}
                    <Button size="sm" onClick={() => updateCart(item.id, 1)}>+</Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {totalItems > 0 && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex justify-between items-center">
              <p className="font-medium">Iš viso: {totalItems} prekės • {totalPrice} EUR</p>
              <Button onClick={handlePurchase}>Pirkti / Purchase</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DeaneryMerchandise;
