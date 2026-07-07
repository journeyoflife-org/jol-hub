import { entityConfig } from '@/config/entity';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Duomenų subjekto teisės / Data Subject Rights',
};

export default function DSRPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-heading font-bold text-primary mb-6">
        Duomenų subjekto teisės / Data Subject Rights
      </h1>
      
      <div className="prose prose-lg">
        <p className="text-gray-600 mb-4">
          GDPR Articles 15-22 - Data Subject Rights
        </p>
        
        <h2 className="text-xl font-heading text-primary mt-6 mb-3">Jūsų teisės / Your Rights</h2>
        
        <div className="space-y-4">
          <div className="p-4 border rounded">
            <h3 className="font-medium">Prieiga (Art. 15) / Access</h3>
            <p className="text-sm text-gray-600 mb-2">Teisė gauti informaciją apie savo duomenis</p>
            <a href="#" className="text-primary text-sm">Pateikti prašymą →</a>
          </div>
          
          <div className="p-4 border rounded">
            <h3 className="font-medium">Ištaisymas (Art. 16) / Rectification</h3>
            <p className="text-sm text-gray-600 mb-2">Teisė ištaisyti netikslius duomenis</p>
            <a href="#" className="text-primary text-sm">Pateikti prašymą →</a>
          </div>
          
          <div className="p-4 border rounded">
            <h3 className="font-medium">Ištrynimas (Art. 17) / Erasure</h3>
            <p className="text-sm text-gray-600 mb-2">Teisė reikalauti duomenų ištrynimo</p>
            <p className="text-xs text-orange-600">Pastaba: Kanoniniai įrašai negali būti ištrinti (CIC 535)</p>
          </div>
          
          <div className="p-4 border rounded">
            <h3 className="font-medium">Perkeliamumas (Art. 20) / Portability</h3>
            <p className="text-sm text-gray-600 mb-2">Teisė gauti duomenis perkeliamu formatu</p>
            <a href="#" className="text-primary text-sm">Pateikti prašymą →</a>
          </div>
        </div>
        
        <h2 className="text-xl font-heading text-primary mt-6 mb-3">Kaip pateikti prašymą / How to Submit</h2>
        <p className="text-gray-700 mb-4">
          Siųskite el. laišką: {entityConfig.contact.email}<br />
          Atsakysime per 30 dienų (GDPR Art. 12).
        </p>
      </div>
    </div>
  );
}
