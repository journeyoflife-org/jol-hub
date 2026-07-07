'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';

export interface HeritageItem {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  period: string;
  type: 'architecture' | 'art' | 'history' | 'relic' | 'organ';
}

export interface CathedralHeritageProps {
  items?: HeritageItem[];
  className?: string;
}

const heritageTypeIcons: Record<string, string> = {
  architecture: '🏛️',
  art: '🎨',
  history: '📜',
  relic: '✝️',
  organ: '🎵',
};

const heritageTypeLabels: Record<string, { lt: string; en: string }> = {
  architecture: { lt: 'Architektūra', en: 'Architecture' },
  art: { lt: 'Menas', en: 'Art' },
  history: { lt: 'Istorija', en: 'History' },
  relic: { lt: 'Relikvijos', en: 'Relics' },
  organ: { lt: 'Vargonai', en: 'Organ' },
};

const defaultHeritageItems: HeritageItem[] = [
  {
    id: '1',
    title: 'Katedros istorija',
    titleEn: 'Cathedral History',
    description: 'Kauno arkikatedra bazilija - vienas iš didžiausių neogotikos stiliaus pastatų Lietuvoje.',
    period: '1650 - dabar',
    type: 'history',
  },
  {
    id: '2',
    title: 'Vargonai',
    titleEn: 'The Organ',
    description: 'Katedros vargonai - vieni didžiausių Lietuvoje su daugiau nei 3000 vamzdžių.',
    period: '1883',
    type: 'organ',
  },
  {
    id: '3',
    title: 'Vitražai',
    titleEn: 'Stained Glass Windows',
    description: 'Katedros vitražai vaizduoja šventuosius ir biblines scenas.',
    period: 'XIX-XX a.',
    type: 'art',
  },
  {
    id: '4',
    title: 'Neogotikos architektūra',
    titleEn: 'Neo-Gothic Architecture',
    description: 'Pastatas pastatytas neogotikos stiliumi su smailiaarkiais langais.',
    period: 'XIX a.',
    type: 'architecture',
  },
  {
    id: '5',
    title: 'Šv. Petro ir Pauliaus relikvijos',
    titleEn: 'Relics of St. Peter and St. Paul',
    description: 'Katedroje saugomos šventųjų apaštalų Petro ir Pauliaus relikvijos.',
    period: 'Iš senovės',
    type: 'relic',
  },
];

export function CathedralHeritage({ items = defaultHeritageItems, className }: CathedralHeritageProps) {
  const [selectedItem, setSelectedItem] = React.useState<HeritageItem | null>(null);
  const [activeTab, setActiveTab] = React.useState<string | null>(null);

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type]!.push(item);
    return acc;
  }, {} as Record<string, HeritageItem[]>);

  return (
    <div className={cn('space-y-6', className)}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-heading">Katedros paveldas</CardTitle>
          <p className="text-gray-600">Cathedral Heritage</p>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-600 max-w-2xl mx-auto">
            Kauno arkikatedra bazilija - neogotikos architektūros šedevras su turtinga istorija.
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 justify-center">
        {Object.entries(heritageTypeLabels).map(([key, labels]) => (
          <Button key={key} variant={activeTab === key ? 'default' : 'outline'} onClick={() => setActiveTab(activeTab === key ? null : key)}>
            {heritageTypeIcons[key]} {labels.lt}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(activeTab ? groupedItems[activeTab] || [] : items).map((item) => (
          <Card
            key={item.id}
            className={cn('cursor-pointer hover:shadow-lg', selectedItem?.id === item.id && 'ring-2 ring-primary')}
            onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
          >
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{heritageTypeIcons[item.type]}</span>
                <Badge variant="secondary">{heritageTypeLabels[item.type]?.lt}</Badge>
              </div>
              <CardTitle className="text-lg">{item.title}</CardTitle>
              {item.titleEn && <p className="text-sm text-gray-600">{item.titleEn}</p>}
              <p className="text-xs text-gray-500">{item.period}</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedItem && (
        <Card className="border-primary border-2">
          <CardHeader>
            <CardTitle>{selectedItem.title}</CardTitle>
            {selectedItem.titleEn && <p className="text-gray-600">{selectedItem.titleEn}</p>}
          </CardHeader>
          <CardContent>
            <p>{selectedItem.description}</p>
            <div className="mt-4 flex gap-2">
              <Badge>{selectedItem.period}</Badge>
              <Badge variant="secondary">{heritageTypeLabels[selectedItem.type]?.en}</Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default CathedralHeritage;