import { entityConfig } from '@/config/entity';

export const metadata = {
  title: 'Parduotuvė / Shop / Магазин',
};

export default function ShopPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-byzantine font-bold text-byzantine-blue">
        🕯️ Parduotuvė / Shop / Магазин
      </h1>
      
      <p className="text-gray-600">
        Welcome to our online store. We offer Eastern Christian items to support your spiritual journey.
      </p>

      {/* Categories */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {entityConfig.onlineStore.categories.map((category) => (
          <div key={category.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-32 bg-gradient-to-br from-byzantine-blue to-byzantine-purple flex items-center justify-center">
              <span className="text-6xl text-white">
                {category.id === 'icons' && '☦'}
                {category.id === 'candles' && '🕯️'}
                {category.id === 'books' && '📖'}
                {category.id === 'vestments' && '👔'}
                {category.id === 'music' && '🎵'}
                {category.id === 'other' && '📦'}
              </span>
            </div>
            <div className="p-4">
              <h2 className="font-bold text-lg">{category.nameLt}</h2>
              <p className="text-sm text-gray-600">{category.nameEn}</p>
              {category.nameUk && (
                <p className="text-sm text-gray-500">{category.nameUk}</p>
              )}
              <button className="mt-3 w-full py-2 bg-byzantine-gold text-gray-900 rounded hover:bg-yellow-500 transition-colors text-sm font-medium">
                Peržiūrėti / View
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Candles Section */}
      <section className="bg-gray-100 rounded-lg p-6">
        <h2 className="text-2xl font-byzantine font-bold mb-4 text-byzantine-red">
          🕯️ Žvakės / Candles / Свічки
        </h2>
        <div className="grid md:grid-cols-5 gap-4">
          {entityConfig.candleTypes.map((candle) => (
            <div key={candle.id} className="bg-white p-4 rounded shadow text-center">
              <div className="text-4xl mb-2">🕯️</div>
              <h3 className="font-bold">{candle.nameLt}</h3>
              <p className="text-xs text-gray-500">{candle.nameEn}</p>
              <p className="text-sm text-byzantine-purple mt-2">€{candle.price.toFixed(2)}</p>
              <p className="text-xs text-gray-400">{candle.burnTime}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Event Tickets */}
      <section>
        <h2 className="text-2xl font-byzantine font-bold mb-4 text-byzantine-blue">
          🎫 Renginių bilietai / Event Tickets
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {entityConfig.events.map((event) => (
            <div key={event.id} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-bold text-lg">{event.name}</h3>
              <p className="text-sm text-gray-600">{event.nameLt}</p>
              <p className="text-sm text-gray-500">{event.nameUk}</p>
              <div className="mt-4 text-sm text-gray-600">
                <p>📅 {event.date}</p>
                <p>📍 {event.location}</p>
                <p className="text-byzantine-red font-bold mt-2">€{event.ticketPrice.toFixed(2)}</p>
              </div>
              <button className="mt-4 w-full py-2 bg-byzantine-red text-white rounded hover:bg-red-800 transition-colors">
                Pirkti bilietą / Buy Ticket
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Payment Methods */}
      <section className="bg-byzantine-blue text-white rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Mokėjimo būdai / Payment Methods</h2>
        <div className="flex gap-4">
          {entityConfig.onlineStore.paymentMethods.map((method) => (
            <span key={method} className="px-4 py-2 bg-white/20 rounded">
              {method === 'cash' && '💵 Cash'}
              {method === 'bank_transfer' && '🏦 Bank Transfer'}
              {method === 'stripe' && '💳 Card (Stripe)'}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
