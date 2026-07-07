'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';

export interface MemorialProduct {
  id: string;
  name: string;
  price: number;
  category: 'cards' | 'books' | 'flowers' | 'candles' | 'monuments' | 'urns';
  description?: string;
}

const categoryIcons: Record<string, string> = {
  cards: '🎴',
  books: '📕',
  flowers: '💐',
  candles: '🕯️',
  monuments: '🏛️',
  urns: '🏺',
};

const categoryLabels: Record<string, { lt: string; en: string }> = {
  cards: { lt: 'Atminimo kortelės', en: 'Memorial Cards' },
  books: { lt: 'Kondolencijų knygos', en: 'Condolence Books' },
  flowers: { lt: 'Gėlės', en: 'Flowers' },
  candles: { lt: 'Žvakės', en: 'Candles' },
  monuments: { lt: 'Paminklai', en: 'Monuments' },
  urns: { lt: 'Urnos', en: 'Urns' },
};

const defaultProducts: MemorialProduct[] = [
  {
    id: 'mem-1',
    name: 'Atminimo kortelės (50 vnt.)',
    price: 50,
    category: 'cards',
    description: 'Kokybiškos atminimo kortelės su individualiu dizainu',
  },
  {
    id: 'mem-2',
    name: 'Kondolencijų knyga',
    price: 35,
    category: 'books',
    description: 'Užrašų knyga kondolencijoms su odiniu viršeliu',
  },
  {
    id: 'mem-3',
    name: 'Gėlių vainikas',
    price: 150,
    category: 'flowers',
    description: 'Tradicinis gėlių vainikas su juosta',
  },
  {
    id: 'mem-4',
    name: 'Atminimo žvakidė',
    price: 45,
    category: 'candles',
    description: 'Dekoratyvinė žvakidė su individualiu užrašu',
  },
  {
    id: 'mem-5',
    name: 'Antkapio plokštė',
    price: 800,
    category: 'monuments',
    description: 'Granitinė antkapio plokštė su graviruotu užrašu',
  },
  {
    id: 'mem-6',
    name: 'Urna dekoratyvinė',
    price: 300,
    category: 'urns',
    description: 'Rankų darbo dekoratyvinė urna iš bronzos',
  },
  {
    id: 'mem-7',
    name: 'Gėlių krepšelis',
    price: 80,
    category: 'flowers',
    description: 'Elegantiškas gėlių krepšelis laidotuvėms',
  },
  {
    id: 'mem-8',
    name: 'Vargoninė žvakė',
    price: 25,
    category: 'candles',
    description: 'Didelė dekoratyvinė žvakė ilgam degimui',
  },
];

export interface MemorialProductsProps {
  products?: MemorialProduct[];
  onAddToCart?: (product: MemorialProduct, quantity: number) => void;
  className?: string;
}

export function MemorialProducts({
  products = defaultProducts,
  onAddToCart: _onAddToCart,
  className,
}: MemorialProductsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<Map<string, number>>(new Map());

  const filteredProducts = products.filter(
    (p) => !selectedCategory || p.category === selectedCategory
  );

  const categories = [...new Set(products.map((p) => p.category))];

  const addToCart = (productId: string) => {
    setCart((prev) => {
      const newCart = new Map(prev);
      newCart.set(productId, (newCart.get(productId) || 0) + 1);
      return newCart;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const newCart = new Map(prev);
      const current = newCart.get(productId) || 0;
      if (current <= 1) {
        newCart.delete(productId);
      } else {
        newCart.set(productId, current - 1);
      }
      return newCart;
    });
  };

  const totalItems = Array.from(cart.values()).reduce((sum, qty) => sum + qty, 0);
  const totalPrice = Array.from(cart.entries()).reduce((sum, [id, qty]) => {
    const product = products.find((p) => p.id === id);
    return sum + (product ? product.price * qty : 0);
  }, 0);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-heading">Atminimo gaminiai</CardTitle>
            <p className="text-sm text-gray-600">Memorial Products</p>
          </div>
          {totalItems > 0 && (
            <Badge className="bg-memorial-gold text-white">
              Krepšelis: {totalItems} prekės / €{totalPrice}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            Visi
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
            >
              {categoryIcons[cat]} {categoryLabels[cat]?.lt}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const qty = cart.get(product.id) || 0;
            return (
              <div
                key={product.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="text-center mb-3">
                  <span className="text-4xl">{categoryIcons[product.category]}</span>
                </div>
                <h3 className="font-medium text-primary text-center">{product.name}</h3>
                {product.description && (
                  <p className="text-xs text-gray-600 text-center mt-1">{product.description}</p>
                )}
                <p className="text-lg font-bold text-memorial-navy text-center mt-2">
                  €{product.price}
                </p>

                {qty > 0 ? (
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <Button variant="outline" size="sm" onClick={() => removeFromCart(product.id)}>
                      -
                    </Button>
                    <span className="w-8 text-center">{qty}</span>
                    <Button variant="outline" size="sm" onClick={() => addToCart(product.id)}>
                      +
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full mt-3"
                    size="sm"
                    onClick={() => addToCart(product.id)}
                  >
                    Į krepšelį
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {totalItems > 0 && (
          <div className="mt-6 p-4 bg-memorial-cream rounded-lg flex justify-between items-center">
            <div>
              <p className="font-medium">Viso: {totalItems} prekės</p>
              <p className="text-2xl font-bold text-memorial-navy">€{totalPrice}</p>
            </div>
            <Button onClick={() => console.log('Checkout:', Object.fromEntries(cart))}>
              Užsakyti / Order
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MemorialProducts;
