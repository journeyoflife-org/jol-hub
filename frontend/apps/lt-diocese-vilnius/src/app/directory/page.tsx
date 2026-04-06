import { MultiParishDirectory } from '@/components';

export const metadata = {
  title: 'Parapijų sąrašas | Parish Directory - Vilniaus Arkivyskupija',
  description: 'Vilniaus arkivyskupijos parapijų sąrašas - Complete parish directory',
};

export default function DirectoryPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-heading font-bold mb-2">Parapijų sąrašas</h1>
      <p className="text-gray-600 mb-8">Multi-Parish Directory</p>
      <MultiParishDirectory />
    </div>
  );
}
