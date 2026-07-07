import { entityConfig } from '@/config/entity';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sutikimas / Consent',
};

export default function ConsentPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-heading font-bold text-primary mb-6">
        Sutikimas / Consent
      </h1>
      
      <div className="prose prose-lg">
        <p className="text-gray-600 mb-4">
          GDPR Article 7 - Conditions for consent
        </p>
        
        <h2 className="text-xl font-heading text-primary mt-6 mb-3">Sutikimo rūšys / Types of Consent</h2>
        
        <div className="space-y-4">
          <div className="p-4 border rounded">
            <h3 className="font-medium">Naujienlaiškis / Newsletter</h3>
            <p className="text-sm text-gray-600">Sutikimas gauti vienuolyno naujienas</p>
          </div>
          
          <div className="p-4 border rounded">
            <h3 className="font-medium">Aukos / Donations</h3>
            <p className="text-sm text-gray-600">Sutikimas tvarkyti aukų duomenis</p>
          </div>
          
          <div className="p-4 border rounded">
            <h3 className="font-medium">Svečių namai / Guest House</h3>
            <p className="text-sm text-gray-600">Sutikimas rezervacijos tvarkymui</p>
          </div>
          
          <div className="p-4 border rounded">
            <h3 className="font-medium">Oblacija / Oblation</h3>
            <p className="text-sm text-gray-600">Sutikimas oblacijos programos dalyvavimui</p>
          </div>
        </div>
        
        <h2 className="text-xl font-heading text-primary mt-6 mb-3">Teisė atšaukti sutikimą / Right to Withdraw</h2>
        <p className="text-gray-700 mb-4">
          Galite bet kada atšaukti savo sutikimą rašydami: {entityConfig.contact.email}
        </p>
      </div>
    </div>
  );
}
