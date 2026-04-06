import { DiocesanEventsCalendar, BishopsMessages, CathedralHeritage } from '@/components';
import { entityConfig } from '@/config/entity';

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl">
        <h1 className="text-4xl font-heading font-bold mb-4">{entityConfig.name.lt}</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">{entityConfig.name.en}</p>
        <p className="text-gray-500">{entityConfig.address.street}, {entityConfig.address.city}</p>
        <div className="mt-6 flex justify-center gap-4">
          <a href="/donate" className="px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity">Aukoti / Donate</a>
          <a href="/heritage" className="px-6 py-3 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors">Naudoti / Explore</a>
        </div>
      </section>

      {/* Events Section */}
      <section>
        <h2 className="text-2xl font-heading font-semibold mb-6">Arkivyskupijos renginiai</h2>
        <DiocesanEventsCalendar />
      </section>

      {/* Bishop's Messages Section */}
      <section>
        <h2 className="text-2xl font-heading font-semibold mb-6">Arkivyskupo pranešimai</h2>
        <BishopsMessages />
      </section>

      {/* Heritage Section */}
      <section>
        <h2 className="text-2xl font-heading font-semibold mb-6">Katedros paveldas</h2>
        <CathedralHeritage />
      </section>

      {/* Contact Section */}
      <section className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8">
        <h2 className="text-2xl font-heading font-semibold mb-4">Kontaktai</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="font-medium">{entityConfig.contact.email}</p>
            <p className="text-gray-600">{entityConfig.contact.phone}</p>
            <p className="text-gray-600">{entityConfig.contact.website}</p>
          </div>
          <div>
            <p className="text-gray-600">{entityConfig.address.street}</p>
            <p className="text-gray-600">{entityConfig.address.postalCode} {entityConfig.address.city}</p>
            <p className="text-gray-600">{entityConfig.address.country}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
