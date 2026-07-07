'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';
import { entityConfig, type SacramentInfo } from '@/config/entity';

export interface SacramentsProps {
  sacraments?: SacramentInfo[];
  onSacramentSelect?: (sacrament: SacramentInfo) => void;
  className?: string;
}

const sacramentIcons: Record<string, string> = {
  baptism: '💧',
  'first-communion': '🍞',
  confirmation: '🕊️',
  marriage: '💍',
  confession: '✝️',
  anointing: '🙏',
};

export function Sacraments({
  sacraments = entityConfig.sacraments,
  onSacramentSelect,
  className,
}: SacramentsProps) {
  const [selectedSacrament, setSelectedSacrament] = useState<string | null>(null);
  const [expandedSacrament, setExpandedSacrament] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedSacrament(expandedSacrament === id ? null : id);
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-heading">Sakramentai</CardTitle>
        <p className="text-sm text-gray-600">Sacraments</p>
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-4">
          {sacraments.map((sacrament) => (
            <div
              key={sacrament.id}
              className={cn(
                'border rounded-lg overflow-hidden transition-all',
                expandedSacrament === sacrament.id
                  ? 'border-primary shadow-md'
                  : 'border-gray-200 dark:border-gray-700'
              )}
            >
              {/* Header */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => toggleExpand(sacrament.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{sacramentIcons[sacrament.id] || '✝️'}</span>
                    <div>
                      <h3 className="font-medium text-primary">{sacrament.name}</h3>
                      <p className="text-sm text-gray-600">{sacrament.nameEn}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {sacrament.preparationRequired && (
                      <Badge variant="secondary" className="text-xs">
                        Ruošiamasi / Preparation
                      </Badge>
                    )}
                    <span className="text-gray-400">
                      {expandedSacrament === sacrament.id ? '▲' : '▼'}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">{sacrament.description}</p>
              </div>

              {/* Expanded Content */}
              {expandedSacrament === sacrament.id && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t">
                  {sacrament.preparationRequired && sacrament.preparationDuration && (
                    <div className="mb-4">
                      <Badge className="bg-liturgical-purple text-white">
                        Parengiamasis laikotarpis: {sacrament.preparationDuration}
                      </Badge>
                    </div>
                  )}

                  <h4 className="font-medium mb-2">Reikalavimai / Requirements:</h4>
                  <ul className="list-disc list-inside space-y-1 mb-4 text-sm">
                    {sacrament.requirements.map((req, index) => (
                      <li key={index} className="text-gray-600 dark:text-gray-400">
                        {req}
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-500">Kontaktai / Contact:</p>
                      <p className="font-medium">{sacrament.contact}</p>
                    </div>
                    <Button onClick={() => onSacramentSelect?.(sacrament)}>
                      Registruotis / Register
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default Sacraments;
