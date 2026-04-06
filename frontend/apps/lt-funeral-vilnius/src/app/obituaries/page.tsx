import type { Metadata } from 'next';
import { ObituaryPortal } from '@/components/ObituaryPortal';

export const metadata: Metadata = {
  title: 'Nekrologai | Obituaries | Vilniaus Laidojimo Namai',
  description: 'Peržiūrėkite naujausius nekrologus ir atsisveikinimo ceremonijų informaciją.',
};

export default function ObituariesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ObituaryPortal />
    </div>
  );
}
