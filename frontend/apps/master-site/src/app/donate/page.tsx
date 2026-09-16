// Model-A-compliant donation shell (O-021 STAGED-REMOVAL): the legacy
// PSP-integrated widget was removed; the composite widget reports the
// configured selection only — the charge path is the marketplace checkout
// handoff (donation-flow-spec §1), never PSP-in-hub.
import { DonationWidget } from '@journeyoflife-org/ui/components/composite';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Paaukokite - JOL Hub',
  description: 'Padėkite Lietuvos parapijoms augti ir stiprėti',
};

export default function DonatePage() {
  return (
    <main className="min-h-screen bg-gray-100 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-center text-3xl font-bold text-gray-800">Paramos forma</h1>
        <DonationWidget
          title="Šv. apaštalų Petro ir Povilo parapija"
          presets={[10, 20, 50, 100, 200]}
          onConfigure={() => undefined}
        />
      </div>
    </main>
  );
}
