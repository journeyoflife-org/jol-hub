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
          Piligrimystės vieta • {entityConfig.canonical.jurisdiction} • Established {entityConfig.canonical.established}
        </p>
      </section>

      {/* Shrine Info */}
      <section className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <h3 className="font-heading text-lg text-primary mb-2">Šventovė</h3>
            <p className="text-sm text-gray-600 mb-2">{entityConfig.shrineInfo.famousFor.lt}</p>
            <p className="text-xs text-gray-500">{entityConfig.shrineInfo.famousFor.en}</p>
            <Badge className="mt-2 bg-liturgical-gold text-primary">Piligrimystės vieta</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <h3 className="font-heading text-lg text-primary mb-2">Sekmadienio Mišios</h3>
            <div className="space-y-1 text-sm">
              <p>07:00, 08:00 (lenkų k.), 09:00 (rusų k.)</p>
              <p className="font-medium">11:00 (pagrindinės)</p>
              <p>17:30</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <h3 className="font-heading text-lg text-primary mb-2">Išpažintis</h3>
            <p className="text-sm">Darbo dienomis: 07:30-10:00, 16:00-18:00</p>
            <p className="text-sm">Savaitgaliais: 07:30-12:00, 16:00-18:00</p>
            <Badge className="mt-2 bg-liturgical-purple text-white">Kalbos: LT, EN, PL, RU</Badge>
          </CardContent>
        </Card>
      </section>

      {/* Mass Schedule */}
      <section id="mass-schedule">
        <h2 className="text-2xl font-heading font-bold text-primary mb-4">
          Mišių tvarkaraštis / Mass Schedule
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Diena</th>
                <th className="text-left py-2">Laikas</th>
                <th className="text-left py-2">Pastabos</th>
              </tr>
            </thead>
            <tbody>
              {entityConfig.massSchedule.map((schedule, i) => (
                <tr key={i} className="border-b">
                  <td className="py-2">{schedule.day}</td>
                  <td className="py-2">{schedule.times.join(', ')}</td>
                  <td className="py-2 text-sm text-gray-600">{schedule.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Candle Services */}
      <section>
        <h2 className="text-2xl font-heading font-bold text-primary mb-4">
          Žvakės / Candles
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {entityConfig.candleServices.types.map((candle, i) => (
            <Card key={i}>
              <CardContent className="p-4 text-center">
                <h3 className="font-medium">{candle.nameLt}</h3>
                <p className="text-sm text-gray-600">{candle.nameEn}</p>
                <p className="text-xl font-bold text-primary mt-2">€{candle.price}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="flex flex-wrap justify-center gap-4 py-8 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <Button asChild>
          <a href="/candles">Žvakės</a>
        </Button>
        <Button variant="outline" asChild>
          <a href="/pilgrimage">Piligrimystė</a>
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
            <p className="text-3xl font-bold text-primary">{entityConfig.statistics.annualPilgrims.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Piligrimai per metus</p>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-3xl font-bold text-primary">{entityConfig.statistics.dailyVisitors}</p>
            <p className="text-sm text-gray-600">Dienos lankytojai</p>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-3xl font-bold text-primary">{entityConfig.statistics.annualCandlesSold.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Žvakės per metus</p>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-3xl font-bold text-primary">{entityConfig.statistics.sundayMassAttendance}</p>
            <p className="text-sm text-gray-600">Sekmadienio dalyviai</p>
          </div>
        </div>
      </section>
    </div>
  );
}
