import { entityConfig } from '@/config/entity';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Slapukų politika / Cookie Policy',
};

export default function CookiesPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-heading font-bold text-primary mb-6">
        Slapukų politika / Cookie Policy
      </h1>
      
      <div className="prose prose-lg">
        <p className="text-gray-600 mb-4">
          Last updated: {new Date().toLocaleDateString('lt-LT')}
        </p>
        
        <h2 className="text-xl font-heading text-primary mt-6 mb-3">Kas yra slapukai? / What are cookies?</h2>
        <p className="text-gray-700 mb-4">
          Slapukai yra maži tekstiniai failai, kurie saugomi Jūsų įrenginyje, kai lankotės mūsų svetainėje.
        </p>

        <h2 className="text-xl font-heading text-primary mt-6 mb-3">Naudojami slapukai / Cookies Used</h2>
        <table className="w-full border-collapse mb-4">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Slapukas</th>
              <th className="text-left py-2">Tikslas</th>
              <th className="text-left py-2">Trukmė</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-2">jol-hub-locale</td>
              <td className="py-2">Kalbos nuostatos</td>
              <td className="py-2">1 metai</td>
            </tr>
            <tr className="border-b">
              <td className="py-2">consent_given</td>
              <td className="py-2">GDPR sutikimas</td>
              <td className="py-2">2 metai</td>
            </tr>
          </tbody>
        </table>

        <h2 className="text-xl font-heading text-primary mt-6 mb-3">Jūsų teisės / Your Rights</h2>
        <p className="text-gray-700 mb-4">
          Galite bet kada atšaukti savo sutikimą slapukų nustatymuose.
        </p>

        <h2 className="text-xl font-heading text-primary mt-6 mb-3">Kontaktai / Contact</h2>
        <p className="text-gray-700">
          {entityConfig.name.lt}<br />
          {entityConfig.address.street}, {entityConfig.address.postalCode} {entityConfig.address.city}<br />
          {entityConfig.contact.email}
        </p>
      </div>
    </div>
  );
}
