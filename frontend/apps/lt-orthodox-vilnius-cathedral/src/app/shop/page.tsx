import { IconsStore, OrthodoxItems, CandleOrders } from '@/components';

export default function ShopPage() {
  return (
    <div className="space-y-12">
      <section className="text-center py-4">
        <div className="text-4xl mb-2">☦</div>
        <h1 className="text-3xl font-orthodox font-bold text-primary mb-2">
          Katedros parduotuvė
        </h1>
        <p className="text-xl text-gray-600">Кафедральный магазин / Cathedral Shop</p>
      </section>

      {/* Candle Orders */}
      <section id="candles">
        <h2 className="text-2xl font-orthodox font-bold text-primary mb-4">
          Žvakės / Свечи / Candles
        </h2>
        <CandleOrders />
      </section>

      {/* Icons Store */}
      <section id="icons">
        <h2 className="text-2xl font-orthodox font-bold text-primary mb-4">
          Ikonos / Иконы / Icons
        </h2>
        <IconsStore />
      </section>

      {/* Orthodox Items */}
      <section id="items">
        <h2 className="text-2xl font-orthodox font-bold text-primary mb-4">
          Stačiatikių prekės / Православные товары / Orthodox Items
        </h2>
        <OrthodoxItems />
      </section>

      {/* Payment Methods */}
      <section className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h2 className="text-lg font-medium text-primary mb-4">
          Mokėjimo būdai / Способы оплаты / Payment Methods
        </h2>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💵</span>
            <span>Grynaisiais katedroje / Наличными в соборе / Cash at cathedral</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏦</span>
            <span>Banko pavedimu / Банковским переводом / Bank transfer</span>
          </div>
        </div>
      </section>
    </div>
  );
}
