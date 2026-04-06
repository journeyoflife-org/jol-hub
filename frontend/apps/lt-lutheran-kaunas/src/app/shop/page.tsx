import { CommunityMerchandise, EventTickets } from '@/components';

export default function ShopPage() {
  return (
    <div className="space-y-12">
      <section className="text-center py-4">
        <h1 className="text-3xl font-heading font-bold text-primary mb-2">
          Parapijos parduotuvė
        </h1>
        <p className="text-xl text-gray-600">Parish Shop</p>
      </section>

      {/* Event Tickets */}
      <section id="tickets">
        <h2 className="text-2xl font-heading font-bold text-primary mb-4">
          Renginių bilietai / Event Tickets
        </h2>
        <EventTickets />
      </section>

      {/* Community Merchandise */}
      <section id="merchandise">
        <h2 className="text-2xl font-heading font-bold text-primary mb-4">
          Bendruomenės prekės / Community Merchandise
        </h2>
        <CommunityMerchandise />
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
