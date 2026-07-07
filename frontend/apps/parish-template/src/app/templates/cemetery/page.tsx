/**
 * CATEGORY C: Cemetery Cleaning Template (82 instances)
 * Route: /templates/cemetery/page.tsx
 * 
 * Features:
 * - Service areas map: Interactive map showing cemetery sections
 * - Before/After gallery: Comparison slider component
 * - Pricing calculator: Based on grave size, cleaning frequency
 * - Subscription signup: Recurring payment setup (Stripe)
 * - Photo upload: Customers upload photos of graves for quote requests
 * 
 * SEO: Next.js Metadata API
 * Accessibility: WCAG 2.1 AA
 */

import { Metadata } from 'next';
import Image from 'next/image';
import { Suspense } from 'react';
import {
  PhotoGallery,
  ContactForm,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Separator,
} from '@jol-hub/ui';
import {
  MapPin,
  Phone,
  Mail,
  Calendar,
  Upload,
  Sparkles,
  Clock,
  CheckCircle,
  Leaf,
  Camera,
  CreditCard,
  Calculator,
} from 'lucide-react';
import { CemeteryMap } from './_components/CemeteryMap';
import { BeforeAfterSlider } from './_components/BeforeAfterSlider';
import { PricingCalculator } from './_components/PricingCalculator';
import { PhotoUploadForm } from './_components/PhotoUploadForm';
import { SubscriptionSignup } from './_components/SubscriptionSignup';

// =============================================================================
// METADATA
// =============================================================================

export const metadata: Metadata = {
  title: 'Cemetery Cleaning Services | JOL-HUB',
  description: 'Professional grave maintenance and cleaning services. Keep your loved ones\' resting place beautiful year-round.',
  keywords: ['cemetery', 'grave cleaning', 'maintenance', 'memorial care', 'subscription'],
  openGraph: {
    title: 'Cemetery Cleaning Services',
    description: 'Professional grave maintenance and care',
    type: 'website',
  },
};

// =============================================================================
// TYPES
// =============================================================================

interface CemeteryService {
  id: string;
  name: string;
  description: string;
  pricePerVisit: number;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  includes: string[];
}

interface CemeterySection {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  totalGraves: number;
  availableSlots: number;
}

// =============================================================================
// MOCK DATA
// =============================================================================

async function getCemeteryServices(): Promise<CemeteryService[]> {
  return [
    {
      id: 'basic',
      name: 'Basic Care',
      description: 'Regular cleaning and debris removal',
      pricePerVisit: 15,
      frequency: 'monthly',
      includes: ['Grass trimming', 'Debris removal', 'Flower maintenance', 'Photo report'],
    },
    {
      id: 'standard',
      name: 'Standard Care',
      description: 'Enhanced maintenance with seasonal planting',
      pricePerVisit: 25,
      frequency: 'monthly',
      includes: ['All Basic services', 'Seasonal flower planting', 'Stone cleaning', 'Weed control'],
    },
    {
      id: 'premium',
      name: 'Premium Care',
      description: 'Complete memorial care with restoration',
      pricePerVisit: 45,
      frequency: 'monthly',
      includes: ['All Standard services', 'Stone restoration', 'Fertilization', 'Winter preparation', 'Priority scheduling'],
    },
  ];
}

async function getCemeterySections(): Promise<CemeterySection[]> {
  return [
    { id: 'A', name: 'Section A - Old Cemetery', coordinates: { lat: 54.6872, lng: 25.2797 }, totalGraves: 500, availableSlots: 0 },
    { id: 'B', name: 'Section B - New Cemetery', coordinates: { lat: 54.6875, lng: 25.2800 }, totalGraves: 800, availableSlots: 45 },
    { id: 'C', name: 'Section C - Family Plots', coordinates: { lat: 54.6870, lng: 25.2795 }, totalGraves: 200, availableSlots: 5 },
    { id: 'D', name: 'Section D - Columbarium', coordinates: { lat: 54.6878, lng: 25.2805 }, totalGraves: 300, availableSlots: 50 },
  ];
}

// =============================================================================
// HERO SECTION
// =============================================================================

function HeroSection(): JSX.Element {
  return (
    <section className="relative bg-gradient-to-b from-emerald-800 to-emerald-700 py-16 text-white">
      <div className="absolute inset-0 opacity-20">
        <Image
          src="/images/cemetery-hero.jpg"
          alt="Peaceful cemetery"
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Leaf className="h-12 w-12 mx-auto mb-4 text-white/80" />
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Cemetery Cleaning Services
        </h1>
        <p className="text-xl text-white/90 max-w-2xl mx-auto">
          Honoring your loved ones with professional grave maintenance.
          Keep their resting place beautiful year-round.
        </p>
      </div>
    </section>
  );
}

// =============================================================================
// SERVICES OVERVIEW
// =============================================================================

