'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';
import { entityConfig, type Monument } from '@/config/entity';

export interface MonumentCatalogProps {
  monuments?: Monument[];
  onSelect?: (monument: Monument, customization: MonumentCustomization) => void;
  className?: string;
}

export interface MonumentCustomization {
  inscription: string;
  font: 'classic' | 'modern' | 'script';
  engraving: 'standard' | 'laser' | 'hand-carved';
  photoEngraving: boolean;
}

const materialLabels: Record<string, { lt: string; en: string }> = {
  granite: { lt: 'Granitas', en: 'Granite' },
  marble: { lt: 'Marmuras', en: 'Marble' },
  bronze: { lt: 'Bronza', en: 'Bronze' },
  stone: { lt: 'Akmuo', en: 'Stone' },
};

const styleLabels: Record<string, { lt: string; en: string }> = {
  classic: { lt: 'Klasikinis', en: 'Classic' },
  modern: { lt: 'Modernus', en: 'Modern' },
  orthodox: { lt: 'Stačiatikių', en: 'Orthodox' },
  cross: { lt: 'Kryžius', en: 'Cross' },
};

export function MonumentCatalog({
  monuments = entityConfig.monuments,
  onSelect,
  className,
}: MonumentCatalogProps) {
  const [selectedMonument, setSelectedMonument] = useState<Monument | null>(null);
  const [showCustomization, setShowCustomization] = useState(false);
  const [customization, setCustomization] = useState<MonumentCustomization>({
    inscription: '',
    font: 'classic',
    engraving: 'standard',
    photoEngraving: false,
  });

  const materialFilter = [...new Set(monuments.map((m) => m.material))];
  const styleFilter = [...new Set(monuments.map((m) => m.style))];
  const [filterMaterial, setFilterMaterial] = useState<string | null>(null);
  const [filterStyle, setFilterStyle] = useState<string | null>(null);

  const filteredMonuments = monuments.filter((m) => {
    if (filterMaterial && m.material !== filterMaterial) return false;
    if (filterStyle && m.style !== filterStyle) return false;
    return true;
  });

  const calculateTotal = () => {
    if (!selectedMonument) return 0;
    let total = selectedMonument.price;
    if (customization.engraving === 'laser') total += 150;
    if (customization.engraving === 'hand-carved') total += 400;
    if (customization.photoEngraving) total += 200;
    return total;
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-heading">Paminklų katalogas</CardTitle>
        <p className="text-sm text-gray-600">Monument Catalog</p>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mt-4">
          <div>
            <p className="text-xs font-medium mb-1">Medžiaga / Material</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filterMaterial === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterMaterial(null)}
              >
                Visos
              </Button>
              {materialFilter.map((mat) => (
                <Button
                  key={mat}
                  variant={filterMaterial === mat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterMaterial(mat)}
                >
                  {materialLabels[mat]?.lt}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium mb-1">Stilius / Style</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filterStyle === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStyle(null)}
              >
                Visi
              </Button>
              {styleFilter.map((style) => (
                <Button
                  key={style}
                  variant={filterStyle === style ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStyle(style)}
                >
                  {styleLabels[style]?.lt}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {!showCustomization ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMonuments.map((monument) => (
              <div
                key={monument.id}
                className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Image Placeholder */}
                <div className="aspect-square bg-gradient-to-b from-cemetery-granite/20 to-cemetery-stone/10 flex items-center justify-center">
                  <span className="text-6xl">
                    {monument.style === 'cross' ? '✝️' : monument.style === 'orthodox' ? '☦️' : '🏛️'}
                  </span>
                </div>

                <div className="p-4">
                  <h3 className="font-heading text-lg text-primary">{monument.name}</h3>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{materialLabels[monument.material]?.lt}</Badge>
                    <Badge variant="outline">{styleLabels[monument.style]?.lt}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Matmenys: {monument.dimensions.height}cm × {monument.dimensions.width}cm
                  </p>
                  <p className="text-2xl font-bold text-primary mt-3">
                    €{monument.price.toLocaleString()}
                  </p>

                  {monument.customizationAvailable && (
                    <p className="text-xs text-gray-500 mt-1">✓ Individualizacija galima</p>
                  )}

                  <Button
                    className="w-full mt-3"
                    onClick={() => {
                      setSelectedMonument(monument);
                      setShowCustomization(true);
                    }}
                  >
                    Pasirinkti / Select
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <Button variant="outline" size="sm" onClick={() => setShowCustomization(false)}>
              ← Atgal į katalogą
            </Button>

            {/* Selected Monument */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-heading text-lg">{selectedMonument?.name}</h4>
              <p className="text-sm text-gray-600">Bazinė kaina: €{selectedMonument?.price}</p>
            </div>

            {/* Customization Options */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Įrašas / Inscription</label>
                <textarea
                  value={customization.inscription}
                  onChange={(e) => setCustomization({ ...customization, inscription: e.target.value })}
                  placeholder="Gyvenai, mylėjai, likai atmintyje..."
                  className="w-full px-4 py-2 border rounded-lg min-h-[80px]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {customization.inscription.length}/200 simbolių
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Šrifto stilius / Font Style</label>
                <div className="flex gap-2">
                  {(['classic', 'modern', 'script'] as const).map((font) => (
                    <Button
                      key={font}
                      variant={customization.font === font ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCustomization({ ...customization, font })}
                    >
                      {font === 'classic' ? 'Klasikinis' : font === 'modern' ? 'Modernus' : 'Rankraštis'}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Graviūros būdas / Engraving Method</label>
                <div className="space-y-2">
                  {[
                    { value: 'standard', label: 'Standartinis', price: 0 },
                    { value: 'laser', label: 'Lazerinis', price: 150 },
                    { value: 'hand-carved', label: 'Rankinis', price: 400 },
                  ].map((engr) => (
                    <label
                      key={engr.value}
                      className={cn(
                        'flex items-center justify-between p-3 border rounded-lg cursor-pointer',
                        customization.engraving === engr.value && 'border-primary bg-primary/5'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="engraving"
                          value={engr.value}
                          checked={customization.engraving === engr.value}
                          onChange={() =>
                            setCustomization({ ...customization, engraving: engr.value as any })
                          }
                        />
                        <span>{engr.label}</span>
                      </div>
                      {engr.price > 0 && <Badge variant="outline">+€{engr.price}</Badge>}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={customization.photoEngraving}
                    onChange={(e) => setCustomization({ ...customization, photoEngraving: e.target.checked })}
                  />
                  <span>Foto graviūra (+€200)</span>
                </label>
              </div>
            </div>

            {/* Total & Order */}
            <div className="p-4 bg-primary/5 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Viso / Total:</p>
                  <p className="text-2xl font-bold text-primary">€{calculateTotal()}</p>
                </div>
                <Button
                  onClick={() => selectedMonument && onSelect?.(selectedMonument, customization)}
                >
                  Užsakyti / Order
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MonumentCatalog;
