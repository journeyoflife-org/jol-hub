'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';
import { entityConfig, type IconInfo } from '@/config/entity';

export interface IconGalleryProps {
  icons?: IconInfo[];
  className?: string;
}

export function IconGallery({
  icons = entityConfig.notableIcons,
  className,
}: IconGalleryProps) {
  const [selectedIcon, setSelectedIcon] = useState<IconInfo | null>(null);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-orthodox">Ikonų galerija</CardTitle>
        <p className="text-sm text-gray-600">Icon Gallery</p>
      </CardHeader>

      <CardContent className="p-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {icons.map((icon) => (
            <div
              key={icon.id}
              className={cn(
                'border rounded-lg overflow-hidden cursor-pointer transition-all',
                selectedIcon?.id === icon.id
                  ? 'border-orthodox-gold shadow-lg'
                  : 'border-gray-200 dark:border-gray-700 hover:border-orthodox-gold/50'
              )}
              onClick={() => setSelectedIcon(selectedIcon?.id === icon.id ? null : icon)}
            >
              {/* Icon Image Placeholder */}
              <div className="aspect-[3/4] bg-gradient-to-b from-orthodox-gold/20 to-orthodox-blue/20 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-6xl">☦</span>
                  <p className="text-sm text-gray-500 mt-2">Ikona / Icon</p>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-medium text-primary">{icon.nameLt}</h3>
                <p className="text-sm text-gray-600">{icon.nameEn}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">{icon.century} amžius</Badge>
                  <Badge variant="secondary" className="text-xs">{icon.origin}</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Icon Details */}
        {selectedIcon && (
          <div className="mt-6 p-4 bg-orthodox-gold/10 rounded-lg">
            <h3 className="font-medium text-lg text-primary mb-2">{selectedIcon.nameLt}</h3>
            <p className="text-sm text-gray-600 mb-3">{selectedIcon.nameEn}</p>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Kilmė / Origin:</strong> {selectedIcon.origin}</p>
                <p><strong>Amžius / Century:</strong> {selectedIcon.century}</p>
                <p><strong>Vieta / Location:</strong> {selectedIcon.location}</p>
              </div>
              <div>
                <p className="text-gray-600">{selectedIcon.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Cathedral Icons Info */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-medium mb-2">Apie katedros ikonas / About Cathedral Icons</h4>
          <p className="text-sm text-gray-600">
            Vilniaus Šv. Dvasios katedroje saugomos vertingos istorinės ikonos,
            kurių kai kurios garsėja stebuklais. Lankytojai gali pagerbti ikonas
            per Dievo tarnybas arba susitarus su katedros administracija.
            <br /><br />
            The Vilnius Holy Spirit Cathedral houses valuable historical icons,
            some of which are known for miracles. Visitors can venerate the icons
            during divine services or by arrangement with the cathedral administration.
          </p>
        </div>

        {/* Iconography Info */}
        <div className="mt-6 p-4 bg-orthodox-red/10 rounded-lg">
          <h4 className="font-medium mb-2">Apie ortodoksų ikonografiją / About Orthodox Iconography</h4>
          <p className="text-sm text-gray-600">
            Ortodoksų ikonos yra „langai į dangų“ - šventi vaizdai, padedantys tikintiesiems
            priartėti prie pavaizduotų šventųjų ir Dievo. Ikonos yra ne paprasti paveikslai,
            bet šventi daiktai, kuriuos reikia gerbti ir saugoti.
            <br /><br />
            Orthodox icons are &quot;windows to heaven&quot; - sacred images that help the faithful
            draw closer to the depicted saints and God. Icons are not mere pictures but
            sacred objects to be venerated and preserved.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default IconGallery;
