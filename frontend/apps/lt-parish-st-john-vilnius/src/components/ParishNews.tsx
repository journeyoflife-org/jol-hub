'use client';

import * as React from 'react';
import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';

export interface NewsArticle {
  id: string;
  title: string;
  titleEn?: string;
  content: string;
  date: string;
  category: 'announcement' | 'event' | 'pastoral' | 'community';
  image?: string;
  featured?: boolean;
}

export interface ParishNewsProps {
  news?: NewsArticle[];
  onArticleSelect?: (article: NewsArticle) => void;
  className?: string;
}

const categoryColors: Record<string, string> = {
  announcement: 'bg-blue-100 text-blue-800',
  event: 'bg-green-100 text-green-800',
  pastoral: 'bg-purple-100 text-purple-800',
  community: 'bg-amber-100 text-amber-800',
};

const categoryLabels: Record<string, { lt: string; en: string }> = {
  announcement: { lt: 'Skelbimas', en: 'Announcement' },
  event: { lt: 'Renginys', en: 'Event' },
  pastoral: { lt: 'Ganytojiškas', en: 'Pastoral' },
  community: { lt: 'Bendruomenė', en: 'Community' },
};

const defaultNews: NewsArticle[] = [
  {
    id: 'n-1',
    title: 'Velykinio triduonio tvarkaraštis 2026',
    titleEn: 'Easter Triduum Schedule 2026',
    content: 'Kviečiame visus parapijiečius dalyvauti šventose Velykų apeigose. Didysis ketvirtadienis, Didysis penktadienis, Velykų vigilija ir sekmadienio Mišios.',
    date: '2026-04-01',
    category: 'announcement',
    featured: true,
  },
  {
    id: 'n-2',
    title: 'Jaunimo savaitė parapijoje',
    titleEn: 'Youth Week in the Parish',
    content: 'Balandžio mėnesį vyks speciali jaunimo savaitė su rekolekcijomis, bendruomeninėmis veiklomis ir jaunimo Mišiomis.',
    date: '2026-03-25',
    category: 'event',
  },
  {
    id: 'n-3',
    title: 'Klebono laiškas parapijiečiams',
    titleEn: 'Pastor\'s Letter to Parishioners',
    content: 'Brangūs parapijiečiai, šiuo laišku noriu padėkoti už jūsų paramą ir ištikimybę mūsų parapijai per pastaruosius metus.',
    date: '2026-03-20',
    category: 'pastoral',
  },
  {
    id: 'n-4',
    title: 'Caritas savanorių paieška',
    titleEn: 'Caritas Volunteer Search',
    content: 'Mūsų parapijos Caritas grupė ieško savanorių, kurie galėtų padėti organizuoti labdaros renginius ir padėti vienišiems senoliams.',
    date: '2026-03-15',
    category: 'community',
  },
  {
    id: 'n-5',
    title: 'Bažnyčios remonto darbų pradžia',
    titleEn: 'Church Renovation Work Begins',
    content: 'Informuojame, kad balandžio pradžioje prasidės bažnyčios stogo remonto darbai. Dėkojame už jūsų aukas ir kantrybę.',
    date: '2026-03-10',
    category: 'announcement',
  },
];

export function ParishNews({
  news = defaultNews,
  onArticleSelect,
  className,
}: ParishNewsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  const filteredNews = news
    .filter((article) => !selectedCategory || article.category === selectedCategory)
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

  const categories = [...new Set(news.map((n) => n.category))];
  const featuredArticles = news.filter((n) => n.featured);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-heading">Parapijos naujienos</CardTitle>
        <p className="text-sm text-gray-600">Parish News</p>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            Visi ({news.length})
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {categoryLabels[category]?.lt}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Featured Articles */}
        {selectedCategory === null && featuredArticles.length > 0 && (
          <div className="mb-6">
            <h3 className="font-medium text-lg mb-3 text-primary">Svarbiausia / Featured</h3>
            <div className="grid gap-4">
              {featuredArticles.map((article) => (
                <div
                  key={article.id}
                  className="p-4 bg-liturgical-gold/10 border-l-4 border-liturgical-gold rounded-lg cursor-pointer hover:bg-liturgical-gold/20 transition-colors"
                  onClick={() => setExpandedArticle(expandedArticle === article.id ? null : article.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-primary">{article.title}</h4>
                    <Badge className={categoryColors[article.category]}>
                      {categoryLabels[article.category]?.lt}
                    </Badge>
                  </div>
                  {article.titleEn && (
                    <p className="text-sm text-gray-600 mb-2">{article.titleEn}</p>
                  )}
                  <p className="text-sm text-gray-600">{article.content}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    📅 {format(parseISO(article.date), 'yyyy-MM-dd')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Articles */}
        <div className="space-y-4">
          <h3 className="font-medium text-lg mb-3 text-primary">
            {selectedCategory ? categoryLabels[selectedCategory]?.lt : 'Visos naujienos / All News'}
          </h3>

          {filteredNews
            .filter((n) => selectedCategory !== null || !n.featured)
            .map((article) => (
              <div
                key={article.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                onClick={() => onArticleSelect?.(article)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-primary">{article.title}</h4>
                  <Badge className={categoryColors[article.category]}>
                    {categoryLabels[article.category]?.lt}
                  </Badge>
                </div>
                {article.titleEn && (
                  <p className="text-sm text-gray-600 mb-2">{article.titleEn}</p>
                )}
                <p className="text-sm text-gray-600 line-clamp-2">{article.content}</p>
                <p className="text-xs text-gray-500 mt-2">
                  📅 {format(parseISO(article.date), 'yyyy-MM-dd')}
                </p>
              </div>
            ))}

          {filteredNews.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>Nėra naujienų šioje kategorijoje.</p>
              <p className="text-sm">No news in this category.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ParishNews;
