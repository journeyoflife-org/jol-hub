/**
 * Dynamic parish homepage for multi-tenant JOL-HUB.
 * 
 * Server Component that renders the parish landing page with:
 * - Hero section with parish name and liturgical season
 * - Quick actions (donate, service times, contact)
 * - Latest announcements
 * - Priest profile
 * 
 * PERFORMANCE:
 * - Static generation with ISR (1 hour)
 * - Edge Runtime compatible
 */

import { notFound } from 'next/navigation';
import { resolveParish } from '@/lib/tenant/resolver';
import { getCurrentLiturgicalSeason, type ParishConfig, type ServiceTime } from '@/lib/tenant/config';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Separator,
} from '@jol-hub/ui';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Calendar,
  Heart,
  User,
  ChevronRight,
  Church,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Page props interface.
 */
interface ParishPageProps {
  /** Route parameters */
  params: {
    /** Parish subdomain */
    parish: string;
  };
}

/**
 * Mock announcement data.
 * TODO: Replace with API call to Django backend
 */
interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  category: 'general' | 'event' | 'urgent';
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

/**
 * Parish homepage component.
 * 
 * @param props - Page props
 * @returns JSX element
 */
export default async function ParishPage(
  props: ParishPageProps
): Promise<JSX.Element> {
  const { params } = props;

  // Fetch parish configuration
  const parish = await resolveParish(params.parish);

  // If parish not found, show 404
  if (!parish) {
    notFound();
  }

  // Get current liturgical season
  const season = getCurrentLiturgicalSeason();

  // Fetch mock data
  const announcements = getMockAnnouncements();
  const upcomingServices = getUpcomingServices(parish.serviceTimes);

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <HeroSection parish={parish} season={season} />

      {/* Quick Actions */}
      <QuickActionsSection parish={parish} />

      {/* Main Content Grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Announcements */}
          <div className="lg:col-span-2 space-y-8">
            <AnnouncementsSection announcements={announcements} />
            <ServiceTimesSection serviceTimes={parish.serviceTimes} />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            <PriestProfileSection parish={parish} />
            <ContactSection parish={parish} />
            <QuickLinksSection />
          </div>
        </div>
      </div>
    </main>
  );
}

// =============================================================================
// SECTION COMPONENTS
// =============================================================================

/**
 * Hero section with parish name and liturgical season.
 */
function HeroSection({
  parish,
  season,
}: {
  parish: ParishConfig;
  season: string;
}): JSX.Element {
  const seasonDisplay = getSeasonDisplayName(season);
  const seasonColor = getSeasonColor(season);

  return (
    <section
      className="relative overflow-hidden py-24 lg:py-32"
      style={{ backgroundColor: 'var(--parish-primary, #00843D)' }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--parish-accent)_0%,_transparent_70%)]" />
      </div>

      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          {/* Liturgical Season Badge */}
          <Badge
            className="mb-6 px-4 py-1.5 text-sm font-medium"
            style={{
              backgroundColor: 'var(--parish-accent, #D4AF37)',
              color: '#000',
            }}
          >
            {seasonDisplay}
          </Badge>

          {/* Parish Name */}
          <h1 className="mb-4 text-4xl font-bold text-white lg:text-6xl"
              style={{ fontFamily: 'var(--parish-heading-font)' }}>
            {parish.name}
          </h1>

          {/* Parish Description */}
          {parish.description && (
            <p className="mx-auto max-w-2xl text-lg text-white/90">
              {parish.description}
            </p>
          )}

          {/* Diocese Info */}
          {parish.diocese && (
            <p className="mt-4 text-sm text-white/70">
              {parish.diocese.name}
            </p>
          )}

          {/* Patron Saint */}
          {parish.patronSaint && (
            <p className="mt-2 text-sm text-white/60">
              Patron: {parish.patronSaint}
              {parish.feastDay && ` • Feast Day: ${parish.feastDay}`}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="hsl(var(--background))"
          />
        </svg>
      </div>
    </section>
  );
}

