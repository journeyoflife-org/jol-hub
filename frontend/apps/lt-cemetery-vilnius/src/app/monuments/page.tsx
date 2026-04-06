import type { Metadata } from 'next';
import { MonumentCatalog } from '@/components/MonumentCatalog';

export const metadata: Metadata = {
  title: 'Paminklai | Monuments | Vilniaus Kapinių Tarnyba',
  description: 'Granitiniai, marmuriniai, bronziniai paminklai su individualizacija.',
};

export default function MonumentsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <MonumentCatalog />
    </div>
  );
}
