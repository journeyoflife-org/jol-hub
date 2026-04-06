import { SharedEventsCalendar } from '@/components';

export const metadata = {
  title: 'Renginiai | Events - Vilniaus miesto dekanatas',
  description: 'Vilniaus miesto dekanato renginiai',
};

export default function EventsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-heading font-bold mb-2">Dekanato renginiai</h1>
      <p className="text-gray-600 mb-8">Shared Events Calendar</p>
      <SharedEventsCalendar />
    </div>
  );
}
