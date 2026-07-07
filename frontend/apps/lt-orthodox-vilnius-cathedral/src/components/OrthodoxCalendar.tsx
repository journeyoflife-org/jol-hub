'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';
import { entityConfig, type OrthodoxFeast } from '@/config/entity';

export interface OrthodoxCalendarProps {
  feasts?: OrthodoxFeast[];
  className?: string;
}

const feastTypeColors: Record<string, string> = {
  great: 'bg-orthodox-red text-white',
  twelve: 'bg-orthodox-gold text-gray-900',
  minor: 'bg-blue-100 text-blue-800',
};

const feastTypeLabels: Record<string, { lt: string; en: string }> = {
  great: { lt: 'Didžioji šventė', en: 'Great Feast' },
  twelve: { lt: 'Dvylika didžiųjų', en: 'Twelve Great Feasts' },
  minor: { lt: 'Mažesnė šventė', en: 'Minor Feast' },
};

export function OrthodoxCalendar({
  feasts = entityConfig.greatFeasts,
  className,
}: OrthodoxCalendarProps) {
  const currentYear = new Date().getFullYear();

  // Calculate Pascha date (simplified - in reality would use Paschalion)
  const paschaMonth = 4; // April (approximate)
  const paschaDay = 20; // Approximate

  const getFeastDate = (feast: OrthodoxFeast): { month: number; day: number } | null => {
    if (feast.date === 'moveable') {
      return { month: paschaMonth, day: paschaDay };
    }
    if (feast.date.startsWith('moveable+')) {
      const offsetStr = feast.date.split('+')[1];
      const offset = offsetStr ? parseInt(offsetStr, 10) : 0;
      const baseDate = new Date(currentYear, paschaMonth - 1, paschaDay);
      baseDate.setDate(baseDate.getDate() + offset);
      return { month: baseDate.getMonth() + 1, day: baseDate.getDate() };
    }
    if (feast.date.match(/^\d{2}-\d{2}$/)) {
      const parts = feast.date.split('-').map(Number);
      return { month: parts[0] ?? 1, day: parts[1] ?? 1 };
    }
    return null;
  };

  const formatDate = (feast: OrthodoxFeast): string => {
    const date = getFeastDate(feast);
    if (!date) return feast.isMoveable ? 'Judančioji' : feast.date;
    return `${date.month.toString().padStart(2, '0')}-${date.day.toString().padStart(2, '0')}`;
  };

  // Group feasts by month
  const feastsByMonth: Record<number, OrthodoxFeast[]> = {};
  feasts.forEach((feast) => {
    const date = getFeastDate(feast);
    if (date) {
      const month = date.month;
      if (!feastsByMonth[month]) feastsByMonth[month] = [];
      feastsByMonth[month].push(feast);
    }
  });

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-orthodox">Ortodoksų kalendorius</CardTitle>
        <p className="text-sm text-gray-600">Orthodox Calendar ({entityConfig.ecclesiastical.calendar})</p>
        <p className="text-xs text-gray-500 mt-1">
          Metai / Year: {currentYear}
        </p>
      </CardHeader>

      <CardContent className="p-4">
        {/* Legend */}
        <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b">
          {Object.entries(feastTypeLabels).map(([type, labels]) => (
            <div key={type} className="flex items-center gap-1">
              <Badge className={feastTypeColors[type]}>{labels.lt}</Badge>
            </div>
          ))}
        </div>

        {/* Great Feasts List */}
        <div className="space-y-4">
          <h3 className="font-medium text-lg text-primary">Didžiosios šventės / Great Feasts</h3>

          <div className="space-y-3">
            {feasts
              .sort((a, b) => {
                const dateA = getFeastDate(a);
                const dateB = getFeastDate(b);
                if (!dateA || !dateB) return 0;
                return (dateA.month * 100 + dateA.day) - (dateB.month * 100 + dateB.day);
              })
              .map((feast) => (
                <div
                  key={feast.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-orthodox-gold transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-primary">{feast.nameLt}</h4>
                      <p className="text-sm text-gray-600">{feast.nameEn}</p>
                    </div>
                    <Badge className={feastTypeColors[feast.type]}>
                      {feastTypeLabels[feast.type]?.lt}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>📅 {formatDate(feast)}</span>
                    {feast.isMoveable && (
                      <Badge variant="outline" className="text-xs">
                        Judančioji / Moveable
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Fasting Periods */}
        <div className="mt-6 pt-6 border-t">
          <h3 className="font-medium text-lg text-primary mb-3">Pasninkai / Fasting Periods</h3>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="font-medium">Didysis pasninkas</p>
              <p className="text-gray-600">Great Lent (7 weeks before Pascha)</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="font-medium">Kalėdų pasninkas</p>
              <p className="text-gray-600">Nativity Fast (Nov 15 - Dec 24)</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="font-medium">Apostolų pasninkas</p>
              <p className="text-gray-600">Apostles Fast (variable)</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="font-medium">Dievogimdos pasninkas</p>
              <p className="text-gray-600">Dormition Fast (Aug 1-14)</p>
            </div>
          </div>
        </div>

        {/* Calendar Note */}
        <div className="mt-6 p-4 bg-orthodox-gold/10 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Pastaba:</strong> Stačiatikių bažnyčia naudoja Julijaus kalendorių (senuoju stiliumi),
            kuris skiriasi 13 dienų nuo Grigaliaus kalendoriaus.
            <br />
            <strong>Note:</strong> The Orthodox Church uses the Julian Calendar (Old Style),
            which differs by 13 days from the Gregorian calendar.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default OrthodoxCalendar;
