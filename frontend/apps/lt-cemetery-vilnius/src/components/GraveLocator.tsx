'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';
import { entityConfig, type GravePlot } from '@/config/entity';

export interface GraveLocatorProps {
  plots?: GravePlot[];
  onLocate?: (plot: GravePlot) => void;
  className?: string;
}

const statusColors: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  occupied: 'bg-gray-100 text-gray-800',
  reserved: 'bg-yellow-100 text-yellow-800',
};

const statusLabels: Record<string, { lt: string; en: string }> = {
  available: { lt: 'Laisvas', en: 'Available' },
  occupied: { lt: 'Užimtas', en: 'Occupied' },
  reserved: { lt: 'Rezervuotas', en: 'Reserved' },
};

const typeLabels: Record<string, { lt: string; en: string }> = {
  single: { lt: 'Vienetas', en: 'Single' },
  double: { lt: 'Dvigubas', en: 'Double' },
  family: { lt: 'Šeimos', en: 'Family' },
};

export function GraveLocator({
  plots = entityConfig.gravePlots,
  onLocate,
  className,
}: GraveLocatorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedPlot, setSelectedPlot] = useState<GravePlot | null>(null);

  const sections = entityConfig.sections;

  const filteredPlots = plots.filter((plot) => {
    const matchesSearch =
      searchQuery === '' ||
      plot.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plot.owner?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plot.deceased?.some(
        (d) =>
          d.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.lastName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesSection = !selectedSection || plot.section === selectedSection;
    return matchesSearch && matchesSection;
  });

  const handleLocate = (plot: GravePlot) => {
    setSelectedPlot(plot);
    onLocate?.(plot);
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-heading">Kapo paieška</CardTitle>
        <p className="text-sm text-gray-600">Grave Locator</p>

        {/* Search */}
        <div className="mt-4 space-y-3">
          <input
            type="text"
            placeholder="Ieškoti vardo, pavardės ar kapo numerio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedSection === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSection(null)}
            >
              Visos sekcijos
            </Button>
            {sections.map((section) => (
              <Button
                key={section.id}
                variant={selectedSection === section.name ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedSection(section.name)}
              >
                {section.name} ({section.type})
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Plot List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {filteredPlots.map((plot) => (
              <div
                key={plot.id}
                className={cn(
                  'p-3 border rounded-lg cursor-pointer transition-colors',
                  selectedPlot?.id === plot.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-gray-300'
                )}
                onClick={() => handleLocate(plot)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-primary">
                      {plot.section} - Eilė {plot.row}, Nr. {plot.plot}
                    </h4>
                    <p className="text-xs text-gray-600">{plot.id}</p>
                  </div>
                  <Badge className={statusColors[plot.status]}>
                    {statusLabels[plot.status]?.lt}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Tipas: {typeLabels[plot.type]?.lt}</p>
                  {plot.owner && <p>Savininkas: {plot.owner}</p>}
                </div>
                {plot.deceased && plot.deceased.length > 0 && (
                  <div className="mt-2 pt-2 border-t text-sm">
                    <p className="font-medium">Palaidoti / Interred:</p>
                    {plot.deceased.map((d) => (
                      <p key={d.id} className="text-gray-600">
                        {d.firstName} {d.lastName} ({d.deathDate})
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {filteredPlots.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Kapų nerasta.</p>
                <p className="text-sm">No plots found.</p>
              </div>
            )}
          </div>

          {/* Map Placeholder */}
          <div className="border rounded-lg overflow-hidden">
            <div className="aspect-square bg-gradient-to-br from-cemetery-grass/20 to-cemetery-stone/10 flex items-center justify-center">
              {selectedPlot ? (
                <div className="text-center p-4">
                  <div className="w-8 h-8 bg-primary rounded-full mx-auto mb-3 animate-pulse" />
                  <p className="font-medium text-primary">
                    {selectedPlot.section} - Eilė {selectedPlot.row}, Nr. {selectedPlot.plot}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    GPS: {selectedPlot.coordinates.lat.toFixed(4)}, {selectedPlot.coordinates.lng.toFixed(4)}
                  </p>
                  <Button size="sm" className="mt-3" asChild>
                    <a
                      href={`https://maps.google.com/?q=${selectedPlot.coordinates.lat},${selectedPlot.coordinates.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Atidaryti žemėlapyje
                    </a>
                  </Button>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <p className="text-4xl mb-2">🗺️</p>
                  <p>Pasirinkite kapą žemėlapyje</p>
                  <p className="text-sm">Select a plot to view location</p>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800 text-xs">
              <p className="font-medium mb-2">Legenda / Legend:</p>
              <div className="flex flex-wrap gap-3">
                {Object.entries(statusLabels).map(([key, label]) => (
                  <span key={key} className="flex items-center gap-1">
                    <span className={cn('w-3 h-3 rounded', statusColors[key]?.split(' ')[0])} />
                    {label.lt}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default GraveLocator;
