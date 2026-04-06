import type { Metadata } from 'next';
import { PreNeedPlanning } from '@/components/PreNeedPlanning';
import { GriefResources } from '@/components/GriefResources';

export const metadata: Metadata = {
  title: 'Išankstinis planavimas | Pre-Need Planning | Vilniaus Laidojimo Namai',
  description: 'Suplanuokite savo atsisveikinimą iš anksto ir palikite šeimą nuo rūpesčių.',
};

export default function PreNeedPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <PreNeedPlanning />
        </div>
        <div>
          <GriefResources />
        </div>
      </div>
    </div>
  );
}
