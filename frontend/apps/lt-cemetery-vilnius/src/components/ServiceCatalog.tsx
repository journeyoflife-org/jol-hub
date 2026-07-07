'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';
import { entityConfig, type CemeteryService } from '@/config/entity';

export interface ServiceCatalogProps {
  services?: CemeteryService[];
  onSelect?: (service: CemeteryService) => void;
  className?: string;
}

const categoryIcons: Record<string, string> = {
  burial: '⚰️',
  cremation: '🔥',
  maintenance: '🧹',
  memorial: '🏛️',
};

const categoryLabels: Record<string, { lt: string; en: string }> = {
  burial: { lt: 'Laidojimas', en: 'Burial' },
  cremation: { lt: 'Kremavimas', en: 'Cremation' },
  maintenance: { lt: 'Priežiūra', en: 'Maintenance' },
  memorial: { lt: 'Memorialai', en: 'Memorials' },
};

export function ServiceCatalog({
  services = entityConfig.services,
  onSelect,
  className,
}: ServiceCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredServices = services.filter(
    (s) => !selectedCategory || s.category === selectedCategory
  );

  const categories = [...new Set(services.map((s) => s.category))];

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-heading">Paslaugų katalogas</CardTitle>
        <p className="text-sm text-gray-600">Service Catalog</p>

        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            Visi ({services.length})
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
            >
              {categoryIcons[cat]} {categoryLabels[cat]?.lt}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="grid md:grid-cols-2 gap-4">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3 mb-2">
                <span className="text-2xl">{categoryIcons[service.category]}</span>
                <div className="flex-1">
                  <h3 className="font-heading text-lg text-primary">{service.name}</h3>
                  <p className="text-sm text-gray-600">{service.nameEn}</p>
                </div>
                <Badge className="bg-primary text-white">
                  €{service.price}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-3">{service.description}</p>
              <Button size="sm" onClick={() => onSelect?.(service)}>
                Užsakyti / Order
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default ServiceCatalog;
