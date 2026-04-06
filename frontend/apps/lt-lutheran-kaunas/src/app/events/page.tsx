import { CommunityEvents } from '@/components';

export default function EventsPage() {
  return (
    <div className="space-y-8">
      <section className="text-center py-4">
        <h1 className="text-3xl font-heading font-bold text-primary mb-2">
          Bendruomenės renginiai
        </h1>
        <p className="text-xl text-gray-600">Community Events</p>
      </section>

      <CommunityEvents />

      {/* Volunteer Sign-up */}
      <section className="p-6 bg-lutheran-gold/10 rounded-lg text-center">
        <h2 className="text-xl font-heading font-bold text-primary mb-2">
          Tapkite savanoriu
        </h2>
        <p className="text-gray-600 mb-4">Become a volunteer and help organize our community events</p>
        <a
          href="mailto:info@kaunaslutheran.lt?subject=Savanorystė"
          className="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Susisiekti / Contact Us
        </a>
      </section>
    </div>
  );
}
