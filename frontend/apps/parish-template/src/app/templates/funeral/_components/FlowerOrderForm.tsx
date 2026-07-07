'use client';

import { useState } from 'react';
import { Button, Input, Label } from '@jol-hub/ui';
import { Flower } from 'lucide-react';
import type { Obituary } from '../page';

interface FlowerOrderFormProps {
  obituaries: Obituary[];
}

const FLOWER_PACKAGES = [
  { id: 'wreath', name: 'Funeral Wreath', price: 75 },
  { id: 'spray', name: 'Floral Spray', price: 50 },
  { id: 'bouquet', name: 'Sympathy Bouquet', price: 35 },
  { id: 'plant', name: 'Memorial Plant', price: 40 },
];

export function FlowerOrderForm({ obituaries }: FlowerOrderFormProps) {
  const [selectedObituary, setSelectedObituary] = useState<string>('');
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Submit to API / Payment integration
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <Flower className="h-12 w-12 mx-auto mb-4 text-green-600" />
        <p className="text-green-800 font-medium">Thank you for your order!</p>
        <p className="text-green-700 text-sm mt-2">You will receive a confirmation email shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-lg p-6 border">
      <div>
        <Label htmlFor="obituary">For Whom</Label>
        <select
          id="obituary"
          value={selectedObituary}
          onChange={(e) => setSelectedObituary(e.target.value)}
          className="w-full mt-1 p-2 border rounded-md"
          required
        >
          <option value="">-- Select --</option>
          {obituaries.map((obit) => (
            <option key={obit.id} value={obit.id}>
              {obit.firstName} {obit.lastName}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="package">Flower Package</Label>
        <select
          id="package"
          value={selectedPackage}
          onChange={(e) => setSelectedPackage(e.target.value)}
          className="w-full mt-1 p-2 border rounded-md"
          required
        >
          <option value="">-- Select --</option>
          {FLOWER_PACKAGES.map((pkg) => (
            <option key={pkg.id} value={pkg.id}>
              {pkg.name} - €{pkg.price}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="customerName">Your Name</Label>
        <Input
          id="customerName"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="customerEmail">Your Email</Label>
        <Input
          id="customerEmail"
          type="email"
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="message">Message Card (optional)</Label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          className="w-full mt-1 p-2 border rounded-md"
          placeholder="With deepest sympathy..."
        />
      </div>
      <Button type="submit" className="w-full">Order Flowers</Button>
    </form>
  );
}
