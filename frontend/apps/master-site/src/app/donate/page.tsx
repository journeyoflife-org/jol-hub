import { DonationWidget } from '@/components/donation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Paaukokite - JOL Hub',
  description: 'Padėkite Lietuvos parapijoms augti ir stiprėti',
};

export default function DonatePage() {
  return (
    <main className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Paramos forma
        </h1>
        <DonationWidget
          parishId="test-parish-vilnius"
          parishName="Šv. apaštalų Petro ir Povilo parapija"
          defaultAmounts={[10, 20, 50, 100, 200]}
          language="lt"
        />
      </div>
    </main>
  );
}
