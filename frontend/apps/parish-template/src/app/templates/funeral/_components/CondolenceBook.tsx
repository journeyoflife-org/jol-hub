'use client';

import { useState } from 'react';
import { Button, Input, Label } from '@jol-hub/ui';
import type { Obituary } from '../page';

interface CondolenceBookProps {
  obituaries: Obituary[];
}

export function CondolenceBook({ obituaries }: CondolenceBookProps) {
  const [selectedObituary, setSelectedObituary] = useState<string>('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Submit to API
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <p className="text-green-800">Thank you for your condolence. It will be reviewed before publishing.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-lg p-6 border">
      <div>
        <Label htmlFor="obituary">Select Deceased</Label>
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
        <Label htmlFor="name">Your Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="message">Your Condolence</Label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="w-full mt-1 p-2 border rounded-md"
          required
        />
      </div>
      <Button type="submit" className="w-full">Submit Condolence</Button>
    </form>
  );
}
