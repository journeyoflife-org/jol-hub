import type { Metadata } from 'next';
import { GraveLocator } from '@/components/GraveLocator';

export const metadata: Metadata = {
  title: 'Kapo paieška | Grave Locator | Vilniaus Kapinių Tarnyba',
  description: 'Raskite artimųjų kapus pagal vardą, pavardę ar kapo numerį.',
};

export default function LocatePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <GraveLocator />
    </div>
  );
}
