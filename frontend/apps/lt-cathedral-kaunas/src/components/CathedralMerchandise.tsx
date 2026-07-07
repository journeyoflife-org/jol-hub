'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';

export interface MerchandiseProduct {
  id: string;
  name: string;
  nameEn?: string;
  description: string;
  price: number;
  currency: string;
  category: 'books' | 'souvenirs' | 'candles' | 'icons' | 'music';
  inStock: boolean;
}

export interface CathedralMerchandiseProps {
  products?: MerchandiseProduct[];
  onPurchase?: (product: MerchandiseProduct, quantity: number) => void;
  className?: string;
}

const categoryLabels: Record<string, { lt: string; en: string }> = {
  books: { lt: 'Knygos', en: 'Books' },
  souvenirs: { lt: 'Suvenyrai', en: 'Souvenirs' },
  candles: { lt: 'Žvakės', en: 'Candles' },
  icons: { lt: 'Ikonos', en: 'Icons' },
  music: { lt: 'Muzika', en: 'Music' },
};

const defaultProducts: MerchandiseProduct[] = [
  { id: 'm-1', name: 'Katedros istorija', nameEn: 'Cathedral History', description: 'Knyga apie Kauno arkikatedros istoriją.', price: 25, currency: 'EUR', category: 'books', inStock: true },
  { id: 'm-2', name: 'Katedros atminimo žvakė', nameEn: 'Cathedral Memorial Candle', description: 'Rankų darbo vaško žvakė su Katedros atvaizdu.', price: 12, currency: 'EUR', category: 'candles', inStock: true },
  { id: 'm-3', name: 'Katedros suvenyras', nameEn: 'Cathedral Souvenir', description: 'Miniatiūrinė Katedros modelis.', price: 18, currency: 'EUR', category: 'souvenirs', inStock: true },
  { id: 'm-4', name: 'Šv. Petro ir Pauliaus ikona', nameEn: 'St. Peter and St. Paul Icon', description: 'Rankų darbo ikona, sukurtas pagal Katedros meną.', price: 45, currency: 'EUR', category: 'icons', inStock: true },
  { id: 'm-5', name: 'Vargonų muzikos CD', nameEn: 'Organ Music CD', description: 'Katedros vargonų muzikos įrašai.', price: 15, currency: 'EUR', category: 'music', inStock: true },
];

export function CathedralMerchandise({ products = defaultProducts, onPurchase, className }: CathedralMerchandiseProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<Map<string, number>>(new Map());

  const filteredProducts = selectedCategory ? products.filter((p) => p.category === selectedCategory) : products;

  const updateCart = (productId: string, delta: number) => {
    setCart((prev) => {
      const newCart = new Map(prev);
      const current = newCart.get(productId) || 0;
      const newQty = Math.max(0, current + delta);
      if (newQty === 0) newCart.delete(productId);
      else newCart.set(productId, newQty);
      return newCart;
    });
  };

  const handlePurchase = () => {
    cart.forEach((quantity, productId) => {
      const product = products.find((p) => p.id === productId);
      if (product) onPurchase?.(product, quantity);
    });
  };

  const categories = [...new Set(products.map((p) => p.category))];
  const totalItems = Array.from(cart.values()).reduce((sum, qty) => sum + qty, 0);
  const totalPrice = Array.from(cart.entries()).reduce((sum, [id, qty]) => {
    const product = products.find((p) => p.id === id);
    return sum + (product ? product.price * qty : 0);
  }, 0);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-heading">Katedros parduotuvė</CardTitle>
            <p className="text-sm text-gray-600">Cathedral Shop</p>
          </div>
          {totalItems > 0 && <Badge className="bg-primary text-white">{totalItems} items</Badge>}
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Button variant={selectedCategory === null ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory(null)}>Visi</Button>
          {categories.map((cat) => (
            <Button key={cat} variant={selectedCategory === cat ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory(cat)}>
              {categoryLabels[cat]?.lt}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => {
            const qty = cart.get(product.id) || 0;
            return (
              <div key={product.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{product.name}</h3>
                  <Badge variant="secondary">{categoryLabels[product.category]?.lt}</Badge>
                </div>
                {product.nameEn && <p className="text-sm text-gray-600">{product.nameEn}</p>}
                <p className="text-sm text-gray-600 mt-2">{product.description}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="font-semibold">{product.price} {product.currency}</span>
                  <div className="flex items-center gap-2">
                    {qty > 0 && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => updateCart(product.id, -1)}>-</Button>
                        <span className="w-8 text-center">{qty}</span>
                      </>
                    )}
                    <Button size="sm" onClick={() => updateCart(product.id, 1)}>+</Button>
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

export default CathedralMerchandise;