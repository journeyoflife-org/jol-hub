import { entityConfig } from '@/config/entity';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12 bg-gradient-to-br from-byzantine-blue to-byzantine-purple text-white rounded-lg">
        <h1 className="text-4xl font-byzantine font-bold mb-4">
          ☦ {entityConfig.name.lt}
        </h1>
        <p className="text-xl text-gray-200 mb-2">{entityConfig.name.en}</p>
        <p className="text-lg text-gray-300 mb-6">{entityConfig.name.uk}</p>
        <p className="text-lg max-w-2xl mx-auto">
          Greek Catholic Church in full communion with Rome, serving the Ukrainian and Lithuanian 
          communities in Vilnius through the Byzantine tradition.
        </p>
      </section>

      {/* Divine Liturgy Schedule */}
      <section>
        <h2 className="text-2xl font-byzantine font-bold mb-6 text-byzantine-blue">
          🕊️ Dievo Liturgijos tvarkaraštis / Divine Liturgy Schedule
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {entityConfig.serviceSchedule.map((day) => (
            <div key={day.day} className="liturgy-schedule">
              <h3 className="text-lg font-bold mb-3 text-byzantine-gold">{day.day}</h3>
              <ul className="space-y-2">
                {day.services.map((service) => (
                  <li key={`${service.time}-${service.type}`} className="flex justify-between">
                    <span>{service.nameLt}</span>
                    <span className="text-gray-300">{service.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Sacraments */}
      <section>
        <h2 className="text-2xl font-byzantine font-bold mb-6 text-byzantine-blue">
          ✝️ Sakramentai / Sacraments / Тайнини
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(entityConfig.sacraments).map(([key, sacrament]) => (
            <div key={key} className="bg-white p-4 rounded-lg shadow-md border-l-4 border-byzantine-gold">
              <h3 className="font-bold text-byzantine-red">{sacrament.nameLt}</h3>
              <p className="text-sm text-gray-600">{sacrament.nameEn}</p>
              {'note' in sacrament && sacrament.note && (
                <p className="text-xs text-gray-500 mt-2">{sacrament.note}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Notable Icons */}
      <section>
        <h2 className="text-2xl font-byzantine font-bold mb-6 text-byzantine-blue">
          🖼️ Garbingos Ikonos / Notable Icons
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {entityConfig.notableIcons.map((icon) => (
            <div key={icon.id} className="icon-card">
              <div className="h-48 bg-gradient-to-br from-byzantine-gold to-byzantine-red flex items-center justify-center">
                <span className="text-6xl">☦</span>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-byzantine-blue">{icon.nameLt}</h3>
                <p className="text-sm text-gray-600">{icon.nameEn}</p>
                <p className="text-xs text-gray-500 mt-2">{icon.description}</p>
                <p className="text-xs text-byzantine-purple mt-1">📍 {icon.location}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Link 
            href="/gallery" 
            className="inline-block px-6 py-2 bg-byzantine-blue text-white rounded hover:bg-byzantine-purple transition-colors"
          >
            Žiūrėti galeriją →
          </Link>
        </div>
      </section>

      {/* Online Store Preview */}
      <section>
        <h2 className="text-2xl font-byzantine font-bold mb-6 text-byzantine-blue">
          🕯️ Parduotuvė / Online Store / Магазин
        </h2>
        <div className="grid md:grid-cols-4 gap-4">
          {entityConfig.onlineStore.categories.slice(0, 4).map((category) => (
            <div key={category.id} className="bg-white p-4 rounded-lg shadow text-center hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-2">
                {category.id === 'icons' && '☦'}
                {category.id === 'candles' && '🕯️'}
                {category.id === 'books' && '📖'}
                {category.id === 'vestments' && '👔'}
              </div>
              <h3 className="font-bold">{category.nameLt}</h3>
              <p className="text-sm text-gray-500">{category.nameEn}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Link 
            href="/shop" 
            className="inline-block px-6 py-2 bg-byzantine-red text-white rounded hover:bg-red-800 transition-colors"
          >
            Aplankyti parduotuvę →
          </Link>
        </div>
      </section>

      {/* Clergy */}
      <section>
        <h2 className="text-2xl font-byzantine font-bold mb-6 text-byzantine-blue">
          👔 Dvasininkija / Clergy / Духовенство
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {entityConfig.clergy.map((clergy) => (
            <div key={clergy.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-byzantine-purple rounded-full flex items-center justify-center text-white text-2xl">
                  ☦
                </div>
                <div>
                  <h3 className="font-bold">{clergy.name}</h3>
                  <p className="text-sm text-byzantine-red">{clergy.title} / {clergy.titleEn}</p>
                  {clergy.email && (
                    <p className="text-xs text-gray-500">📧 {clergy.email}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Community Statistics */}
      <section className="bg-gray-100 rounded-lg p-8">
        <h2 className="text-2xl font-byzantine font-bold mb-6 text-center text-byzantine-blue">
          Mūsų Bendruomenė / Our Community
        </h2>
        <div className="grid md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-3xl font-bold text-byzantine-purple">{entityConfig.statistics.parishioners}</p>
            <p className="text-sm text-gray-600">Parapijiečiai / Parishioners</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-byzantine-purple">{entityConfig.statistics.ukrainianCommunity}</p>
            <p className="text-sm text-gray-600">Ukrainiečių bendruomenė / Ukrainian community</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-byzantine-purple">{entityConfig.statistics.averageSundayAttendance}</p>
            <p className="text-sm text-gray-600">Sekmadienio dalyviai / Sunday attendance</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-byzantine-purple">{entityConfig.statistics.clergyCount}</p>
            <p className="text-sm text-gray-600">Dvasininkai / Clergy</p>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="text-center">
        <h2 className="text-2xl font-byzantine font-bold mb-4 text-byzantine-blue">
          Su mumis susisiekite / Contact Us
        </h2>
        <p className="text-gray-600 mb-4">
          📍 {entityConfig.address.street}, {entityConfig.address.postalCode} {entityConfig.address.city}
        </p>
        <p className="text-gray-600 mb-6">
          📞 {entityConfig.contact.phone} | 📧 {entityConfig.contact.email}
        </p>
        <Link 
          href="/contact" 
          className="inline-block px-8 py-3 bg-byzantine-gold text-gray-900 font-bold rounded-lg hover:bg-yellow-500 transition-colors"
        >
          Susisiekti →
        </Link>
      </section>
    </div>
  );
}
