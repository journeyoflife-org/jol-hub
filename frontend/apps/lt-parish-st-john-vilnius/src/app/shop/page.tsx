import { MassIntentions, ReligiousItems, HallRental } from '@/components';

export default function ShopPage() {
  return (
    <div className="space-y-12">
      <section className="text-center py-4">
        <h1 className="text-3xl font-heading font-bold text-primary mb-2">
          Parapijos parduotuvė
        </h1>
        <p className="text-xl text-gray-600">Parish Shop</p>
      </section>

      {/* Mass Intentions */}
      <section id="mass-intentions">
        <h2 className="text-2xl font-heading font-bold text-primary mb-4">
          Šv. Mišių intencijos / Mass Intentions
        </h2>
        <MassIntentions />
      </section>

      {/* Religious Items */}
      <section id="religious-items">
        <h2 className="text-2xl font-heading font-bold text-primary mb-4">
          Religiniai daiktai / Religious Items
        </h2>
        <ReligiousItems />
      </section>

      {/* Hall Rental */}
      <section id="hall-rental">
        <h2 className="text-2xl font-heading font-bold text-primary mb-4">
          Salės nuoma / Hall Rental
        </h2>
        <HallRental />
      </section>

      {/* Payment Methods */}
      <section className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h2 className="text-lg font-medium text-primary mb-4">
          Mokėjimo būdai / Payment Methods
        </h2>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💵</span>
            <span>Grynaisiais bažnyčioje / Cash at church</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">💳</span>
            <span>Banko kortele / Card payment</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏦</span>
            <span>Banko pavedimu / Bank transfer</span>
          </div>
        </div>
      </section>
    </div>
  );
}
