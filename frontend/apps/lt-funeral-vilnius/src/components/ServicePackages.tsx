'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';
import { entityConfig, type ServicePackage } from '@/config/entity';

export interface ServicePackagesProps {
  packages?: ServicePackage[];
  onSelect?: (pkg: ServicePackage) => void;
  className?: string;
}

const typeColors: Record<string, string> = {
  basic: 'bg-gray-100 text-gray-800',
  traditional: 'bg-blue-100 text-blue-800',
  premium: 'bg-memorial-gold/20 text-memorial-navy',
  cremation: 'bg-amber-100 text-amber-800',
};

const typeLabels: Record<string, { lt: string; en: string }> = {
  basic: { lt: 'Pagrindinis', en: 'Basic' },
  traditional: { lt: 'Tradicinis', en: 'Traditional' },
  premium: { lt: 'Premium', en: 'Premium' },
  cremation: { lt: 'Kremavimas', en: 'Cremation' },
};

export function ServicePackages({
  packages = entityConfig.servicePackages,
  onSelect,
  className,
}: ServicePackagesProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const filteredPackages = packages.filter(
    (pkg) => !selectedType || pkg.type === selectedType
  );

  const types = [...new Set(packages.map((p) => p.type))];

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-heading">Laidotuvių paketai</CardTitle>
        <p className="text-sm text-gray-600">Funeral Service Packages</p>

        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            variant={selectedType === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType(null)}
          >
            Visi ({packages.length})
          </Button>
          {types.map((type) => (
            <Button
              key={type}
              variant={selectedType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType(type)}
            >
              {typeLabels[type]?.lt}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-4">
          {filteredPackages.map((pkg) => (
            <div
              key={pkg.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              <div className="p-4 bg-gray-50 dark:bg-gray-800">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-heading text-xl text-primary">{pkg.name}</h3>
                    <p className="text-sm text-gray-600">{pkg.nameEn}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-memorial-navy">€{pkg.price.toLocaleString()}</p>
                    <Badge className={typeColors[pkg.type]}>
                      {typeLabels[pkg.type]?.lt}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{pkg.description}</p>
              </div>

              <div className="p-4">
                <h4 className="font-medium mb-2">Įtraukta / Includes:</h4>
                <ul className="space-y-1">
                  {pkg.includes.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-memorial-gold">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex gap-2">
                  <Button onClick={() => onSelect?.(pkg)}>
                    Pasirinkti / Select
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={`/shop?package=${pkg.id}`}>Daugiau informacijos</a>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default ServicePackages;
