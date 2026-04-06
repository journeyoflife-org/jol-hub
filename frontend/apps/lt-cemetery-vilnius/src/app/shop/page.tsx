import type { Metadata } from 'next';
import { use } from 'react';
import Link from 'next/link';
import { ServiceCatalog } from '@/components/ServiceCatalog';
import { FlowerDelivery } from '@/components/FlowerDelivery';

export const metadata: Metadata = {
  title: 'Paslaugos | Services | Vilniaus Kapinių Tarnyba',
  description: 'Kapinių paslaugos, gėlių pristatymas.',
};

export default function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = use(searchParams);
  const activeTab = (params?.tab as string) || 'services';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Tab Navigation */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        <Link
          href="/shop?tab=services"
          className={`px-4 py-2 rounded-lg whitespace-nowrap ${
            activeTab === 'services'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📋 Paslaugos
        </Link>
        <Link
          href="/shop?tab=flowers"
          className={`px-4 py-2 rounded-lg whitespace-nowrap ${
            activeTab === 'flowers'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          💐 Gėlių pristatymas
        </Link>
      </div>

      {/* Content */}
      {activeTab === 'services' && <ServiceCatalog />}
      {activeTab === 'flowers' && <FlowerDelivery />}
    </div>
  );
}
