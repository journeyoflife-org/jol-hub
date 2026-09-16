/**
 * CemeteryMap Component
 * Interactive map showing cemetery sections
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, Badge } from '@journeyoflife-org/ui';
import { MapPin, Info } from 'lucide-react';

interface CemeterySection {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  totalGraves: number;
  availableSlots: number;
}

interface CemeteryMapProps {
  sections: CemeterySection[];
}

export function CemeteryMap({ sections }: CemeteryMapProps): JSX.Element {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  return (
    <Card>
      <CardContent className="p-0">
        {/* Google Maps Embed */}
        <div className="bg-muted relative h-96 w-full overflow-hidden rounded-t-lg">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2306.5!2d25.2797!3d54.6872!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTTCsDQxJzE0LjAiTiAyNcKwMTYnNDcuMCJF!5e0!3m2!1sen!2slt!4v1"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Cemetery map"
            className="absolute inset-0"
          />
        </div>

        {/* Section Legend */}
        <div className="p-4">
          <h3 className="mb-3 flex items-center gap-2 font-semibold">
            <MapPin className="h-4 w-4" />
            Cemetery Sections
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setSelectedSection(section.id)}
                className={`rounded-lg border-2 p-3 text-left transition-colors ${
                  selectedSection === section.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{section.name}</span>
                  <Badge variant={section.availableSlots > 0 ? 'default' : 'secondary'}>
                    {section.availableSlots > 0 ? `${section.availableSlots} available` : 'Full'}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {section.totalGraves} total graves
                </p>
              </button>
            ))}
          </div>

          <div className="text-muted-foreground mt-4 flex items-start gap-2 text-sm">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p>
              Click on a section to select it for service. Available slots indicate space for new
              burials.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
