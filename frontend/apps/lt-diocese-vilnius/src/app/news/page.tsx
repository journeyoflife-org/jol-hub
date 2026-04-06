import { NewsPortal } from '@/components';

export const metadata = {
  title: 'Naujienos | News - Vilniaus Arkivyskupija',
  description: 'Vilniaus arkivyskupijos naujienos - Archdiocese news and announcements',
};

export default function NewsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-heading font-bold mb-2">Naujienos</h1>
      <p className="text-gray-600 mb-8">Archdiocese News</p>
      <NewsPortal />
    </div>
  );
}
