'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@jol-hub/ui';
import { cn } from '@jol-hub/ui';

export interface VocationStory {
  id: string;
  name: string;
  age: number;
  parish: string;
  stage: 'discernment' | 'seminary' | 'ordination' | 'deacon';
  testimony: string;
  imageUrl?: string;
}

export interface VocationsProgram {
  id: string;
  name: string;
  nameEn?: string;
  description: string;
  nextDate: string;
  location: string;
  registrationUrl?: string;
}

export interface VocationsPortalProps {
  stories?: VocationStory[];
  programs?: VocationsProgram[];
  onRegister?: (program: VocationsProgram) => void;
  className?: string;
}

const stageLabels: Record<string, { lt: string; en: string }> = {
  discernment: { lt: 'Pašaukimo tyrime', en: 'Discernment' },
  seminary: { lt: 'Kunigų seminarijoje', en: 'Seminary' },
  ordination: { lt: 'Įšventinėjama', en: 'Ordination' },
  deacon: { lt: 'Diakonas', en: 'Deacon' },
};

const defaultStories: VocationStory[] = [
  { id: 'v-1', name: 'Jonas', age: 25, parish: 'Vilniaus Šv. Jonų parapija', stage: 'seminary', testimony: 'Atradau savo pašaukimą melsdamasis prieš Aušros Vartus...' },
  { id: 'v-2', name: 'Petras', age: 28, parish: 'Trakų parapija', stage: 'ordination', testimony: 'Po trejų metų seminarijoje laukiu įšventinimo...' },
  { id: 'v-3', name: 'Andrius', age: 22, parish: 'Šalčininkų parapija', stage: 'discernment', testimony: 'Vis dar ieškau savo kelio...' },
];

const defaultPrograms: VocationsProgram[] = [
  { id: 'p-1', name: 'Pašaukimo savaitgalis', nameEn: 'Vocation Weekend', description: 'Savaitgalis tiems, kurie svarsto apie kunigystę.', nextDate: '2026-05-15', location: 'Vilniaus kunigų seminarija', registrationUrl: '/register/vocation-weekend' },
  { id: 'p-2', name: 'Rekolekcijos jaunimui', nameEn: 'Youth Retreat', description: 'Rekolekcijos jauniems vyrams, ieškantiems savo kelio.', nextDate: '2026-06-01', location: 'Kernavė' },
  { id: 'p-3', name: 'Dvasinės konsultacijos', nameEn: 'Spiritual Direction', description: 'Individualios konsultacijos su dvasios vadovu.', nextDate: 'Įvairios datos', location: 'Vilniaus arkivyskupija' },
];

export function VocationsPortal({ 
  stories = defaultStories, 
  programs = defaultPrograms,
  onRegister,
  className 
}: VocationsPortalProps) {
  const [selectedStory, setSelectedStory] = useState<VocationStory | null>(null);

  return (
    <div className={cn('space-y-8', className)}>
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary to-secondary text-white">
        <CardContent className="p-8 text-center">
          <h2 className="text-3xl font-heading font-bold mb-2">Kunigystės pašaukimas</h2>
          <p className="text-lg opacity-90">Priestly Vocations</p>
          <p className="mt-4 opacity-80 max-w-2xl mx-auto">
            Ar jauti Dievo kvietimą į kunigystę? Sužinok daugiau apie pašaukimo kelią ir galimybes.
          </p>
          <Button className="mt-6 bg-white text-primary hover:bg-gray-100">
            Susisiekti su mumis
          </Button>
        </CardContent>
      </Card>

      {/* Vocation Stories */}
      <Card>
        <CardHeader>
          <CardTitle>Pašaukimo istorijos</CardTitle>
          <p className="text-sm text-gray-600">Vocation Stories</p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {stories.map((story) => (
              <div
                key={story.id}
                className="p-4 border rounded-lg hover:shadow-lg cursor-pointer transition-shadow"
                onClick={() => setSelectedStory(selectedStory?.id === story.id ? null : story)}
              >
                <div className="text-center mb-3">
                  <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                    {story.name.charAt(0)}
                  </div>
                </div>
                <h3 className="font-medium text-center">{story.name}, {story.age} m.</h3>
                <p className="text-sm text-gray-600 text-center">{story.parish}</p>
                <div className="mt-2 text-center">
                  <Badge variant="secondary">{stageLabels[story.stage]?.lt}</Badge>
                </div>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{story.testimony}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Programs */}
      <Card>
        <CardHeader>
          <CardTitle>Programos ir renginiai</CardTitle>
          <p className="text-sm text-gray-600">Programs and Events</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {programs.map((program) => (
              <div key={program.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{program.name}</h3>
                    {program.nameEn && <p className="text-sm text-gray-600">{program.nameEn}</p>}
                    <p className="text-sm text-gray-600 mt-2">{program.description}</p>
                    <div className="flex gap-4 text-sm text-gray-500 mt-2">
                      <span>📅 {program.nextDate}</span>
                      <span>📍 {program.location}</span>
                    </div>
                  </div>
                  <Button onClick={() => onRegister?.(program)}>Registruotis</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact Section */}
      <Card className="bg-gray-50 dark:bg-gray-800">
        <CardContent className="p-6">
          <h3 className="font-heading text-xl mb-4">Dvasinio vadovo kontaktai</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="font-medium">Pašaukimo direkcija</p>
              <p className="text-sm text-gray-600">vocation@vilniusarkivyskupija.lt</p>
            </div>
            <div>
              <p className="font-medium">Vilniaus kunigų seminarija</p>
              <p className="text-sm text-gray-600">seminary@vilnius.lt</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default VocationsPortal;
