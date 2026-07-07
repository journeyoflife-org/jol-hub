'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';

export interface Publication {
  id: string;
  title: string;
  titleEn?: string;
  author: string;
  description: string;
  price: number;
  currency: string;
  category: 'books' | 'journals' | 'liturgical' | 'educational' | 'pastoral';
  format: 'print' | 'digital' | 'both';
  year: number;
  pages?: number;
  isbn?: string;
}

export interface DiocesanPublicationsProps {
  publications?: Publication[];
  onPurchase?: (publication: Publication, format: 'print' | 'digital') => void;
  className?: string;
}

const categoryLabels: Record<string, { lt: string; en: string }> = {
  books: { lt: 'Knygos', en: 'Books' },
  journals: { lt: 'Žurnalai', en: 'Journals' },
  liturgical: { lt: 'Liturginiai leidiniai', en: 'Liturgical' },
  educational: { lt: 'Švietimo', en: 'Educational' },
  pastoral: { lt: 'Ganytojiška', en: 'Pastoral' },
};

const defaultPublications: Publication[] = [
  { id: 'pub-1', title: 'Vilniaus arkivyskupijos istorija', titleEn: 'History of Vilnius Archdiocese', author: 'Prof. J. Kiaupienė', description: 'Išsami Vilniaus arkivyskupijos istorija nuo įkūrimo.', price: 35, currency: 'EUR', category: 'books', format: 'both', year: 2025, pages: 450, isbn: '978-5-430-12345-6' },
  { id: 'pub-2', title: 'Šv. Kazimiero gyvenimas', titleEn: 'Life of St. Casimir', author: 'Kun. A. Sabaliauskas', description: 'Lietuvos globėjo šventojo Kazimiero biografija.', price: 18, currency: 'EUR', category: 'books', format: 'print', year: 2024, pages: 180 },
  { id: 'pub-3', title: 'Bažnyčios giesmynas', author: 'Vilniaus kurija', description: 'Oficialus Lietuvos bažnyčios giesmynas.', price: 25, currency: 'EUR', category: 'liturgical', format: 'print', year: 2023, pages: 320 },
  { id: 'pub-4', title: 'Katekizmas suaugusiems', titleEn: 'Adult Catechism', author: 'Katechezės centras', description: 'Katekizmas suaugusiems, skirtas tikėjimo pagrindams.', price: 12, currency: 'EUR', category: 'educational', format: 'both', year: 2025, pages: 120 },
  { id: 'pub-5', title: 'Vyskupijos žinios', titleEn: 'Diocese News', author: 'Vilniaus kurija', description: 'Mėnesinis arkivyskupijos informacinis leidinys.', price: 5, currency: 'EUR', category: 'journals', format: 'digital', year: 2026 },
];

export function DiocesanPublications({ publications = defaultPublications, onPurchase, className }: DiocesanPublicationsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<Map<string, { qty: number; format: 'print' | 'digital' }>>(new Map());

  const filteredPublications = selectedCategory
    ? publications.filter((p) => p.category === selectedCategory)
    : publications;

  const addToCart = (pubId: string, format: 'print' | 'digital') => {
    setCart((prev) => {
      const newCart = new Map(prev);
      const existing = newCart.get(pubId);
      if (existing) {
        newCart.set(pubId, { qty: existing.qty + 1, format });
      } else {
        newCart.set(pubId, { qty: 1, format });
      }
      return newCart;
    });
  };

  const handlePurchase = () => {
    cart.forEach((item, pubId) => {
      const pub = publications.find((p) => p.id === pubId);
      if (pub) {
        for (let i = 0; i < item.qty; i++) {
          onPurchase?.(pub, item.format);
        }
      }
    });
    setCart(new Map());
  };

  const categories = [...new Set(publications.map((p) => p.category))];
  const totalItems = Array.from(cart.values()).reduce((sum, item) => sum + item.qty, 0);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-heading">Vyskupijos leidiniai</CardTitle>
            <p className="text-sm text-gray-600">Diocesan Publications</p>
          </div>
          {totalItems > 0 && <Badge className="bg-primary text-white">{totalItems} krepšelyje</Badge>}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Button variant={selectedCategory === null ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory(null)}>
            Visi
          </Button>
          {categories.map((cat) => (
            <Button key={cat} variant={selectedCategory === cat ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory(cat)}>
              {categoryLabels[cat]?.lt}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="grid gap-4 md:grid-cols-2">
          {filteredPublications.map((pub) => (
            <div key={pub.id} className="p-4 border rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium">{pub.title}</h3>
                  {pub.titleEn && <p className="text-sm text-gray-600">{pub.titleEn}</p>}
                </div>
                <Badge variant="secondary">{categoryLabels[pub.category]?.lt}</Badge>
              </div>
              
              <p className="text-sm text-gray-500 mb-2">{pub.author} • {pub.year}</p>
              <p className="text-sm text-gray-600 mb-3">{pub.description}</p>
              
              <div className="flex gap-2 text-xs text-gray-500 mb-3">
                {pub.pages && <span>{pub.pages} psl.</span>}
                {pub.isbn && <span>ISBN: {pub.isbn}</span>}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">{pub.price} {pub.currency}</span>
                
                <div className="flex gap-2">
                  {pub.format === 'both' ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => addToCart(pub.id, 'digital')}>
                        📱 Skaitmeninis
                      </Button>
                      <Button size="sm" onClick={() => addToCart(pub.id, 'print')}>
                        📚 Spausdintas
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={() => addToCart(pub.id, pub.format as 'print' | 'digital')}>
                      {pub.format === 'digital' ? '📱 Skaitmeninis' : '📚 Spausdintas'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalItems > 0 && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex justify-between items-center">
              <p className="font-medium">Iš viso: {totalItems} leidiniai</p>
              <Button onClick={handlePurchase}>Užsakyti / Order</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DiocesanPublications;
