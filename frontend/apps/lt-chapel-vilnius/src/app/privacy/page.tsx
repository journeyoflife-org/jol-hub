import { entityConfig } from '@/config/entity';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privatumo politika / Privacy Policy',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-heading font-bold text-primary mb-6">
        Privatumo politika / Privacy Policy
      </h1>
      
      <div className="prose prose-lg">
        <p className="text-gray-600 mb-4">
          Last updated: {new Date().toLocaleDateString('lt-LT')}
        </p>
        
        <h2 className="text-xl font-heading text-primary mt-6 mb-3">1. Duomenų valdytojas / Data Controller</h2>
        <p className="text-gray-700 mb-4">
          <strong>{entityConfig.name.lt}</strong><br />
          {entityConfig.address.street}, {entityConfig.address.postalCode} {entityConfig.address.city}<br />
          Email: {entityConfig.contact.email}
        </p>

        <h2 className="text-xl font-heading text-primary mt-6 mb-3">2. Renkami duomenys / Data Collected</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>Vardas, pavardė, el. paštas</li>
          <li>Piligrimystės registro duomenys</li>
          <li>Apsilankymo istorija</li>
          <li>Žvakių užsakymai</li>
        </ul>

        <h2 className="text-xl font-heading text-primary mt-6 mb-3">3. Duomenų tvarkymo tikslai / Processing Purposes</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>Koplyčios aptarnavimas</li>
          <li>Piligrimystės organizavimas</li>
          <li>Žvakių tarnyba</li>
          <li>Maldininkų aptarnavimas</li>
        </ul>

        <h2 className="text-xl font-heading text-primary mt-6 mb-3">4. Teisiniai pagrindai / Legal Basis</h2>
        <p className="text-gray-700 mb-4">
          Duomenys tvarkomi pagal BDAR 6 str. 1 d. a), b), f) punktus.
        </p>

        <h2 className="text-xl font-heading text-primary mt-6 mb-3">5. Jūsų teisės / Your Rights</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>Prieigos teisė (Art. 15)</li>
          <li>Teisė į ištaisymą (Art. 16)</li>
          <li>Teisė į ištrynimą (Art. 17)</li>
          <li>Teisė į perkeliamumą (Art. 20)</li>
          <li>Teisė prieštarauti (Art. 21)</li>
        </ul>

        <h2 className="text-xl font-heading text-primary mt-6 mb-3">6. Kontaktai / Contact</h2>
        <p className="text-gray-700">
          Visi klausimai: {entityConfig.contact.email}
        </p>
      </div>
    </div>
  );
}