/**
 * Quick actions section (donate, service times, contact).
 */
function QuickActionsSection({ parish }: { parish: ParishConfig }): JSX.Element {
  return (
    <section className="container mx-auto -mt-8 px-4 relative z-10">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Donate */}
        {parish.features.donations && (
          <Card className="group cursor-pointer transition-shadow hover:shadow-lg">
            <CardContent className="flex items-center gap-4 p-6">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: 'var(--parish-primary)', color: 'white' }}
              >
                <Heart className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Donate</h3>
                <p className="text-sm text-muted-foreground">Support our parish</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Service Times */}
        <Card className="group cursor-pointer transition-shadow hover:shadow-lg">
          <CardContent className="flex items-center gap-4 p-6">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: 'var(--parish-secondary)', color: 'white' }}
            >
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold">Mass Times</h3>
              <p className="text-sm text-muted-foreground">View schedule</p>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="group cursor-pointer transition-shadow hover:shadow-lg">
          <CardContent className="flex items-center gap-4 p-6">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: 'var(--parish-accent)', color: 'black' }}
            >
              <Phone className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold">Contact</h3>
              <p className="text-sm text-muted-foreground">Get in touch</p>
            </div>
          </CardContent>
        </Card>

        {/* Events */}
        {parish.features.eventRegistration && (
          <Card className="group cursor-pointer transition-shadow hover:shadow-lg">
            <CardContent className="flex items-center gap-4 p-6">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: 'var(--parish-primary)', color: 'white' }}
              >
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Events</h3>
                <p className="text-sm text-muted-foreground">Upcoming activities</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}

/**
 * Announcements section.
 */
