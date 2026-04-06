import { MultiParishDirectory, NewsPortal } from '@/components';
import { entityConfig } from '@/config/entity';

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl">
        <h1 className="text-4xl font-heading font-bold mb-4">{entityConfig.name.lt}</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">{entityConfig.name.en}</p>
        <p className="text-gray-500">{entityConfig.address.street}, {entityConfig.address.city}</p>
        
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8 max-w-4xl mx-auto">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-2xl font-bold text-primary">{entityConfig.statistics.totalParishes}</p>
            <p className="text-sm text-gray-600">Parapijos</p>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-2xl font-bold text-primary">{entityConfig.statistics.totalPriests}</p>
            <p className="text-sm text-gray-600">Kunigai</p>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-2xl font-bold text-primary">{entityConfig.deaneries.length}</p>
            <p className="text-sm text-gray-600">Dekanatai</p>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-2xl font-bold text-primary">{(entityConfig.statistics.catholics / 1000).toFixed(0)}k</p>
            <p className="text-sm text-gray-600">Katalikai</p>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-2xl font-bold text-primary">{entityConfig.canonical.established}</p>
            <p className="text-sm text-gray-600">Įkurta</p>
          </div>
        </div>
      </section>

      {/* News Section */}
      <section>
        <h2 className="text-2xl font-heading font-semibold mb-6">Naujienos</h2>
        <NewsPortal />
      </section>

      {/* Parish Directory Preview */}
      <section>
        <h2 className="text-2xl font-heading font-semibold mb-6">Parapijų sąrašas</h2>
        <MultiParishDirectory />
      </section>
    </div>
  );
}
