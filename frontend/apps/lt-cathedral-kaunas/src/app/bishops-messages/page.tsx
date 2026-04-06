import { BishopsMessages } from '@/components';

export const metadata = {
  title: "Vyskupo laiškai | Bishop's Messages - Kauno Arkikatedra",
  description: 'Kauno arkivyskupo pranešimai ir laiškai - Archbishop messages and letters',
};

export default function BishopsMessagesPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-heading font-bold mb-2">Arkivyskupo pranešimai</h1>
      <p className="text-gray-600 mb-8">Archbishop's Messages</p>
      <BishopsMessages />
    </div>
  );
}
