'use client';

import { ConsentPage } from '@jol-hub/ui';
import { entityConfig } from '@/config/entity';

export default function Consent() {
  const handleConsentUpdate = async (consents: {
    marketing: boolean;
    analytics: boolean;
    thirdParty: boolean;
    newsletter: boolean;
  }) => {
    const response = await fetch('/api/compliance/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: localStorage.getItem('dsr-email'),
        consents,
        entityId: entityConfig.id,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update consent');
    }
  };

  return (
    <ConsentPage
      entityName={entityConfig.name.en}
      contactEmail={entityConfig.contact.email}
      onConsentUpdate={handleConsentUpdate}
      language="lt"
    />
  );
}
