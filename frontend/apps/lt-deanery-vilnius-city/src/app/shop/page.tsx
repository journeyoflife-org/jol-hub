import { DeaneryMerchandise, DeaneryEventTickets } from '@/components';

export const metadata = {
  title: 'Parduotuvė | Shop - Vilniaus miesto dekanatas',
  description: 'Dekanato parduotuvė - Deanery shop',
};

export default function ShopPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="text-center">
        <h1 className="text-3xl font-heading font-bold mb-2">Dekanato parduotuvė</h1>
        <p className="text-gray-600">Deanery Shop</p>
      </div>

      <section>
        <h2 className="text-2xl font-heading font-semibold mb-4">Dekanato suvenyrai</h2>
        <DeaneryMerchandise />
      </section>

      <section>
        <h2 className="text-2xl font-heading font-semibold mb-4">Renginių bilietai</h2>
        <DeaneryEventTickets />
      </section>
    </div>
  );
}