function ServicesOverview({ services }: { services: CemeteryService[] }): JSX.Element {
  return (
    <section className="py-12">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-4">Our Services</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Choose the care plan that best suits your needs. All services include 
          regular photo updates so you can see the results.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {services.map((service) => (
          <Card key={service.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{service.name}</CardTitle>
              <CardDescription>{service.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-4">
                <span className="text-3xl font-bold">€{service.pricePerVisit}</span>
                <span className="text-muted-foreground"> / visit</span>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {service.includes.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                Subscribe Now
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default async function CemeteryTemplatePage(_props?: { params?: { locale?: string } }): Promise<JSX.Element> {
  const [services, sections] = await Promise.all([
    getCemeteryServices(),
    getCemeterySections(),
  ]);

  // Before/After images
  const beforeAfterImages = [
    {
      id: '1',
      before: '/images/cemetery/before-1.jpg',
      after: '/images/cemetery/after-1.jpg',
      caption: 'Grave restoration - Section A',
    },
    {
      id: '2',
      before: '/images/cemetery/before-2.jpg',
      after: '/images/cemetery/after-2.jpg',
      caption: 'Seasonal planting - Section B',
    },
    {
      id: '3',
      before: '/images/cemetery/before-3.jpg',
      after: '/images/cemetery/after-3.jpg',
      caption: 'Stone cleaning - Section C',
    },
  ];

  // Gallery photos
  const galleryPhotos = [
    { id: '1', src: '/images/cemetery/gallery-1.jpg', alt: 'Fresh flowers on grave', caption: 'Seasonal flower arrangements' },
    { id: '2', src: '/images/cemetery/gallery-2.jpg', alt: 'Cleaned headstone', caption: 'Stone restoration' },
    { id: '3', src: '/images/cemetery/gallery-3.jpg', alt: 'Well-maintained plot', caption: 'Regular maintenance' },
    { id: '4', src: '/images/cemetery/gallery-4.jpg', alt: 'Cemetery path', caption: 'Grounds maintenance' },
    { id: '5', src: '/images/cemetery/gallery-5.jpg', alt: 'Memorial candles', caption: 'Memorial services' },
    { id: '6', src: '/images/cemetery/gallery-6.jpg', alt: 'Winter preparation', caption: 'Winter care' },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <HeroSection />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Services Overview */}
        <ServicesOverview services={services} />

        <Separator className="my-12" />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-12">
          {/* Left Column - Interactive Features */}
          <div className="lg:col-span-2 space-y-12">
            {/* Interactive Map */}
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <MapPin className="h-6 w-6" />
                Cemetery Sections
              </h2>
              <Suspense fallback={<div className="h-96 bg-muted rounded-lg animate-pulse" />}>
                <CemeteryMap sections={sections} />
              </Suspense>
            </section>

            <Separator />

            {/* Before/After Gallery */}
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Sparkles className="h-6 w-6" />
                Our Work
              </h2>
              <div className="space-y-6">
                {beforeAfterImages.map((image) => (
                  <BeforeAfterSlider
                    key={image.id}
                    beforeImage={image.before}
                    afterImage={image.after}
                    caption={image.caption}
                  />
                ))}
              </div>
            </section>

            <Separator />

            {/* Pricing Calculator */}
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Calculator className="h-6 w-6" />
                Get a Quote
              </h2>
              <PricingCalculator services={services} />
            </section>

            <Separator />

            {/* Photo Gallery */}
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Camera className="h-6 w-6" />
                Gallery
              </h2>
              <PhotoGallery
                photos={galleryPhotos}
                columns={3}
                aspectRatio="square"
              />
            </section>

            <Separator />

            {/* Photo Upload for Quote */}
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Upload className="h-6 w-6" />
                Request Custom Quote
              </h2>
              <PhotoUploadForm />
            </section>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Subscription Signup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Start Subscription
                </CardTitle>
                <CardDescription>
                  Set up recurring care for your loved one\'s grave
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div className="h-64 bg-muted rounded animate-pulse" />}>
                  <SubscriptionSignup services={services} />
                </Suspense>
              </CardContent>
            </Card>

            {/* Quick Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Us</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <a 
                  href="tel:+37060099999"
                  className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                >
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  +370 600 99999
                </a>
                <a 
                  href="mailto:cemetery@jol-hub.eu"
                  className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                >
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  cemetery@jol-hub.eu
                </a>
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>45 Memorial Road, Vilnius Cemetery</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Mon-Fri: 8:00 - 17:00</span>
                </div>
              </CardContent>
            </Card>

            {/* Contact Form */}
            <ContactForm
              parishId="cemetery-services"
              recipientType="cemetery_admin"
            />

            {/* Why Choose Us */}
            <Card>
              <CardHeader>
                <CardTitle>Why Choose Us</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {[
                    'Professional, respectful service',
                    'Photo reports after each visit',
                    'Flexible scheduling options',
                    'All work guaranteed',
                    'Licensed and insured',
                    'Local, family-owned business',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      {item}
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
