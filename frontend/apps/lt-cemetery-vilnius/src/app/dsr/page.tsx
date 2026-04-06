'use client';

import { DSRPage } from '@jol-hub/ui';
import { entityConfig } from '@/config/entity';

export default function DSR() {
  const handleSubmit = async (request: {
    type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    description: string;
  }) => {
    const response = await fetch('/api/compliance/dsr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...request,
        entityId: entityConfig.id,
        country: 'lt',
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to submit DSR request');
    }
  };

  return (
    <DSRPage
      entityName={entityConfig.name.en}
      contactEmail={entityConfig.contact.email}
      apiEndpoint="/api/compliance/dsr"
      onSubmit={handleSubmit}
      language="lt"
    />
  );
}
