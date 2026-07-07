'use client';

import * as React from 'react';
import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';

export interface ObituaryData {
  id: string;
  deceasedName: string;
  birthDate: string;
  deathDate: string;
  photo?: string;
  biography?: string;
  serviceDate?: string;
  serviceLocation?: string;
  published: boolean;
}

export interface ObituaryPortalProps {
  obituaries?: ObituaryData[];
  onViewObituary?: (obituary: ObituaryData) => void;
  className?: string;
}

const defaultObituaries: ObituaryData[] = [
  {
    id: 'ob-1',
    deceasedName: 'Jonas Petraitis',
    birthDate: '1945-03-15',
    deathDate: '2026-04-01',
    biography: 'Mylimas tėvas, senelis ir draugas. Gyveno pilną ir prasmingą gyvenimą.',
    serviceDate: '2026-04-05',
    serviceLocation: 'Vilniaus Laidojimo Namai',
    published: true,
  },
  {
    id: 'ob-2',
    deceasedName: 'Marija Kazlauskienė',
    birthDate: '1950-07-22',
    deathDate: '2026-03-28',
    biography: 'Rūpestinga motina ir močiutė. Visada šypsodavosi ir dalijo meilę.',
    serviceDate: '2026-04-02',
    serviceLocation: 'Antakalnio bažnyčia',
    published: true,
  },
  {
    id: 'ob-3',
    deceasedName: 'Antanas Šernas',
    birthDate: '1938-11-10',
    deathDate: '2026-03-25',
    biography: 'Gerbiamas bendruomenės narys, veterantas ir šeimos galva.',
    serviceDate: '2026-03-30',
    serviceLocation: 'Vilniaus Laidojimo Namai',
    published: true,
  },
];

export function ObituaryPortal({
  obituaries = defaultObituaries,
  onViewObituary,
  className,
}: ObituaryPortalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredObituaries = obituaries.filter(
    (ob) =>
      ob.published &&
      ob.deceasedName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateAge = (birthDate: string, deathDate: string): number => {
    const birth = parseISO(birthDate);
    const death = parseISO(deathDate);
    let age = death.getFullYear() - birth.getFullYear();
    const monthDiff = death.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && death.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-heading">Nekrologai</CardTitle>
        <p className="text-sm text-gray-600">Obituaries</p>

        {/* Search */}
        <div className="mt-4">
          <input
            type="text"
            placeholder="Ieškoti vardo / Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-4">
          {filteredObituaries.map((obituary) => (
            <div
              key={obituary.id}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              onClick={() => onViewObituary?.(obituary)}
            >
              <div className="flex gap-4">
                {/* Photo placeholder */}
                <div className="w-20 h-24 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl">👤</span>
                </div>

                <div className="flex-1">
                  <h3 className="font-heading text-lg text-primary">{obituary.deceasedName}</h3>
                  <p className="text-sm text-gray-600">
                    {format(parseISO(obituary.birthDate), 'yyyy-MM-dd')} — {format(parseISO(obituary.deathDate), 'yyyy-MM-dd')}
                  </p>
                  <p className="text-sm text-memorial-gray">
                    Amžius / Age: {calculateAge(obituary.birthDate, obituary.deathDate)} metai
                  </p>
                  {obituary.biography && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{obituary.biography}</p>
                  )}
                </div>
              </div>

              {obituary.serviceDate && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium">Atsisveikinimas / Farewell Service</p>
                      <p className="text-gray-600">
                        📅 {format(parseISO(obituary.serviceDate), 'yyyy-MM-dd')}
                      </p>
                      {obituary.serviceLocation && (
                        <p className="text-gray-600">📍 {obituary.serviceLocation}</p>
                      )}
                    </div>
                    <Button variant="outline" size="sm">
                      Siųsti kondolencijas
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {filteredObituaries.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>Nekrologų nerasta.</p>
              <p className="text-sm">No obituaries found.</p>
            </div>
          )}
        </div>

        {/* Submit Obituary */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
          <p className="text-sm text-gray-600 mb-3">
            Norite paskelbti nekrologą? / Want to publish an obituary?
          </p>
          <Button asChild>
            <a href="mailto:info@vilniusfuneral.lt?subject=Nekrologas">
              Susisiekti / Contact Us
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ObituaryPortal;
