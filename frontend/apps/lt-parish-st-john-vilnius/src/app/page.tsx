import { entityConfig } from '@/config/entity';
import { MassSchedules, ParishNews } from '@/components';
import { Button, Badge, Card, CardContent } from '@jol-hub/ui';

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-8">
        <h1 className="text-4xl font-heading font-bold text-primary mb-2">
          {entityConfig.name.lt}
        </h1>
        <p className="text-xl text-gray-600">{entityConfig.name.en}</p>
        <p className="text-gray-500 mt-2">
          {entityConfig.canonical.jurisdiction} • Established {entityConfig.canonical.established}
        </p>
      </section>

      {/* Quick Info Cards */}
      <section className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <h3 className="font-heading text-lg text-primary mb-2">Sekmadienio Mišios</h3>
            <div className="space-y-1 text-lg">
              <p className="font-medium">09:00</p>
              <p className="font-medium">11:00</p>
              <p className="font-medium">18:00</p>
            </div>
            <p className="text-sm text-gray-500 mt-2">11:00 - pagrindinės Mišios</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <h3 className="font-heading text-lg text-primary mb-2">Išpažintis</h3>
            <div className="space-y-1">
              <p className="text-sm">Savaitgaliais: 08:00 - 08:45</p>
              <p className="text-sm">Arba susitarus su kunigu</p>
            </div>
            <Badge className="mt-2 bg-liturgical-purple text-white">Galima sutarti</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <h3 className="font-heading text-lg text-primary mb-2">Parapijos klebonas</h3>
            <p className="font-medium">{entityConfig.pastor.name}</p>
            <p className="text-sm text-gray-600">{entityConfig.pastor.title}</p>
            <p className="text-sm text-gray-500 mt-1">{entityConfig.pastor.email}</p>
          </CardContent>
        </Card>
      </section>

      {/* Mass Schedule */}
      <section id="mass-schedule">
        <MassSchedules />
      </section>

      {/* Sacraments Quick Access */}
      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {entityConfig.sacraments.slice(0, 6).map((sacrament) => (
          <a
            key={sacrament.id}
            href={`/sacraments#${sacrament.id}`}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <h3 className="font-medium text-primary">{sacrament.name}</h3>
            <p className="text-sm text-gray-600">{sacrament.nameEn}</p>
            {sacrament.preparationRequired && (
              <p className="text-xs text-gray-500 mt-1">
                Ruošiamasi {sacrament.preparationDuration}
              </p>
            )}
          </a>
        ))}
      </section>

      {/* Latest News */}
      <section>
        <h2 className="text-2xl font-heading font-bold text-primary mb-4">
          Naujausios naujienos / Latest News
        </h2>
        <ParishNews />
      </section>

      {/* Quick Actions */}
      <section className="flex flex-wrap justify-center gap-4 py-8 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <Button asChild>
          <a href="/shop#mass-intentions">Užsakyti Mišių intenciją</a>
        </Button>
        <Button variant="outline" asChild>
          <a href="/shop#religious-items">Religiniai daiktai</a>
        </Button>
        <Button variant="outline" asChild>
          <a href="/shop#hall-rental">Nuomoti salę</a>
        </Button>
      </section>

      {/* Statistics */}
      <section className="text-center py-8">
        <h2 className="text-2xl font-heading font-bold text-primary mb-6">
          Parapijos statistika / Parish Statistics
        </h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-3xl font-bold text-primary">{entityConfig.statistics.registeredParishioners.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Registruotų parapijiečių</p>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-3xl font-bold text-primary">{entityConfig.statistics.averageSundayAttendance}</p>
            <p className="text-sm text-gray-600">Sekmadienio dalyvių (vid.)</p>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-3xl font-bold text-primary">{entityConfig.statistics.annualBaptisms}</p>
            <p className="text-sm text-gray-600">Krikštai per metus</p>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-3xl font-bold text-primary">{entityConfig.statistics.annualMarriages}</p>
            <p className="text-sm text-gray-600">Santuokos per metus</p>
          </div>
        </div>
      </section>
    </div>
  );
}
