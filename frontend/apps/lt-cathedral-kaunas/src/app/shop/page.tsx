import { MassCards, ConcertTickets, CathedralMerchandise } from '@/components';

export const metadata = {
  title: 'Parduotuvė | Shop - Kauno Arkikatedra',
  description: 'Katedros parduotuvė - Cathedral shop: mass cards, merchandise, concert tickets',
};

export default function ShopPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="text-center">
        <h1 className="text-3xl font-heading font-bold mb-2">Katedros parduotuvė</h1>
        <p className="text-gray-600">Cathedral Shop</p>
      </div>
      
      <section>
        <h2 className="text-2xl font-heading font-semibold mb-4">Mišių kortelės</h2>
        <MassCards />
      </section>
      
      <section>
        <h2 className="text-2xl font-heading font-semibold mb-4">Koncertų bilietai</h2>
        <ConcertTickets />
      </section>
      
      <section>
        <h2 className="text-2xl font-heading font-semibold mb-4">Katedros suvenyrai</h2>
        <CathedralMerchandise />
      </section>
    </div>
  );
}
