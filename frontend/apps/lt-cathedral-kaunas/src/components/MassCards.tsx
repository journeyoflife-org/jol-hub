'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';

export interface MassCardProduct {
  id: string;
  name: string;
  nameEn?: string;
  description: string;
  price: number;
  currency: string;
  category: 'standard' | 'special' | 'memorial' | 'thanksgiving';
  inStock: boolean;
}

export interface MassCardsProps {
  products?: MassCardProduct[];
  onPurchase?: (product: MassCardProduct, quantity: number) => void;
  className?: string;
}

const categoryLabels: Record<string, { lt: string; en: string }> = {
  standard: { lt: 'Įprasta', en: 'Standard' },
  special: { lt: 'Speciali proga', en: 'Special Occasion' },
  memorial: { lt: 'Atminimui', en: 'Memorial' },
  thanksgiving: { lt: 'Padėkos', en: 'Thanksgiving' },
};

const defaultProducts: MassCardProduct[] = [
  { id: 'mc-1', name: 'Įprasta mišių kortelė', nameEn: 'Standard Mass Card', description: 'Užsakyti mišias už mirusį arba gyvą asmenį.', price: 5, currency: 'EUR', category: 'standard', inStock: true },
  { id: 'mc-2', name: 'Velykinė mišių kortelė', nameEn: 'Easter Mass Card', description: 'Velykų mišių užsakymas.', price: 10, currency: 'EUR', category: 'special', inStock: true },
  { id: 'mc-3', name: 'Atminimo kortelė', nameEn: 'Memorial Card', description: 'Mišios už mirusiųjų sielas.', price: 7, currency: 'EUR', category: 'memorial', inStock: true },
  { id: 'mc-4', name: 'Padėkos kortelė', nameEn: 'Thanksgiving Card', description: 'Padėka už gautas malones.', price: 8, currency: 'EUR', category: 'thanksgiving', inStock: true },
];

export function MassCards({ products = defaultProducts, onPurchase, className }: MassCardsProps) {
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

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-heading">Mišių kortelės</CardTitle>
            <p className="text-sm text-gray-600">Mass Cards</p>
          </div>
          {totalItems > 0 && <Badge className="bg-primary text-white">{totalItems} krepšelyje</Badge>}
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
        <div className="grid gap-4 md:grid-cols-2">
          {filteredProducts.map((product) => {
            const qty = cart.get(product.id) || 0;
            return (
              <div key={product.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">{product.name}</h3>
                    {product.nameEn && <p className="text-sm text-gray-600">{product.nameEn}</p>}
                  </div>
                  <Badge variant="secondary">{categoryLabels[product.category]?.lt}</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">{product.price} {product.currency}</span>
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
              <div>
                <p className="font-medium">Iš viso: {totalItems} kortelės</p>
                <p className="text-sm text-gray-600">Total: {totalItems} cards</p>
              </div>
              <Button onClick={handlePurchase}>Užsakyti / Order</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MassCards;