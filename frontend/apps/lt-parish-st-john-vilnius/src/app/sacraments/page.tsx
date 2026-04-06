import { Sacraments } from '@/components';
import { entityConfig } from '@/config/entity';

export default function SacramentsPage() {
  return (
    <div className="space-y-8">
      <section className="text-center py-4">
        <h1 className="text-3xl font-heading font-bold text-primary mb-2">
          Sakramentai
        </h1>
        <p className="text-xl text-gray-600">Sacraments</p>
      </section>

      <Sacraments />

      {/* Staff Contacts */}
      <section className="mt-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h2 className="text-xl font-heading font-bold text-primary mb-4">
          Kunigai / Clergy
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-white dark:bg-gray-700 rounded-lg">
            <h3 className="font-medium text-primary">{entityConfig.pastor.name}</h3>
            <p className="text-sm text-gray-600">{entityConfig.pastor.title}</p>
            <p className="text-sm text-gray-500">{entityConfig.pastor.email}</p>
          </div>
          {entityConfig.staff
            .filter((s) => s.role === 'associate' || s.role === 'deacon')
            .map((member) => (
              <div key={member.id} className="p-4 bg-white dark:bg-gray-700 rounded-lg">
                <h3 className="font-medium text-primary">{member.name}</h3>
                <p className="text-sm text-gray-600">{member.title}</p>
                <p className="text-sm text-gray-500">{member.email}</p>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
