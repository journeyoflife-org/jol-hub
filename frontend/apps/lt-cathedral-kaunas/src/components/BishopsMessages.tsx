'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';

export interface BishopMessage {
  id: string;
  title: string;
  titleEn?: string;
  content: string;
  date: string;
  type: 'pastoral' | 'homily' | 'letter' | 'announcement';
  author: string;
  authorTitle?: string;
  featured?: boolean;
}

export interface BishopsMessagesProps {
  messages?: BishopMessage[];
  className?: string;
}

const messageTypeLabels: Record<string, { lt: string; en: string }> = {
  pastoral: { lt: 'Ganytojiškas laiškas', en: 'Pastoral Letter' },
  homily: { lt: 'Homilija', en: 'Homily' },
  letter: { lt: 'Laiškas', en: 'Letter' },
  announcement: { lt: 'Pranešimas', en: 'Announcement' },
};

const defaultMessages: BishopMessage[] = [
  {
    id: '1',
    title: 'Velykinis ganytojiškas laiškas',
    titleEn: 'Easter Pastoral Letter',
    content: 'Brangūs broliai ir seserys Kristaus prisikėlime! Velykos - tai pagrindinė krikščionių šventė, švenčianti Kristaus prisikėlimą.',
    date: '2026-04-05',
    type: 'pastoral',
    author: 'Kęstutis Kėvalas',
    authorTitle: 'Kauno arkivyskupas metropolitas',
    featured: true,
  },
  {
    id: '2',
    title: 'Gavėnios kvietimas',
    titleEn: 'Lenten Invitation',
    content: 'Gavėnia - tai atsivertimo ir maldos laikas.',
    date: '2026-02-18',
    type: 'letter',
    author: 'Kęstutis Kėvalas',
    authorTitle: 'Kauno arkivyskupas metropolitas',
  },
  {
    id: '3',
    title: 'Pranešimas dėl jaunimo susitikimo',
    titleEn: 'Youth Meeting Announcement',
    content: 'Kviečiame visus jaunuolius dalyvauti arkivyskupijos jaunimo susitikime.',
    date: '2026-04-10',
    type: 'announcement',
    author: 'Jaunimo tarnyba',
  },
];

export function BishopsMessages({ messages = defaultMessages, className }: BishopsMessagesProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);

  const filteredMessages = selectedType
    ? messages.filter((m) => m.type === selectedType)
    : messages;

  const featuredMessage = messages.find((m) => m.featured);
  const regularMessages = filteredMessages.filter((m) => !m.featured);

  return (
    <div className={cn('space-y-6', className)}>
      {featuredMessage && !selectedType && (
        <Card className="border-amber-300 border-2 bg-amber-50/50 dark:bg-amber-900/20">
          <CardHeader>
            <Badge className="bg-amber-400 text-black w-fit mb-2">Išskirtinis pranešimas</Badge>
            <CardTitle className="text-2xl font-heading">{featuredMessage.title}</CardTitle>
            {featuredMessage.titleEn && <p className="text-gray-600">{featuredMessage.titleEn}</p>}
            <p className="text-sm text-gray-500 mt-2">
              {featuredMessage.authorTitle} {featuredMessage.author} • {featuredMessage.date}
            </p>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line">
              {expandedMessage === featuredMessage.id
                ? featuredMessage.content
                : featuredMessage.content.substring(0, 200) + '...'}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setExpandedMessage(expandedMessage === featuredMessage.id ? null : featuredMessage.id)}
            >
              {expandedMessage === featuredMessage.id ? 'Mažiau' : 'Skaityti daugiau'}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Arkivyskupo pranešimai</CardTitle>
          <p className="text-sm text-gray-600">Archbishop&apos;s Messages</p>
          
          <div className="flex flex-wrap gap-2 mt-4">
            <Button variant={selectedType === null ? 'default' : 'outline'} size="sm" onClick={() => setSelectedType(null)}>
              Visi
            </Button>
            {Object.entries(messageTypeLabels).map(([key, labels]) => (
              <Button key={key} variant={selectedType === key ? 'default' : 'outline'} size="sm" onClick={() => setSelectedType(key)}>
                {labels.lt}
              </Button>
            ))}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            {regularMessages.map((message) => (
              <div key={message.id} className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary">{messageTypeLabels[message.type]?.lt}</Badge>
                  <span className="text-xs text-gray-500">{message.date}</span>
                </div>
                <h3 className="font-medium">{message.title}</h3>
                {message.titleEn && <p className="text-sm text-gray-600">{message.titleEn}</p>}
                <p className="text-sm text-gray-500">{message.authorTitle} {message.author}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default BishopsMessages;