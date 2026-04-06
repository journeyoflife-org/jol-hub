import type { Metadata } from 'next';
import { use } from 'react';
import Link from 'next/link';
import { ServicePackages } from '@/components/ServicePackages';
import { Caskets } from '@/components/Caskets';
import { MemorialProducts } from '@/components/MemorialProducts';

export const metadata: Metadata = {
  title: 'Parduotuvė | Shop | Vilniaus Laidojimo Namai',
  description: 'Laidotuvių paketai, karstai, atminimo gaminiai.',
};

export default function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = use(searchParams);
  const activeTab = (params?.tab as string) || 'packages';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Tab Navigation */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        <Link
          href="/shop?tab=packages"
          className={`px-4 py-2 rounded-lg whitespace-nowrap ${
            activeTab === 'packages'
              ? 'bg-memorial-navy text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📦 Paslaugų paketai
        </Link>
        <Link
          href="/shop?tab=caskets"
          className={`px-4 py-2 rounded-lg whitespace-nowrap ${
            activeTab === 'caskets'
              ? 'bg-memorial-navy text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          ⚰️ Karstai
        </Link>
        <Link
          href="/shop?tab=memorial"
          className={`px-4 py-2 rounded-lg whitespace-nowrap ${
            activeTab === 'memorial'
              ? 'bg-memorial-navy text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          🕯️ Atminimo gaminiai
        </Link>
      </div>

      {/* Content */}
      {activeTab === 'packages' && <ServicePackages />}
      {activeTab === 'caskets' && <Caskets />}
      {activeTab === 'memorial' && <MemorialProducts />}
    </div>
  );
}
