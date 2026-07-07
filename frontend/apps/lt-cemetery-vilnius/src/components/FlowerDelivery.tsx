'use client';

import * as React from 'react';
import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';
import { entityConfig, type FlowerDelivery } from '@/config/entity';

export interface FlowerDeliveryOrder {
  flowerId: string;
  plotId: string;
  deliveryDate: Date;
  message?: string;
  recurring: boolean;
}

export interface FlowerDeliveryProps {
  flowers?: FlowerDelivery[];
  onOrder?: (order: FlowerDeliveryOrder) => void;
  className?: string;
}

export function FlowerDelivery({
  flowers = entityConfig.flowerDeliveries,
  onOrder,
  className,
}: FlowerDeliveryProps) {
  const [selectedFlower, setSelectedFlower] = useState<FlowerDelivery | null>(null);
  const [plotId, setPlotId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [message, setMessage] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [cart, setCart] = useState<Map<string, number>>(new Map());

  const addToCart = (flowerId: string) => {
    setCart((prev) => {
      const newCart = new Map(prev);
      newCart.set(flowerId, (newCart.get(flowerId) || 0) + 1);
      return newCart;
    });
  };

  const totalItems = Array.from(cart.values()).reduce((sum, qty) => sum + qty, 0);
  const totalPrice = Array.from(cart.entries()).reduce((sum, [id, qty]) => {
    const flower = flowers.find((f) => f.id === id);
    return sum + (flower ? flower.price * qty : 0);
  }, 0);

  const handleOrder = () => {
    if (selectedFlower && plotId) {
      onOrder?.({
        flowerId: selectedFlower.id,
        plotId,
        deliveryDate: new Date(deliveryDate),
        message,
        recurring,
      });
      setShowForm(false);
      setSelectedFlower(null);
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-heading">Gėlių pristatymas</CardTitle>
            <p className="text-sm text-gray-600">Flower Delivery</p>
          </div>
          {totalItems > 0 && (
            <Badge className="bg-primary text-white">
              Krepšelis: {totalItems} | €{totalPrice}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {!showForm ? (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {flowers.map((flower) => {
                const qty = cart.get(flower.id) || 0;
                return (
                  <div
                    key={flower.id}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="text-center mb-3">
                      <span className="text-4xl">💐</span>
                    </div>
                    <h3 className="font-heading text-lg text-center text-primary">{flower.name}</h3>
                    <div className="flex justify-center gap-1 mt-2">
                      {flower.seasonal && <Badge variant="secondary">Sezoninis</Badge>}
                    </div>
                    <p className="text-sm text-gray-600 text-center mt-2">
                      {flower.flowers.join(', ')}
                    </p>
                    <p className="text-xl font-bold text-primary text-center mt-3">
                      €{flower.price}
                    </p>

                    {qty > 0 ? (
                      <div className="flex items-center justify-center gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCart((prev) => {
                              const newCart = new Map(prev);
                              if ((newCart.get(flower.id) || 0) <= 1) {
                                newCart.delete(flower.id);
                              } else {
                                newCart.set(flower.id, (newCart.get(flower.id) || 1) - 1);
                              }
                              return newCart;
                            });
                          }}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center">{qty}</span>
                        <Button variant="outline" size="sm" onClick={() => addToCart(flower.id)}>
                          +
                        </Button>
                      </div>
                    ) : (
                      <Button
                        className="w-full mt-3"
                        size="sm"
                        onClick={() => addToCart(flower.id)}
                      >
                        Į krepšelį
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            {totalItems > 0 && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Viso: {totalItems} gėlės</p>
                    <p className="text-2xl font-bold text-primary">€{totalPrice}</p>
                  </div>
                  <Button onClick={() => setShowForm(true)}>
                    Tęsti užsakymą
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
              ← Atgal
            </Button>

            <h4 className="font-heading text-lg">Pristatymo informacija / Delivery Details</h4>

            <div>
              <label className="block text-sm font-medium mb-1">Kapo numeris / Plot ID *</label>
              <input
                type="text"
                value={plotId}
                onChange={(e) => setPlotId(e.target.value)}
                placeholder="pvz. A-1-1"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Pristatymo data / Delivery Date *</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Žinutė / Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Pridėti žinutę prie gėlių..."
                className="w-full px-4 py-2 border rounded-lg min-h-[80px]"
              />
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
              />
              <span className="text-sm">Pasikartojantis pristatymas (kas mėnesį)</span>
            </label>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium mb-2">Užsakymo santrauka / Order Summary:</p>
              <div className="space-y-1 text-sm">
                {Array.from(cart.entries()).map(([id, qty]) => {
                  const flower = flowers.find((f) => f.id === id);
                  return flower ? (
                    <p key={id} className="flex justify-between">
                      <span>{flower.name} × {qty}</span>
                      <span>€{flower.price * qty}</span>
                    </p>
                  ) : null;
                })}
                <p className="font-bold pt-2 border-t flex justify-between">
                  <span>Viso / Total:</span>
                  <span>€{totalPrice}</span>
                </p>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={!plotId || !deliveryDate}
              onClick={handleOrder}
            >
              Patvirtinti užsakymą / Confirm Order
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default FlowerDelivery;
