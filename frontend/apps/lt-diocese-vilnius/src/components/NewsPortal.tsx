'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';

export interface NewsArticle {
  id: string;
  title: string;
  titleEn?: string;
  summary: string;
  content: string;
  date: string;
  author: string;
  category: 'announcements' | 'events' | 'pastoral' | 'vatican' | 'local';
  featured?: boolean;
  imageUrl?: string;
}

export interface NewsPortalProps {
  articles?: NewsArticle[];
  onArticleSelect?: (article: NewsArticle) => void;
  className?: string;
}

const categoryLabels: Record<string, { lt: string; en: string }> = {
  announcements: { lt: 'Pranešimai', en: 'Announcements' },
  events: { lt: 'Renginiai', en: 'Events' },
  pastoral: { lt: 'Ganytojiška', en: 'Pastoral' },
  vatican: { lt: 'Vatikanas', en: 'Vatican' },
  local: { lt: 'Vietinės naujienos', en: 'Local News' },
};

const categoryColors: Record<string, string> = {
  announcements: 'bg-blue-100 text-blue-800',
  events: 'bg-green-100 text-green-800',
  pastoral: 'bg-purple-100 text-purple-800',
  vatican: 'bg-amber-100 text-amber-800',
  local: 'bg-gray-100 text-gray-800',
};

const defaultArticles: NewsArticle[] = [
  {
    id: 'n-1',
    title: 'Vilniaus arkivyskupijos sinodas pradėtas',
    titleEn: 'Vilnius Archdiocese Synod Begins',
    summary: 'Arkivyskupijos sinodas, kuriame dalyvauja visi kunigai ir pasauliečiai atstovai.',
    content: 'Vilniaus arkivyskupijos sinodas pradėtas rugsėjo mėnesį...',
    date: '2026-04-01',
    author: 'Vilniaus arkivyskupijos kurija',
    category: 'pastoral',
    featured: true,
  },
  {
    id: 'n-2',
    title: 'Popiežiaus laiškas Lietuvai',
    titleEn: "Pope's Letter to Lithuania",
    summary: 'Šventasis Tėvas adresuoja laišką Lietuvos katalikams.',
    content: 'Popiežius Pranciškus kreipiasi į Lietuvos tikinčiuosius...',
    date: '2026-03-28',
    author: 'Vatikano informacijos tarnyba',
    category: 'vatican',
    featured: true,
  },
  {
    id: 'n-3',
    title: 'Nauji kunigų paskyrimai',
    titleEn: 'New Priest Assignments',
    summary: 'Arkivyskupas paskelbė naujus kunigų paskyrimus parapijoms.',
    content: 'Vilniaus arkivyskupas metropolitas paskelbė naujus kunigų paskyrimus...',
    date: '2026-03-25',
    author: 'Personalo skyrius',
    category: 'announcements',
  },
  {
    id: 'n-4',
    title: 'Velykinės rekolekcijos',
    titleEn: 'Easter Retreats',
    summary: 'Velykinės rekolekcijos visose arkivyskupijos parapijose.',
    content: 'Velykinės rekolekcijos bus vykdomos visose parapijose...',
    date: '2026-03-20',
    author: 'Katechezės centras',
    category: 'events',
  },
  {
    id: 'n-5',
    title: 'Trakų piligrimystė',
    titleEn: 'Trakai Pilgrimage',
    summary: 'Kasmetinė piligrimystė į Trakus.',
    content: 'Kasmetinė piligrimystė į Trakų Šv. Onos bažnyčią...',
    date: '2026-03-15',
    author: 'Vietinės naujienos',
    category: 'local',
  },
];

export function NewsPortal({ articles = defaultArticles, onArticleSelect, className }: NewsPortalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  const filteredArticles = selectedCategory
    ? articles.filter((a) => a.category === selectedCategory)
    : articles;

  const featuredArticles = articles.filter((a) => a.featured);
  const regularArticles = filteredArticles.filter((a) => !a.featured);

  const categories = [...new Set(articles.map((a) => a.category))];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Featured Articles */}
      {!selectedCategory && featuredArticles.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {featuredArticles.map((article) => (
            <Card
              key={article.id}
              className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-primary"
              onClick={() => setSelectedArticle(article)}
            >
              <CardHeader>
                <Badge className={cn('w-fit mb-2', categoryColors[article.category])}>
                  {categoryLabels[article.category]?.lt}
                </Badge>
                <CardTitle className="text-xl">{article.title}</CardTitle>
                {article.titleEn && <p className="text-sm text-gray-600">{article.titleEn}</p>}
                <p className="text-xs text-gray-500 mt-2">{article.date} • {article.author}</p>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{article.summary}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* All Articles */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Arkivyskupijos naujienos</CardTitle>
          <p className="text-sm text-gray-600">Archdiocese News</p>

          <div className="flex flex-wrap gap-2 mt-4">
            <Button variant={selectedCategory === null ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory(null)}>
              Visos
            </Button>
            {categories.map((cat) => (
              <Button key={cat} variant={selectedCategory === cat ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory(cat)}>
                {categoryLabels[cat]?.lt}
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className="space-y-4">
            {regularArticles.map((article) => (
              <div
                key={article.id}
                className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                onClick={() => onArticleSelect?.(article)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={categoryColors[article.category]}>
                    {categoryLabels[article.category]?.lt}
                  </Badge>
                  <span className="text-xs text-gray-500">{article.date}</span>
                </div>
                <h3 className="font-medium">{article.title}</h3>
                {article.titleEn && <p className="text-sm text-gray-600">{article.titleEn}</p>}
                <p className="text-sm text-gray-600 mt-2">{article.summary}</p>
                <p className="text-xs text-gray-500 mt-2">{article.author}</p>
              </div>
            ))}

            {regularArticles.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Nėra straipsnių šioje kategorijoje.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Article Detail Modal */}
      {selectedArticle && (
        <Card className="border-primary border-2">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <Badge className={categoryColors[selectedArticle.category]}>
                  {categoryLabels[selectedArticle.category]?.lt}
                </Badge>
                <CardTitle className="text-2xl mt-2">{selectedArticle.title}</CardTitle>
                {selectedArticle.titleEn && (
                  <p className="text-gray-600">{selectedArticle.titleEn}</p>
                )}
              </div>
              <Button variant="ghost" onClick={() => setSelectedArticle(null)}>Uždaryti</Button>
            </div>
            <p className="text-sm text-gray-500">{selectedArticle.date} • {selectedArticle.author}</p>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line">{selectedArticle.content}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default NewsPortal;
