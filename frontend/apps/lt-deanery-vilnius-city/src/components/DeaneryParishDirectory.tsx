'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';
import { entityConfig, type ParishInDeanery } from '@/config/entity';

export interface DeaneryParishDirectoryProps {
  parishes?: ParishInDeanery[];
  onParishSelect?: (parish: ParishInDeanery) => void;
  className?: string;
}

const typeLabels: Record<string, { lt: string; en: string }> = {
  parish: { lt: 'Parapija', en: 'Parish' },
  chapel: { lt: 'Koplyčia', en: 'Chapel' },
  shrine: { lt: 'Šventovė', en: 'Shrine' },
};

const typeColors: Record<string, string> = {
  parish: 'bg-blue-100 text-blue-800',
  chapel: 'bg-gray-100 text-gray-800',
  shrine: 'bg-amber-100 text-amber-800',
};

export function DeaneryParishDirectory({
  parishes = entityConfig.parishes,
  onParishSelect,
  className,
}: DeaneryParishDirectoryProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedParish, setExpandedParish] = useState<string | null>(null);

  const filteredParishes = parishes.filter((parish) => {
    const matchesType = !selectedType || parish.type === selectedType;
    const matchesSearch = !searchQuery ||
      parish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      parish.nameEn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const types = [...new Set(parishes.map((p) => p.type))];

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle className="text-2xl font-heading">Dekanato parapijos</CardTitle>
            <p className="text-sm text-gray-600">Deanery Parish Directory</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Dekanas:</p>
            <p className="font-medium">{entityConfig.dean.name}</p>
          </div>
        </div>

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

        {/* Type Filter */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Button variant={selectedType === null ? 'default' : 'outline'} size="sm" onClick={() => setSelectedType(null)}>
            Visi ({parishes.length})
          </Button>
          {types.map((type) => (
            <Button
              key={type}
              variant={selectedType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType(type)}
            >
              {typeLabels[type]?.lt} ({parishes.filter((p) => p.type === type).length})
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-4">
          {filteredParishes.map((parish) => (
            <div
              key={parish.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              <div
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                onClick={() => setExpandedParish(expandedParish === parish.id ? null : parish.id)}
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

                <div className="flex gap-4 text-sm text-gray-600">
                  <span>📍 {parish.address.street}</span>
                  <span>📞 {parish.contact.phone}</span>
                </div>

                <p className="text-sm text-gray-500 mt-2">Klebonas: {parish.pastor}</p>
              </div>

              {/* Expanded Details */}
              {expandedParish === parish.id && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Mišių laikai</h4>
                      <div className="space-y-1 text-sm">
                        <p><strong>Darbo dienomis:</strong> {parish.massSchedule.weekdays.join(', ')}</p>
                        <p><strong>Savaitgaliais:</strong> {parish.massSchedule.weekends.join(', ')}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Kontaktai</h4>
                      <div className="space-y-1 text-sm">
                        <p>📧 {parish.contact.email}</p>
                        <p>📞 {parish.contact.phone}</p>
                        <p>📍 {parish.address.postalCode} {parish.address.city}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button size="sm" onClick={() => onParishSelect?.(parish)}>
                      Daugiau informacijos
                    </Button>
                    {parish.website && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={parish.website} target="_blank" rel="noopener noreferrer">
                          Tinklalapis
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )}
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

export default DeaneryParishDirectory;
