import { entityConfig } from '@/config/entity';
import { OrthodoxCalendar, ServiceSchedules } from '@/components';
import { Button, Card, CardContent, Badge } from '@jol-hub/ui';

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-8">
        <div className="text-4xl mb-4">☦</div>
        <h1 className="text-4xl font-orthodox font-bold text-primary mb-2">
          {entityConfig.name.lt}
        </h1>
        <p className="text-xl text-gray-600">{entityConfig.name.ru}</p>
        <p className="text-gray-500 mt-2">{entityConfig.name.en}</p>
        <Badge className="mt-4 bg-orthodox-red text-white">
          {entityConfig.ecclesiastical.patriarchate}
        </Badge>
      </section>

      {/* Quick Info Cards */}
      <section className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <h3 className="font-orthodox text-lg text-primary mb-2">Sekmadienio Liturgija</h3>
            <div className="space-y-1 text-lg">
              <p className="font-medium">09:00</p>
              <p className="font-medium">10:30</p>
            </div>
            <p className="text-sm text-gray-500 mt-2">Šv. Liturgija</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <h3 className="font-orthodox text-lg text-primary mb-2">Vyskupas</h3>
            <p className="font-medium">{entityConfig.rector.name}</p>
            <p className="text-sm text-gray-600">{entityConfig.rector.title}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <h3 className="font-orthodox text-lg text-primary mb-2">Parapija</h3>
            <p className="text-3xl font-bold text-primary">{entityConfig.statistics.parishioners.toLocaleString()}</p>
            <p className="text-sm text-gray-600">parapijiečių</p>
          </CardContent>
        </Card>
      </section>

      {/* Orthodox Calendar */}
      <section id="calendar">
        <OrthodoxCalendar />
      </section>

      {/* Service Schedule */}
      <section id="services">
        <ServiceSchedules />
      </section>

      {/* Clergy */}
      <section>
        <h2 className="text-2xl font-orthodox font-bold text-primary mb-4">
          Dvasininkai / Духовенство
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {entityConfig.clergy.map((member) => (
            <Card key={member.id}>
              <CardContent className="p-4 text-center">
                <p className="font-medium text-primary">{member.name}</p>
                <p className="text-sm text-gray-600">{member.title}</p>
                <p className="text-xs text-gray-500">{member.titleEn}</p>
                {member.email && (
                  <p className="text-xs text-gray-500 mt-2">{member.email}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="flex flex-wrap justify-center gap-4 py-8 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <Button asChild>
          <a href="/gallery">Ikonų galerija</a>
        </Button>
        <Button variant="outline" asChild>
          <a href="/shop">Parduotuvė</a>
        </Button>
        <Button variant="outline" asChild>
          <a href="/shop#candles">Užsakyti žvakes</a>
        </Button>
      </section>
    </div>
  );
}
