import { DiocesanEventsCalendar } from '@/components';

export const metadata = {
  title: 'Renginiai | Events - Kauno Arkikatedra',
  description: 'Kauno arkivyskupijos renginiai - Diocesan events calendar',
};

export default function EventsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-heading font-bold mb-2">Arkivyskupijos renginiai</h1>
      <p className="text-gray-600 mb-8">Diocesan Events Calendar</p>
      <DiocesanEventsCalendar />
    </div>
  );
}
