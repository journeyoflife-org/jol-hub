'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';
import { entityConfig, type ParishInfo, type DeaneryInfo } from '@/config/entity';

export interface MultiParishDirectoryProps {
  parishes?: ParishInfo[];
  deaneries?: DeaneryInfo[];
  onParishSelect?: (parish: ParishInfo) => void;
  className?: string;
}

const defaultParishes: ParishInfo[] = [
  { id: 'p-1', name: 'Vilniaus Šv. Jonų bažnyčia', nameEn: 'St. Johns Church Vilnius', type: 'parish', deanery: 'd-1', address: { street: 'Šv. Jono g. 12', city: 'Vilnius', postalCode: '01141' }, contact: { email: 'jonai@vilnius.lt', phone: '+370 5 261 5454' } },
  { id: 'p-2', name: 'Vilniaus Arkikatedra', nameEn: 'Vilnius Cathedral', type: 'cathedral', deanery: 'd-1', address: { street: 'Katedros a. 1', city: 'Vilnius', postalCode: '01143' }, contact: { email: 'katedra@vilnius.lt', phone: '+370 5 261 0744' } },
  { id: 'p-3', name: 'Trakų Šv. Onos bažnyčia', nameEn: 'St. Anne Church Trakai', type: 'parish', deanery: 'd-3', address: { street: 'Karaimų g. 3', city: 'Trakai', postalCode: '21142' }, contact: { email: 'trakai@vilnius.lt', phone: '+370 528 52456' } },
  { id: 'p-4', name: 'Aušros Vartai', nameEn: 'Gate of Dawn', type: 'shrine', deanery: 'd-1', address: { street: 'Aušros Vartų g. 12', city: 'Vilnius', postalCode: '01141' }, contact: { email: 'ausros@vilnius.lt', phone: '+370 5 261 1234' } },
  { id: 'p-5', name: 'Šv. Kazimiero bažnyčia', nameEn: 'St. Casimir Church', type: 'parish', deanery: 'd-1', address: { street: 'Didžioji g. 34', city: 'Vilnius', postalCode: '01141' }, contact: { email: 'kazimieras@vilnius.lt', phone: '+370 5 262 3456' } },
];

const typeLabels: Record<string, { lt: string; en: string }> = {
  parish: { lt: 'Parapija', en: 'Parish' },
  chapel: { lt: 'Koplyčia', en: 'Chapel' },
  shrine: { lt: 'Šventovė', en: 'Shrine' },
  cathedral: { lt: 'Katedra', en: 'Cathedral' },
};

const typeColors: Record<string, string> = {
  parish: 'bg-blue-100 text-blue-800',
  chapel: 'bg-gray-100 text-gray-800',
  shrine: 'bg-amber-100 text-amber-800',
  cathedral: 'bg-purple-100 text-purple-800',
};

export function MultiParishDirectory({ 
  parishes = defaultParishes, 
  deaneries = entityConfig.deaneries,
  onParishSelect,
  className 
}: MultiParishDirectoryProps) {
  const [selectedDeanery, setSelectedDeanery] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const filteredParishes = parishes.filter((parish) => {
    const matchesDeanery = !selectedDeanery || parish.deanery === selectedDeanery;
    const matchesType = !selectedType || parish.type === selectedType;
    const matchesSearch = !searchQuery || 
      parish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      parish.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      parish.address.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDeanery && matchesType && matchesSearch;
  });

  const deaneryName = (deaneryId: string) => {
    const deanery = deaneries.find(d => d.id === deaneryId);
    return deanery?.name || deaneryId;
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-heading">Parapijų sąrašas</CardTitle>
        <p className="text-sm text-gray-600">Multi-Parish Directory</p>
        
        {/* Search */}
        <div className="mt-4">
          <input
            type="text"
            placeholder="Ieškoti parapijos... / Search parishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Deanery Filter */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Button variant={selectedDeanery === null ? 'default' : 'outline'} size="sm" onClick={() => setSelectedDeanery(null)}>
            Visi dekanatai
          </Button>
          {deaneries.map((deanery) => (
            <Button
              key={deanery.id}
              variant={selectedDeanery === deanery.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDeanery(deanery.id)}
            >
              {deanery.name}
            </Button>
          ))}
        </div>

        {/* Type Filter */}
        <div className="flex flex-wrap gap-2 mt-2">
          <Button variant={selectedType === null ? 'default' : 'outline'} size="sm" onClick={() => setSelectedType(null)}>
            Visi tipai
          </Button>
          {Object.entries(typeLabels).map(([key, labels]) => (
            <Button
              key={key}
              variant={selectedType === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType(key)}
            >
              {labels.lt}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{entityConfig.statistics.totalParishes}</p>
            <p className="text-sm text-gray-600">Parapijos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{entityConfig.statistics.totalPriests}</p>
            <p className="text-sm text-gray-600">Kunigai</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{deaneries.length}</p>
            <p className="text-sm text-gray-600">Dekanatai</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{entityConfig.statistics.catholics.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Katalikai</p>
          </div>
        </div>

        {/* Parish List */}
        <div className="space-y-3">
          {filteredParishes.map((parish) => (
            <div
              key={parish.id}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              onClick={() => onParishSelect?.(parish)}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium text-primary">{parish.name}</h3>
                  <p className="text-sm text-gray-600">{parish.nameEn}</p>
                </div>
                <Badge className={typeColors[parish.type]}>
                  {typeLabels[parish.type]?.lt}
                </Badge>
              </div>
              
              <div className="text-sm text-gray-600 space-y-1">
                <p>📍 {parish.address.street}, {parish.address.city}</p>
                <p>📧 {parish.contact.email}</p>
                <p>📞 {parish.contact.phone}</p>
              </div>
              
              <div className="mt-2">
                <Badge variant="secondary">{deaneryName(parish.deanery)}</Badge>
              </div>
            </div>
          ))}

          {filteredParishes.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>Parapijų nerasta.</p>
              <p className="text-sm">No parishes found.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default MultiParishDirectory;
