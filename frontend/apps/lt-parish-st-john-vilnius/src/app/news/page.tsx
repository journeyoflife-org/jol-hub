import { ParishNews } from '@/components';

export default function NewsPage() {
  return (
    <div className="space-y-8">
      <section className="text-center py-4">
        <h1 className="text-3xl font-heading font-bold text-primary mb-2">
          Parapijos naujienos
        </h1>
        <p className="text-xl text-gray-600">Parish News</p>
      </section>

      <ParishNews />

      {/* Newsletter Subscription */}
      <section className="p-6 bg-liturgical-purple/10 rounded-lg text-center">
        <h2 className="text-xl font-heading font-bold text-primary mb-2">
          Prenumeruokite naujienas
        </h2>
        <p className="text-gray-600 mb-4">Subscribe to our newsletter</p>
        <div className="flex max-w-md mx-auto gap-2">
          <input
            type="email"
            placeholder="El. paštas / Email"
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors">
            Prenumeruoti
          </button>
        </div>
      </section>
    </div>
  );
}
