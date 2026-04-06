import { DiocesanPublications, RetreatBookings } from '@/components';

export const metadata = {
  title: 'Parduotuvė | Shop - Vilniaus Arkivyskupija',
  description: 'Vyskupijos parduotuvė - Diocesan shop: publications, retreat bookings',
};

export default function ShopPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="text-center">
        <h1 className="text-3xl font-heading font-bold mb-2">Parduotuvė</h1>
        <p className="text-gray-600">Diocesan Shop</p>
      </div>

      <section>
        <h2 className="text-2xl font-heading font-semibold mb-4">Vyskupijos leidiniai</h2>
        <DiocesanPublications />
      </section>

      <section>
        <h2 className="text-2xl font-heading font-semibold mb-4">Rekolekcijos</h2>
        <RetreatBookings />
      </section>
    </div>
  );
}
