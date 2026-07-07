import { entityConfig } from '@/config/entity';
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
          {entityConfig.canonical.order} • {entityConfig.canonical.jurisdiction} • Established {entityConfig.canonical.established}
        </p>
      </section>

      {/* Community & Schedule */}
      <section className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <h3 className="font-heading text-lg text-primary mb-2">Bendruomenė</h3>
            <p className="text-3xl font-bold text-primary">{entityConfig.statistics.communityMembers}</p>
            <p className="text-sm text-gray-500">Vienuoliai</p>
            <p className="text-lg font-medium mt-2">{entityConfig.statistics.oblates}</p>
            <p className="text-sm text-gray-500">Oblatai</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <h3 className="font-heading text-lg text-primary mb-2">Sekmadienio Mišios</h3>
            <div className="space-y-1 text-lg">
              <p className="font-medium">07:00</p>
              <p className="font-medium">10:00</p>
            </div>
            <p className="text-sm text-gray-500 mt-2">10:00 - už parapijiečius</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <h3 className="font-heading text-lg text-primary mb-2">Abatas</h3>
            <p className="font-medium">{entityConfig.abbot.name}</p>
            <p className="text-sm text-gray-600">{entityConfig.abbot.title}</p>
          </CardContent>
        </Card>
      </section>

      {/* Monastic Schedule */}
      <section>
        <h2 className="text-2xl font-heading font-bold text-primary mb-4">
          Dienos tvarka / Daily Schedule
        </h2>
        <div className="grid md:grid-cols-4 gap-2">
          {Object.entries(entityConfig.monasticSchedule).map(([key, schedule]) => (
            <div key={key} className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <p className="font-medium capitalize">{key}</p>
              <p className="text-primary">{schedule.time}</p>
              <p className="text-xs text-gray-500">{schedule.location}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Guest House */}
      <section>
        <h2 className="text-2xl font-heading font-bold text-primary mb-4">
          Svečių namai / Guest House
        </h2>
        <Card>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-lg font-medium">{entityConfig.guestHouse.rooms} kambariai</p>
                <p className="text-sm text-gray-600">Kaina: €{entityConfig.guestHouse.rates.perNight}/naktis</p>
                <Badge className="mt-2 bg-liturgical-purple text-white">Rezervacija būtina</Badge>
              </div>
              <div>
                <h4 className="font-medium mb-2">Patogumai:</h4>
                <ul className="text-sm space-y-1">
                  {entityConfig.guestHouse.amenities.map((amenity, i) => (
                    <li key={i}>• {amenity}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Oblation Program */}
      <section>
        <h2 className="text-2xl font-heading font-bold text-primary mb-4">
          Oblacijos programa / Oblation Program
        </h2>
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-600 mb-4">{entityConfig.oblationProgram.description.lt}</p>
            <p className="text-sm text-gray-500 mb-2">{entityConfig.oblationProgram.description.en}</p>
            <p className="text-sm">Ruošiamasi: {entityConfig.oblationProgram.formationPeriod}</p>
            <Button className="mt-4" variant="outline">Sužinoti daugiau</Button>
          </CardContent>
        </Card>
      </section>

      {/* Quick Actions */}
      <section className="flex flex-wrap justify-center gap-4 py-8 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <Button asChild>
          <a href="/retreats">Rekolekcijos</a>
        </Button>
        <Button variant="outline" asChild>
          <a href="/guest-house">Svečių namai</a>
        </Button>
        <Button variant="outline" asChild>
          <a href="/oblation">Oblacija</a>
        </Button>
        <Button variant="outline" asChild>
          <a href="/shop">Parduotuvė</a>
        </Button>
      </section>

      {/* Statistics */}
      <section className="text-center py-8">
        <h2 className="text-2xl font-heading font-bold text-primary mb-6">
          Statistika / Statistics
        </h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-3xl font-bold text-primary">{entityConfig.statistics.communityMembers}</p>
            <p className="text-sm text-gray-600">Bendruomenė</p>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-3xl font-bold text-primary">{entityConfig.statistics.oblates}</p>
            <p className="text-sm text-gray-600">Oblatai</p>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-3xl font-bold text-primary">{entityConfig.statistics.annualRetreats}</p>
            <p className="text-sm text-gray-600">Rekolekcijos per metus</p>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-3xl font-bold text-primary">{entityConfig.statistics.guestNightsPerYear}</p>
            <p className="text-sm text-gray-600">Svečių naktys per metus</p>
          </div>
        </div>
      </section>
    </div>
  );
}
