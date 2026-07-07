/**
 * CATEGORY B: Funeral Services Template (64 instances)
 * Route: /templates/funeral/page.tsx
 * 
 * Features:
 * - Obituary list: ISR (Incremental Static Regeneration) every 1 hour
 * - Search/filter by date, surname
 * - Flower ordering form: Integration with local florist API
 * - Livestream embed: YouTube/Facebook with password protection modal
 * - Condolence book: Guestbook with moderation (Django API)
 * - Contact form: Direct to funeral director (Bitrix24 CRM contact)
 * 
 * SEO: Next.js Metadata API
 * Accessibility: WCAG 2.1 AA
 */

import { Metadata } from 'next';
import Image from 'next/image';
import { Suspense } from 'react';
import {
  ContactForm,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Separator,
} from '@jol-hub/ui';
import {
  Flower,
  Video,
  BookOpen,
  Phone,
  Mail,
  MapPin,
  Heart,
} from 'lucide-react';
import { ObituaryList } from './_components/ObituaryList';
import { CondolenceBook } from './_components/CondolenceBook';
import { FlowerOrderForm } from './_components/FlowerOrderForm';
import { LivestreamEmbed } from './_components/LivestreamEmbed';

// =============================================================================
// METADATA
// =============================================================================

export const metadata: Metadata = {
  title: 'Funeral Services | JOL-HUB',
  description: 'Compassionate funeral services. View obituaries, order flowers, and leave condolences.',
  keywords: ['funeral', 'obituary', 'condolences', 'memorial', 'services'],
  openGraph: {
    title: 'Funeral Services',
    description: 'Compassionate support during difficult times',
    type: 'website',
  },
  robots: {
    index: true,
    follow: false, // Privacy - obituary pages not indexed deeply
  },
};

// ISR: revalidate every 1 hour for obituary list
export const revalidate = 3600;

// =============================================================================
// TYPES
// =============================================================================

export interface Obituary {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  dateOfDeath: string;
  funeralDate?: string;
  funeralTime?: string;
  funeralLocation?: string;
  photo?: string;
  biography?: string;
  streamUrl?: string;
  streamPassword?: string;
  hasStream: boolean;
  isPublic: boolean;
}

export interface Condolence {
  id: string;
  obituaryId: string;
  name: string;
  message: string;
  createdAt: string;
  isApproved: boolean;
}

// =============================================================================
// DATA FETCHING
// =============================================================================

async function getObituaries(): Promise<Obituary[]> {
  const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL;
  
  if (!apiUrl) {
    return getMockObituaries();
  }

  try {
    const response = await fetch(`${apiUrl}/api/obituaries/`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) throw new Error('Failed to fetch obituaries');
    return response.json();
  } catch {
    return getMockObituaries();
  }
}

async function getFuneralDirectorInfo(): Promise<{
  name: string;
  phone: string;
  email: string;
  address: string;
  bitrixContactId: string;
}> {
  return {
    name: 'Thomas Kazlauskas',
    phone: '+370 600 88888',
    email: 'director@funeral.jol-hub.eu',
    address: '45 Memorial Road, Vilnius',
    bitrixContactId: 'CONTACT-789',
  };
}

function getMockObituaries(): Obituary[] {
  return [
    {
      id: 'obit-001',
      firstName: 'Maria',
      lastName: 'Petrauskiene',
      dateOfBirth: '1940-03-15',
      dateOfDeath: '2024-03-01',
      funeralDate: '2024-03-05',
      funeralTime: '11:00',
      funeralLocation: 'St. Mary\'s Church, Vilnius',
      photo: '/images/obituaries/1.jpg',
      biography: 'Beloved mother, grandmother, and devoted parishioner for over 60 years.',
      hasStream: true,
      streamUrl: 'https://youtube.com/watch?v=example',
      streamPassword: 'family2024',
      isPublic: true,
    },
    {
      id: 'obit-002',
      firstName: 'Jonas',
      lastName: 'Jonaitis',
      dateOfBirth: '1955-07-22',
      dateOfDeath: '2024-02-28',
      funeralDate: '2024-03-02',
      funeralTime: '10:00',
      funeralLocation: 'Church of All Saints, Kaunas',
      photo: '/images/obituaries/2.jpg',
      biography: 'A dedicated teacher and family man who touched many lives.',
      hasStream: false,
      isPublic: true,
    },
    {
      id: 'obit-003',
      firstName: 'Elena',
      lastName: 'Vaitiekūnaitė',
      dateOfBirth: '1932-12-08',
      dateOfDeath: '2024-02-20',
      funeralDate: '2024-02-24',
      funeralTime: '14:00',
      funeralLocation: 'St. Joseph\'s Church, Klaipeda',
      hasStream: false,
      isPublic: true,
    },
  ];
}

