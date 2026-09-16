// Model-A-compliant donation shell (O-021 STAGED-REMOVAL): the legacy
// PSP-integrated widget was removed; the composite widget reports the
// configured selection only — the charge path is the marketplace checkout
// handoff (donation-flow-spec §1), never PSP-in-hub.
import { DonationWidget } from '@jol-hub/ui/components/composite';
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
          title="Šv. apaštalų Petro ir Povilo parapija"
          presets={[10, 20, 50, 100, 200]}
          onConfigure={() => undefined}
        />
      </div>
    </main>
  );
}
