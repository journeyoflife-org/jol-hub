import { DeaneryParishDirectory } from '@/components';

export const metadata = {
  title: 'Parapijos | Parishes - Vilniaus miesto dekanatas',
  description: 'Vilniaus miesto dekanato parapijų sąrašas',
};

export default function DirectoryPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-heading font-bold mb-2">Dekanato parapijos</h1>
      <p className="text-gray-600 mb-8">Deanery Parish Directory</p>
      <DeaneryParishDirectory />
    </div>
  );
}