// =============================================================================
// HERO SECTION
// =============================================================================

function HeroSection(): JSX.Element {
  return (
    <section className="relative bg-gradient-to-b from-slate-800 to-slate-700 py-16 text-white">
      <div className="absolute inset-0 opacity-20">
        <Image
          src="/images/funeral-hero.jpg"
          alt="Peaceful chapel"
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Heart className="h-12 w-12 mx-auto mb-4 text-white/80" />
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Funeral Services
        </h1>
        <p className="text-xl text-white/90 max-w-2xl mx-auto">
          Providing compassionate, dignified funeral services to help families
          honour their loved ones and find comfort in community.
        </p>
      </div>
    </section>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default async function FuneralTemplatePage(_props?: { params?: { locale?: string } }): Promise<JSX.Element> {
  const [obituaries, director] = await Promise.all([
    getObituaries(),
    getFuneralDirectorInfo(),
  ]);

  return (
    <main className="min-h-screen bg-slate-50">
      <HeroSection />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Obituaries and Stream */}
          <div className="lg:col-span-2 space-y-8">
            {/* Obituary List with Search/Filter */}
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <BookOpen className="h-6 w-6" />
                Recent Obituaries
              </h2>
              <Suspense fallback={
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-muted rounded-lg" />
                  ))}
                </div>
              }>
                <ObituaryList obituaries={obituaries} />
              </Suspense>
            </section>

            <Separator />

            {/* Livestream Section */}
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Video className="h-6 w-6" />
                Live Broadcast
              </h2>
              <Suspense fallback={<div className="h-64 bg-muted rounded-lg animate-pulse" />}>
                <LivestreamEmbed obituaries={obituaries} />
              </Suspense>
            </section>

            <Separator />

            {/* Condolence Book */}
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Heart className="h-6 w-6" />
                Condolence Book
              </h2>
              <Suspense fallback={<div className="h-64 bg-muted rounded-lg animate-pulse" />}>
                <CondolenceBook obituaries={obituaries} />
              </Suspense>
            </section>

            <Separator />

            {/* Flower Ordering */}
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Flower className="h-6 w-6" />
                Order Flowers
              </h2>
              <Suspense fallback={<div className="h-64 bg-muted rounded-lg animate-pulse" />}>
                <FlowerOrderForm obituaries={obituaries} />
              </Suspense>
            </section>
          </div>

          {/* Right Column - Contact */}
          <div className="space-y-6">
            {/* Director Contact */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Funeral Director</CardTitle>
                <CardDescription>Available 24/7 for your needs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
                    <Image
                      src="/images/director.jpg"
                      alt={director.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div>
                    <p className="font-semibold">{director.name}</p>
                    <p className="text-sm text-muted-foreground">Funeral Director</p>
                  </div>
                </div>
                <Separator />
                <a 
                  href={`tel:${director.phone}`}
                  className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                >
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {director.phone}
                </a>
                <a 
                  href={`mailto:${director.email}`}
                  className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                >
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {director.email}
                </a>
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{director.address}</span>
                </div>
              </CardContent>
            </Card>

            {/* Contact Form for Director */}
            <ContactForm
              parishId="funeral-services"
              recipientType="funeral_director"
              recipientEmail={director.email}
            />

            {/* Services Info */}
            <Card>
              <CardHeader>
                <CardTitle>Our Services</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {[
                    'Traditional funeral ceremonies',
                    'Cremation services',
                    'Memorial masses',
                    'Graveside services',
                    'Live stream of ceremony',
                    '24/7 funeral coordination',
                    'Grief counselling referrals',
                    'Document assistance',
                  ].map((service) => (
                    <li key={service} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                      {service}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