function AnnouncementsSection({
  announcements,
}: {
  announcements: Announcement[];
}): JSX.Element {
  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Latest Announcements</h2>
        <Button variant="ghost" size="sm">
          View All <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <Card key={announcement.id} className="transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <Badge
                    variant={announcement.category === 'urgent' ? 'destructive' : 'secondary'}
                    className="mb-2"
                  >
                    {announcement.category}
                  </Badge>
                  <CardTitle className="text-lg">{announcement.title}</CardTitle>
                </div>
                <span className="text-sm text-muted-foreground">{announcement.date}</span>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                {announcement.content}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

/**
 * Service times section.
 */
function ServiceTimesSection({
  serviceTimes,
}: {
  serviceTimes: ServiceTime[];
}): JSX.Element {
  // Group by day
  const byDay = serviceTimes.reduce<Record<string, ServiceTime[]>>((acc, time) => {
    if (!acc[time.dayName]) {
      acc[time.dayName] = [];
    }
    acc[time.dayName].push(time);
    return acc;
  }, {});

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <section>
      <h2 className="mb-6 text-2xl font-bold">Service Times</h2>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {days.map((day) => {
              const times = byDay[day];
              if (!times || times.length === 0) return null;

              return (
                <div key={day} className="flex gap-4">
                  <div className="w-24 shrink-0 font-medium">{day}</div>
                  <div className="flex flex-wrap gap-2">
                    {times.map((time, idx) => (
                      <Badge
                        key={idx}
                        variant={time.type === 'mass' ? 'default' : 'outline'}
                        className="text-xs"
                      >
                        {time.time} - {time.type === 'mass' ? 'Mass' : time.type}
                        {time.language && time.language !== 'Lithuanian' && (
                          <span className="ml-1 opacity-70">({time.language})</span>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

/**
 * Priest profile section.
 */
function PriestProfileSection({ parish }: { parish: ParishConfig }): JSX.Element {
  if (!parish.priestName) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Parish Priest</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Contact the parish office for priest information.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parish Priest</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={parish.priestPhoto} alt={parish.priestName} />
            <AvatarFallback className="text-2xl">
              <User className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{parish.priestName}</h3>
            <p className="text-sm text-muted-foreground">Parish Administrator</p>
            {parish.contact.email && (
              <a
                href={`mailto:${parish.contact.email}`}
                className="mt-2 inline-flex items-center text-sm text-primary hover:underline"
              >
                <Mail className="mr-1 h-4 w-4" />
                Contact
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Contact information section.
 */
function ContactSection({ parish }: { parish: ParishConfig }): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Us</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {parish.contact.address && (
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="text-sm">
              <p>{parish.contact.address.street}</p>
              <p>
                {parish.contact.address.city}, {parish.contact.address.postalCode}
              </p>
              <p>{parish.contact.address.country}</p>
            </div>
          </div>
        )}

        {parish.contact.phone && (
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 shrink-0 text-muted-foreground" />
            <a href={`tel:${parish.contact.phone}`} className="text-sm hover:underline">
              {parish.contact.phone}
            </a>
          </div>
        )}

        {parish.contact.email && (
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 shrink-0 text-muted-foreground" />
            <a href={`mailto:${parish.contact.email}`} className="text-sm hover:underline">
              {parish.contact.email}
            </a>
          </div>
        )}

        {parish.officeHours && (
          <>
            <Separator />
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium">Office Hours</p>
                <p className="text-muted-foreground">
                  {parish.officeHours.days}: {parish.officeHours.hours}
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Quick links section.
 */
function QuickLinksSection(): JSX.Element {
  const links = [
    { label: 'Parish History', href: '#history' },
    { label: 'Sacraments', href: '#sacraments' },
    { label: 'Youth Ministry', href: '#youth' },
    { label: 'Volunteer', href: '#volunteer' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Links</CardTitle>
      </CardHeader>
      <CardContent>
        <nav className="space-y-2">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
            >
              {link.label}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </a>
          ))}
        </nav>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// MOCK DATA
// =============================================================================

/**
 * Gets mock announcements.
 * TODO: Replace with API call
 */
function getMockAnnouncements(): Announcement[] {
  return [
    {
      id: '1',
      title: 'Advent Preparation Begins',
      content: 'Join us for special Advent prayers every evening at 6:00 PM. Confessions available before all Masses during Advent.',
      date: 'Dec 1, 2024',
      category: 'general',
    },
    {
      id: '2',
      title: 'Christmas Schedule Announcement',
      content: 'Christmas Eve Masses at 4:00 PM (children\'s), 6:00 PM, 8:00 PM, and Midnight. Christmas Day Masses at 8:00 AM, 10:00 AM, and 12:00 PM.',
      date: 'Dec 15, 2024',
      category: 'event',
    },
    {
      id: '3',
      title: 'Parish Food Drive',
      content: 'Help those in need this Christmas season. Non-perishable food items can be dropped off at the parish office during office hours.',
      date: 'Dec 10, 2024',
      category: 'urgent',
    },
  ];
}

/**
 * Gets upcoming services for display.
 */
function getUpcomingServices(serviceTimes: ServiceTime[]): ServiceTime[] {
  const today = new Date().getDay();
  
  // Get next 3 services
  return serviceTimes
    .filter((st) => st.dayOfWeek >= today)
    .slice(0, 3);
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Gets display name for liturgical season.
 */
function getSeasonDisplayName(season: string): string {
  const names: Record<string, string> = {
    advent: 'Advent Season',
    christmas: 'Christmas Season',
    ordinary_time: 'Ordinary Time',
    lent: 'Lenten Season',
    holy_week: 'Holy Week',
    easter: 'Easter Season',
    pentecost: 'Pentecost',
  };
  return names[season] ?? 'Liturgical Year';
}

/**
 * Gets color for liturgical season.
 */
function getSeasonColor(season: string): string {
  const colors: Record<string, string> = {
    advent: '#4B0082', // Purple
    christmas: '#FFD700', // Gold
    ordinary_time: '#00843D', // Green
    lent: '#800080', // Purple
    holy_week: '#FF0000', // Red
    easter: '#FFD700', // Gold
    pentecost: '#FF0000', // Red
  };
  return colors[season] ?? '#00843D';
}

// =============================================================================
// STATIC GENERATION
// =============================================================================

/**
 * Revalidation period for ISR (1 hour).
 */
export const revalidate = 3600;
