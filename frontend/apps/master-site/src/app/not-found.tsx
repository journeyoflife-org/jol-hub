/**
 * Global 404 Not Found page for JOL-HUB.
 * 
 * Handles:
 * - Invalid parish subdomains
 * - Missing pages
 * - Search suggestions for nearby parishes
 * 
 * This is a Client Component to allow interactive search.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Separator,
} from '@jol-hub/ui';
import {
  Search,
  Church,
  MapPin,
  ArrowLeft,
  Home,
  HelpCircle,
} from 'lucide-react';

// =============================================================================
// MOCK DATA
// =============================================================================

/**
 * Mock parish suggestions for search.
 * TODO: Replace with API call
 */
const MOCK_PARISHES = [
  { name: "St. Mary's Parish", subdomain: 'stmarys', city: 'Vilnius', diocese: 'Vilnius' },
  { name: "St. John the Baptist", subdomain: 'stjohn', city: 'Kaunas', diocese: 'Kaunas' },
  { name: "St. Joseph's Parish", subdomain: 'stjoseph', city: 'Šiauliai', diocese: 'Šiauliai' },
  { name: "St. Peter's Parish", subdomain: 'stpeter', city: 'Telšiai', diocese: 'Telšiai' },
  { name: "St. Anne's Parish", subdomain: 'stanne', city: 'Panevėžys', diocese: 'Panevėžys' },
  { name: 'Holy Cross Parish', subdomain: 'holy-cross', city: 'Vilnius', diocese: 'Vilnius' },
  { name: 'St. Francis of Assisi', subdomain: 'st-francis', city: 'Kaunas', diocese: 'Kaunas' },
  { name: "St. Thérèse of Lisieux", subdomain: 'st-therese', city: 'Vilnius', diocese: 'Vilnius' },
  { name: 'Divine Mercy Parish', subdomain: 'divine-mercy', city: 'Kaunas', diocese: 'Kaunas' },
  { name: 'Sacred Heart Parish', subdomain: 'sacred-heart', city: 'Šiauliai', diocese: 'Šiauliai' },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * 404 Not Found page component.
 */
export default function NotFoundPage(): JSX.Element {
  const searchParams = useSearchParams();
  const attemptedPath = searchParams.get('path') ?? '';
  const [searchQuery, setSearchQuery] = useState('');

  // Filter parishes based on search
  const filteredParishes = searchQuery
    ? MOCK_PARISHES.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.subdomain.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : MOCK_PARISHES.slice(0, 6);

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b bg-muted/30 py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            {/* 404 Icon */}
            <div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
              <span className="text-4xl font-bold text-primary">404</span>
            </div>

            <h1 className="mb-4 text-3xl font-bold lg:text-4xl">
              Parish Not Found
            </h1>

            <p className="mb-2 text-lg text-muted-foreground">
              We couldn&apos;t find the parish you&apos;re looking for.
            </p>

            {attemptedPath && (
              <p className="text-sm text-muted-foreground">
                Attempted: <code className="rounded bg-muted px-2 py-1">{attemptedPath}</code>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="container mx-auto -mt-8 px-4">
        <div className="mx-auto max-w-xl">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Find Your Parish
              </CardTitle>
              <CardDescription>
                Search by parish name, city, or diocese
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search parishes..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Parish Suggestions */}
      <section className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-6 text-xl font-semibold">
            {searchQuery ? 'Search Results' : 'Popular Parishes'}
          </h2>

          {filteredParishes.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredParishes.map((parish) => (
                <ParishCard key={parish.subdomain} parish={parish} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border bg-muted/50 p-8 text-center">
              <HelpCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-medium">No parishes found</h3>
              <p className="text-muted-foreground">
                Try searching with different keywords or browse all parishes below.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Browse by Diocese */}
      <section className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-6 text-xl font-semibold">Browse by Diocese</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <DioceseCard
                name="Vilnius"
                fullName="Archdiocese of Vilnius"
                parishCount={3}
              />
              <DioceseCard
                name="Kaunas"
                fullName="Archdiocese of Kaunas"
                parishCount={3}
              />
              <DioceseCard
                name="Šiauliai"
                fullName="Diocese of Šiauliai"
                parishCount={2}
              />
              <DioceseCard
                name="Telšiai"
                fullName="Diocese of Telšiai"
                parishCount={1}
              />
              <DioceseCard
                name="Panevėžys"
                fullName="Diocese of Panevėžys"
                parishCount={1}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-xl font-semibold">Need Help?</h2>
          <p className="mb-6 text-muted-foreground">
            If you&apos;re looking for a specific parish and can&apos;t find it, 
            please contact our support team or visit the main JOL-HUB website.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild variant="outline">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go to Homepage
              </Link>
            </Button>
            <Button asChild>
              <Link href="mailto:support@jol-hub.eu">
                <HelpCircle className="mr-2 h-4 w-4" />
                Contact Support
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} JOL-HUB. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

// =============================================================================
// SUBCOMPONENTS
// =============================================================================

/**
 * Parish card component.
 */
interface ParishCardProps {
  parish: {
    name: string;
    subdomain: string;
    city: string;
    diocese: string;
  };
}

function ParishCard({ parish }: ParishCardProps): JSX.Element {
  return (
    <Link href={`https://${parish.subdomain}.jol-hub.eu`}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Church className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold">{parish.name}</h3>
            </div>
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>{parish.city}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs">{parish.diocese} Diocese</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * Diocese card component.
 */
interface DioceseCardProps {
  name: string;
  fullName: string;
  parishCount: number;
}

function DioceseCard({ name, fullName, parishCount }: DioceseCardProps): JSX.Element {
  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-md">
      <CardContent className="p-4 text-center">
        <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
          <MapPin className="h-6 w-6 text-secondary" />
        </div>
        <h3 className="font-semibold">{name}</h3>
        <p className="text-xs text-muted-foreground">{fullName}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {parishCount} {parishCount === 1 ? 'parish' : 'parishes'}
        </p>
      </CardContent>
    </Card>
  );
}
