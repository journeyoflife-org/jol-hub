import { entityConfig } from '@/config/entity';
import { ServiceSchedules, CommunityEvents } from '@/components';
import { Button, Card, CardContent, Badge } from '@jol-hub/ui';

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
          {entityConfig.ecclesiastical.synod} • Founded {entityConfig.ecclesiastical.founded}
        </p>
        <Badge className="mt-4 bg-lutheran-red text-white">
          {entityConfig.ecclesiastical.confession}
        </Badge>
      </section>

      {/* Quick Info Cards */}
      <section className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <h3 className="font-heading text-lg text-primary mb-2">Sekmadienio pamaldos</h3>
            <div className="space-y-1 text-lg">
              <p className="font-medium">10:00</p>
              <p className="font-medium">18:00</p>
            </div>
            <p className="text-sm text-gray-500 mt-2">Pagrindinės pamaldos su Šv. Vakariene</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <h3 className="font-heading text-lg text-primary mb-2">Kunigas</h3>
            <p className="font-medium">{entityConfig.pastor.name}</p>
            <p className="text-sm text-gray-600">{entityConfig.pastor.title}</p>
            <p className="text-sm text-gray-500 mt-1">{entityConfig.pastor.email}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <h3 className="font-heading text-lg text-primary mb-2">Bendruomenė</h3>
            <p className="text-3xl font-bold text-primary">{entityConfig.statistics.congregationMembers}</p>
            <p className="text-sm text-gray-600">narių</p>
            <p className="text-sm text-gray-500 mt-1">{entityConfig.statistics.bibleStudyGroups} Biblijos studijų grupės</p>
          </CardContent>
        </Card>
      </section>

      {/* Service Schedule */}
      <section id="services">
        <ServiceSchedules />
      </section>

      {/* Upcoming Events Preview */}
      <section>
        <h2 className="text-2xl font-heading font-bold text-primary mb-4">
          Būsimi renginiai / Upcoming Events
        </h2>
        <CommunityEvents />
      </section>

      {/* Leadership */}
      <section className="grid md:grid-cols-3 gap-4">
        <h2 className="col-span-full text-2xl font-heading font-bold text-primary mb-4">
          Vadovybė / Leadership
        </h2>
        {entityConfig.leadership.map((leader) => (
          <Card key={leader.id}>
            <CardContent className="p-4">
              <h3 className="font-medium text-primary">{leader.name}</h3>
              <p className="text-sm text-gray-600">{leader.title}</p>
              <p className="text-sm text-gray-500">{leader.titleEn}</p>
              <p className="text-xs text-gray-500 mt-2">{leader.email}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Quick Actions */}
      <section className="flex flex-wrap justify-center gap-4 py-8 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <Button asChild>
          <a href="/shop#tickets">Pirkti renginių bilietus</a>
        </Button>
        <Button variant="outline" asChild>
          <a href="/shop#merchandise">Bendruomenės prekės</a>
        </Button>
        <Button variant="outline" asChild>
          <a href="/events">Visi renginiai</a>
        </Button>
      </section>
    </div>
  );
}
