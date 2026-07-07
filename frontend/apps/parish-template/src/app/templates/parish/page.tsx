/**
 * CATEGORY A: Parish Church Template (727 instances)
 * Route: /templates/parish/page.tsx
 * 
 * Features:
 * - Hero section with church photo, parish name, liturgical season
 * - Service schedule widget (Bitrix24 Calendar API)
 * - Priest profile card (Bitrix24 user fields)
 * - Latest announcements (1C-Bitrix CMS)
 * - Donation widget (packages/ui)
 * - Google Maps with church location + cemetery overlay
 * - Photo gallery with lazy loading
 * 
 * SEO: Next.js Metadata API
 * Accessibility: WCAG 2.1 AA
 */

import { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { 
  LiturgicalCalendar,
  ServiceSchedule,
  PhotoGallery,
  ContactForm,
  DonationWidget,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Separator,
} from '@jol-hub/ui';
import { 
  MapPin, 
  Phone, 
  Mail, 
  ChevronRight,
  Church,
  Calendar,
  Users,
  Heart
} from 'lucide-react';

// =============================================================================
// METADATA
// =============================================================================

export const metadata: Metadata = {
  title: 'Parish Church | JOL-HUB',
  description: 'Welcome to our parish. Find mass schedules, contact information, and ways to support our community.',
  keywords: ['parish', 'church', 'mass schedule', 'catholic', 'donation'],
  openGraph: {
    title: 'Parish Church',
    description: 'Welcome to our parish community',
    type: 'website',
  },
};

// =============================================================================
// TYPES
// =============================================================================

interface ParishData {
  id: string;
  name: string;
  tagline: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  heroImage: string;
  churchPhoto: string;
  location: {
    lat: number;
    lng: number;
  };
  priest: {
    name: string;
    title: string;
    photo: string;
    bio: string;
    phone?: string;
    email?: string;
  };
  bankAccount?: string;
}

interface Announcement {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
}

// =============================================================================
// MOCK DATA (Replace with actual Bitrix24/CMS API calls)
// =============================================================================

async function getParishData(): Promise<ParishData> {
  // TODO: Fetch from Bitrix24 API
  return {
    id: 'parish-001',
    name: 'St. Mary\'s Parish',
    tagline: 'A welcoming community of faith',
    description: 'St. Mary\'s Parish has been serving the local community for over 150 years. We welcome all to join us in worship and fellowship.',
    address: '123 Church Street, Vilnius, Lithuania',
    phone: '+370 5 123 4567',
    email: 'info@stmarys.jol-hub.eu',
    heroImage: '/images/church-hero.jpg',
    churchPhoto: '/images/church-building.jpg',
    location: {
      lat: 54.6872,
      lng: 25.2797,
    },
    priest: {
      name: 'Fr. John Smith',
      title: 'Parish Priest',
      photo: '/images/priest.jpg',
      bio: 'Fr. John has been serving our parish since 2015. He is passionate about community outreach and youth ministry.',
      phone: '+370 600 12345',
      email: 'fr.john@stmarys.jol-hub.eu',
    },
    bankAccount: 'LT00 0000 0000 0000 0000',
  };
}

async function getAnnouncements(): Promise<Announcement[]> {
  // TODO: Fetch from 1C-Bitrix CMS
  return [
    {
      id: '1',
      title: 'Easter Celebration Schedule',
      excerpt: 'Join us for Holy Week services and Easter celebrations. Special schedules for Palm Sunday, Holy Thursday, Good Friday, and Easter Sunday.',
      date: '2024-03-15',
      category: 'Events',
    },
    {
      id: '2',
      title: 'New Youth Group Starting',
      excerpt: 'We are excited to announce a new youth group for ages 13-18. First meeting will be held next Friday at 6 PM.',
      date: '2024-03-10',
      category: 'Youth',
    },
    {
      id: '3',
      title: 'Church Renovation Update',
      excerpt: 'Thanks to your generous donations, we have completed the roof repairs. Next phase will focus on interior restoration.',
      date: '2024-03-05',
      category: 'News',
    },
  ];
}

// =============================================================================
// COMPONENTS
// =============================================================================

function HeroSection({ parish }: { parish: ParishData }): JSX.Element {
  return (
    <section className="relative h-[500px] w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={parish.heroImage}
          alt={`${parish.name} - Church building`}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12">
        <Badge className="w-fit mb-4 bg-primary/90 text-primary-foreground">
          <Church className="h-3 w-3 mr-1" />
          Catholic Parish
        </Badge>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2">
          {parish.name}
        </h1>
        <p className="text-xl text-white/90 max-w-2xl">
          {parish.tagline}
        </p>
      </div>
    </section>
  );
}

function PriestProfile({ priest }: { priest: ParishData['priest'] }): JSX.Element {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Parish Priest
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
            <Image
              src={priest.photo}
              alt={priest.name}
              fill
              className="object-cover"
              sizes="128px"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{priest.name}</h3>
            <p className="text-sm text-muted-foreground mb-2">{priest.title}</p>
            <p className="text-sm mb-3">{priest.bio}</p>
            <div className="space-y-1 text-sm">
              {priest.phone && (
                <a 
                  href={`tel:${priest.phone}`}
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Phone className="h-4 w-4" />
                  {priest.phone}
                </a>
              )}
              {priest.email && (
                <a 
                  href={`mailto:${priest.email}`}
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  {priest.email}
                </a>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AnnouncementsSection({ announcements }: { announcements: Announcement[] }): JSX.Element {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Latest Announcements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <article 
              key={announcement.id}
              className="group border-b last:border-0 pb-4 last:pb-0"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <Badge variant="secondary" className="text-xs">
                  {announcement.category}
                </Badge>
                <time className="text-xs text-muted-foreground">
                  {new Date(announcement.date).toLocaleDateString('lt-LT')}
                </time>
              </div>
              <h3 className="font-semibold group-hover:text-primary transition-colors">
                {announcement.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {announcement.excerpt}
              </p>
              <Button variant="link" className="p-0 h-auto mt-2 text-sm">
                Read more
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MapSection({ parish }: { parish: ParishData }): JSX.Element {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Find Us
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Google Maps Embed */}
        <div className="relative w-full h-64 rounded-lg overflow-hidden bg-muted">
          <iframe
            src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2306.5!2d${parish.location.lng}!3d${parish.location.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTTCsDQxJzE0LjAiTiAyNcKwMTYnNDcuMCJF!5e0!3m2!1sen!2slt!4v1`}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`${parish.name} location`}
            className="absolute inset-0"
          />
        </div>

        {/* Address */}
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{parish.name}</p>
            <p className="text-sm text-muted-foreground">{parish.address}</p>
          </div>
        </div>

        {/* Cemetery Toggle */}
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <input 
            type="checkbox" 
            id="cemetery-toggle"
            className="rounded border-gray-300"
          />
          <label htmlFor="cemetery-toggle" className="text-sm cursor-pointer">
            Show cemetery location
          </label>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default async function ParishTemplatePage(): Promise<JSX.Element> {
  const [parish, announcements] = await Promise.all([
    getParishData(),
    getAnnouncements(),
  ]);

  if (!parish) {
    notFound();
  }

  // Mock photos for gallery
  const galleryPhotos = [
    { id: '1', src: '/images/gallery/1.jpg', alt: 'Church interior', caption: 'Main altar' },
    { id: '2', src: '/images/gallery/2.jpg', alt: 'Easter celebration', caption: 'Easter 2024' },
    { id: '3', src: '/images/gallery/3.jpg', alt: 'Youth group', caption: 'Youth ministry' },
    { id: '4', src: '/images/gallery/4.jpg', alt: 'Community event', caption: 'Parish festival' },
    { id: '5', src: '/images/gallery/5.jpg', alt: 'Wedding ceremony', caption: 'Wedding blessing' },
    { id: '6', src: '/images/gallery/6.jpg', alt: 'Christmas mass', caption: 'Christmas Eve' },
  ];

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <HeroSection parish={parish} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Welcome to Our Parish</h2>
              <p className="text-muted-foreground leading-relaxed">
                {parish.description}
              </p>
            </section>

            <Separator />

            {/* Service Schedule */}
            <section>
              <ServiceSchedule parishId={parish.id} />
            </section>

            <Separator />

            {/* Photo Gallery */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Parish Life</h2>
              <PhotoGallery 
                photos={galleryPhotos}
                columns={3}
                aspectRatio="square"
              />
            </section>

            <Separator />

            {/* Contact Form */}
            <section>
              <ContactForm 
                parishId={parish.id}
                recipientType="general"
              />
            </section>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Liturgical Calendar */}
            <LiturgicalCalendar />

            {/* Priest Profile */}
            <PriestProfile priest={parish.priest} />

            {/* Announcements */}
            <AnnouncementsSection announcements={announcements} />

            {/* Donation Widget */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Support Our Parish
                </CardTitle>
                <CardDescription>
                  Your generosity helps us continue our mission
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DonationWidget
                  parishId={parish.id}
                  parishName={parish.name}
                  bankAccount={parish.bankAccount}
                  language="lt"
                  currency="EUR"
                />
              </CardContent>
            </Card>

            {/* Map */}
            <MapSection parish={parish} />

            {/* Quick Contact */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <a 
                  href={`tel:${parish.phone}`}
                  className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                >
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {parish.phone}
                </a>
                <a 
                  href={`mailto:${parish.email}`}
                  className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                >
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {parish.email}
                </a>
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{parish.address}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
