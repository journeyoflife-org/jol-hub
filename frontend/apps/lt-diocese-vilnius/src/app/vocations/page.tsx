import { VocationsPortal } from '@/components';

export const metadata = {
  title: 'Pašaukimai | Vocations - Vilniaus Arkivyskupija',
  description: 'Kunigystės pašaukimas - Priestly vocations portal',
};

export default function VocationsPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <VocationsPortal />
    </div>
  );
}
