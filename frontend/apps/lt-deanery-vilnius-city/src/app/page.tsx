import { DeaneryParishDirectory, SharedEventsCalendar } from '@/components';
import { entityConfig } from '@/config/entity';

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl">
        <h1 className="text-4xl font-heading font-bold mb-4">{entityConfig.name.lt}</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">{entityConfig.name.en}</p>
        
        {/* Dean Info */}
        <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow max-w-md mx-auto">
          <p className="text-sm text-gray-500">Dekanas / Dean</p>
          <p className="font-medium text-lg">{entityConfig.dean.name}</p>
          <p className="text-sm text-gray-600">{entityConfig.dean.email}</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 max-w-3xl mx-auto">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-2xl font-bold text-primary">{entityConfig.parishes.length}</p>
            <p className="text-sm text-gray-600">Parapijos</p>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-2xl font-bold text-primary">{entityConfig.statistics.totalPriests}</p>
            <p className="text-sm text-gray-600">Kunigai</p>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-2xl font-bold text-primary">{(entityConfig.statistics.totalParishioners / 1000).toFixed(0)}k</p>
            <p className="text-sm text-gray-600">Parapijiečiai</p>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-2xl font-bold text-primary">{(entityConfig.statistics.totalCatholics / 1000).toFixed(0)}k</p>
            <p className="text-sm text-gray-600">Katalikai</p>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section>
        <h2 className="text-2xl font-heading font-semibold mb-6">Dekanato renginiai</h2>
        <SharedEventsCalendar />
      </section>

      {/* Parish Directory Preview */}
      <section>
        <h2 className="text-2xl font-heading font-semibold mb-6">Dekanato parapijos</h2>
        <DeaneryParishDirectory />
      </section>
    </div>
  );
}
