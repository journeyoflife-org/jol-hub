'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';

export interface GriefResource {
  id: string;
  title: string;
  titleEn: string;
  category: 'family' | 'psychological' | 'legal' | 'support';
  description?: string;
}

export interface GriefResourcesProps {
  resources?: GriefResource[];
  className?: string;
}

const categoryIcons: Record<string, string> = {
  family: '👨‍👩‍👧‍👦',
  psychological: '💭',
  legal: '⚖️',
  support: '🤝',
};

const categoryLabels: Record<string, { lt: string; en: string }> = {
  family: { lt: 'Šeimai', en: 'For Families' },
  psychological: { lt: 'Psichologija', en: 'Psychological' },
  legal: { lt: 'Teisė', en: 'Legal' },
  support: { lt: 'Palaikymas', en: 'Support' },
};

const defaultResources: GriefResource[] = [
  {
    id: 'gr-1',
    title: 'Kaip kalbėti su vaikais apie mirtį',
    titleEn: 'How to talk to children about death',
    category: 'family',
    description: 'Patarimai tėvams, kaip padėti vaikams suprasti ir išgyventi netektį.',
  },
  {
    id: 'gr-2',
    title: 'Gedėjimo stadijos',
    titleEn: 'Stages of Grief',
    category: 'psychological',
    description: 'Supraskite penkias gedėjimo stadijas ir kaip jas įveikti.',
  },
  {
    id: 'gr-3',
    title: 'Juridiniai klausimai po mirties',
    titleEn: 'Legal matters after death',
    category: 'legal',
    description: 'Informacija apie testamento vykdymą, nuosavybės teises ir dokumentus.',
  },
  {
    id: 'gr-4',
    title: 'Palaikymo grupių sąrašas',
    titleEn: 'Support groups list',
    category: 'support',
    description: 'Vietinių ir internetinių palaikymo grupių, kurios gali padėti gedint.',
  },
  {
    id: 'gr-5',
    title: 'Kaip paremti gedintįjį',
    titleEn: 'How to support someone grieving',
    category: 'support',
    description: 'Patarimai draugams ir šeimos nariams, kaip padėti gedintiems artimiesiems.',
  },
  {
    id: 'gr-6',
    title: 'Savigynos technikos',
    titleEn: 'Self-care techniques',
    category: 'psychological',
    description: 'Praktiniai patarimai, kaip rūpintis savimi gedėjimo metu.',
  },
];

export function GriefResources({
  resources = defaultResources,
  className,
}: GriefResourcesProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  const filteredResources = resources.filter(
    (r) => !selectedCategory || r.category === selectedCategory
  );

  const categories = [...new Set(resources.map((r) => r.category))];

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-heading">Gedėjimo ištekliai</CardTitle>
        <p className="text-sm text-gray-600">Grief Resources</p>

        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            Visi
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
          {filteredResources.map((resource) => (
            <div
              key={resource.id}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-memorial-gold transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-3 mb-2">
                <span className="text-2xl">{categoryIcons[resource.category]}</span>
                <div>
                  <h3 className="font-medium text-primary">{resource.title}</h3>
                  <p className="text-sm text-gray-600">{resource.titleEn}</p>
                </div>
              </div>
              {resource.description && (
                <p className="text-sm text-gray-600 mt-2">{resource.description}</p>
              )}
              <Badge variant="outline" className="mt-3">
                {categoryLabels[resource.category]?.lt}
              </Badge>
            </div>
          ))}
        </div>

        {/* Contact for Support */}
        <div className="mt-6 p-4 bg-memorial-cream rounded-lg">
          <h4 className="font-medium mb-2">Reikia pagalbos? / Need help?</h4>
          <p className="text-sm text-gray-600 mb-3">
            Mūsų komanda yra čia, kad padėtų jums šiuo sunkiu metu.
            Nedvejodami susisiekite su mumis bet kuriuo metu.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <a href={`tel:${entityConfig.contact.emergency}`} className="text-primary hover:underline">
              📞 Skubus tel.: {entityConfig.contact.emergency}
            </a>
            <a href={`mailto:${entityConfig.contact.email}`} className="text-primary hover:underline">
              📧 {entityConfig.contact.email}
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Need to import entityConfig for emergency contact
import { entityConfig } from '@/config/entity';

export default GriefResources;
