/**
 * Showcase — renders every shared component with all major variants inside
 * a full, landmark-complete page shell.
 *
 * Dual purpose:
 * 1. Human verification via the env-gated preview route
 *    (`apps/template-renderer/src/app/dev/ui`, UI_PREVIEW=1).
 * 2. Automated axe-core scan (`scripts/check-a11y.tsx`) — the markup must
 *    contain proper landmarks/headings because axe runs against it.
 *
 * No Storybook in this workspace (kept dependency-free); this page is the
 * accepted equivalent per STEP 3 acceptance criteria.
 *
 * Marked 'use client': it wires inline event handlers into client
 * components (ContactForm/DonationWidget), which RSC forbids from a
 * server component. This is a dev/verification surface only.
 */
'use client';

import { Bell, Church, Heart, Users } from 'lucide-react';

import { TranslationProvider, getMessages } from '@jol-hub/i18n';

import { SkipLink } from '../components/accessibility';
import {
  Avatar,
  AvatarGroup,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  Separator,
  Skeleton,
  Spinner,
  Textarea,
} from '../components/primitives';
import {
  ContactForm,
  ContentBlock,
  CourseList,
  DonationWidget,
  EntityFactCard,
  EventCard,
  EventList,
  FeatureGrid,
  Gallery,
  Hero,
  MapBlock,
  NewsCard,
  SectionHeader,
  ServiceCard,
  ServiceList,
  TestimonialCard,
} from '../components/composite';
import { Breadcrumbs, Footer, Header, Sidebar } from '../components/layout';

const TENANT = { vertical: 'parish' as const };

const NAV_ITEMS = [
  { label: 'Pradžia', href: '/', active: true },
  {
    label: 'Tarnystės',
    children: [
      { label: 'Sakramentai', href: '/sacraments' },
      { label: 'Naujienos', href: '/news' },
    ],
  },
  { label: 'Kontaktai', href: '/contact' },
];

export function Showcase() {
  // Dev surface renders in the default locale with the parish vertical
  // override merged in (exercises the full merge pipeline).
  const messages = getMessages('lt', { vertical: 'parish' });

  return (
    <TranslationProvider locale="lt" messages={messages}>
      <SkipLink />
      <Header
        logo="Šv. Jonų parapija"
        navItems={NAV_ITEMS}
        tenant={TENANT}
        actions={
          <Button variant="ghost" size="icon" aria-label="Pranešimai / Notifications">
            <Bell aria-hidden="true" className="h-5 w-5" />
          </Button>
        }
      />

      <main id="main-content">
        <Hero
          title="Vilniaus Šv. Jonų bažnyčia"
          subtitle="Parapija Vilniaus senamiesčio širdyje nuo 1387 m."
          ctaButtons={[
            { label: 'Mišių intencijos', href: '/shop' },
            { label: 'Susisiekti', href: '/contact', emphasis: 'secondary' },
          ]}
          tenant={TENANT}
        />

        <div className="container mx-auto px-4 py-8">
          <Breadcrumbs
            className="mb-6"
            items={[
              { label: 'Pradžia', href: '/' },
              { label: 'Tarnystės', href: '/ministries' },
              { label: 'Sakramentai' },
            ]}
          />

          <SectionHeader
            eyebrow="Tarnystės"
            title="Parapijos gyvenimas"
            description="Bendruomenės tarnystės ir pagrindinės paslaugos."
            tenant={TENANT}
          />

          <FeatureGrid
            tenant={TENANT}
            features={[
              { icon: Church, title: 'Sakramentai', description: 'Krikštas, santuoka ir kiti sakramentai.', href: '/sacraments' },
              { icon: Users, title: 'Bendruomenė', description: 'Grupės, savanorystė ir jaunimo veiklos.' },
              { icon: Heart, title: 'Labdara', description: 'Caritas tarnystė ir parama šeimoms.' },
            ]}
          />

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <EventCard
              tenant={TENANT}
              title="Šv. Mišios už parapiją"
              startDateTime="2026-08-30T11:00:00"
              dateLabel="2026 m. rugpjūčio 30 d."
              timeLabel="11:00"
              location="Pagrindinė bažnyčia"
              recurring
              href="/events/parish-mass"
            />
            <NewsCard
              tenant={TENANT}
              title="Atlaidų programa paskelbta"
              publishedAt="2026-08-20"
              dateLabel="2026 m. rugpjūčio 20 d."
              author="Parapijos biuras"
              category="Naujienos"
              excerpt="Rugpjūčio atlaidų programa jau prieinama — kviečiame dalyvauti."
              readTime="3 min"
              href="/news/atlaidai"
            />
            <ServiceCard
              tenant={TENANT}
              title="Salės nuoma"
              description="Šv. Jono salė iki 150 svečių."
              price={25}
              duration="1 val."
              bookingCta={{ label: 'Rezervuoti', href: '/shop#hall-rental' }}
            />
          </div>

          <SectionHeader title="Faktų kortelė ir žemėlapis" headingLevel={2} className="mt-12" tenant={TENANT} />
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            <EntityFactCard
              tenant={TENANT}
              heading="Pagrindiniai faktai"
              items={[
                { label: 'Titulas', value: 'Šv. apaštalų Petro ir Povilo' },
                { label: 'Stilius', value: 'Barokas' },
                { label: 'Įsteigta', value: '1668 m.' },
                { label: 'Vyskupija', value: 'Vilniaus arkivyskupija', href: '/lt/vilniaus-arkivyskupija' },
              ]}
            />
            <MapBlock
              tenant={TENANT}
              title="Šv. apaštalų Petro ir Povilo bažnyčia"
              latitude={54.6872}
              longitude={25.3021}
              addressLabel="Šv. Petro ir Povilo g. 1, Vilnius"
              externalHref="https://example.com/maps?q=54.6872,25.3021"
            />
          </div>

          <SectionHeader title="Renginių sąrašas" headingLevel={2} className="mt-12" tenant={TENANT} />
          <div className="mt-4">
            <EventList
              tenant={TENANT}
              viewAllHref="/events"
              items={[
                {
                  title: 'Šv. Mišios už parapiją',
                  startDateTime: '2026-08-30T11:00:00',
                  dateLabel: '2026 m. rugpjūčio 30 d.',
                  timeLabel: '11:00',
                  location: 'Pagrindinė bažnyčia',
                  href: '/events/parish-mass',
                },
              ]}
            />
          </div>

          <SectionHeader title="Paslaugų sąrašas" headingLevel={2} className="mt-12" tenant={TENANT} />
          <div className="mt-4">
            <ServiceList
              tenant={TENANT}
              viewAllHref="/services"
              items={[
                { title: 'Salės nuoma', description: 'Šv. Jono salė iki 150 svečių.', price: 25, duration: '1 val.' },
                { title: 'Gidų paslauga', description: 'Pažintinis turas po bažnyčią.' },
              ]}
            />
          </div>

          <SectionHeader title="Kursų sąrašas" headingLevel={2} className="mt-12" tenant={TENANT} />
          <div className="mt-4">
            <CourseList
              tenant={TENANT}
              items={[
                {
                  title: 'Tikėjimo pagrindai',
                  description: 'Aštuonių užsiėmimų ciklas suaugusiesiems.',
                  schedule: 'Antradieniais 18:00',
                  level: 'Pradedantiesiems',
                  href: '/courses/tikejimo-pagrindai',
                },
              ]}
            />
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SectionHeader title="Galerija" headingLevel={2} tenant={TENANT} />
              <Gallery
                images={[
                  { src: '/images/church-1.jpg', alt: 'Bažnyčios fasadas iš varpinės pusės', width: 1200, height: 675, caption: 'Fasadas' },
                  { src: '/images/church-2.jpg', alt: 'Pagrindinis altorius su Šv. Jonų skulptūromis', width: 1200, height: 675 },
                ]}
              />

              <SectionHeader title="Apie parapiją" headingLevel={2} className="mt-10" tenant={TENANT} />
              <ContentBlock
                contentId="about-parish"
                nodes={[
                  { type: 'paragraph', text: 'Parapija veikia nuo 1387 metų ir yra viena seniausių Vilniuje.' },
                  { type: 'heading', level: 3, text: 'Vertybės' },
                  { type: 'list', items: ['Bendruomeniškumas', 'Atvirumas', 'Tarnystė'] },
                  { type: 'blockquote', text: 'Kur du ar trys susirinkę mano vardu…', citation: 'Mt 18, 20' },
                ]}
              />
            </div>

            <div className="flex flex-col gap-6">
              <Sidebar
                sections={[
                  {
                    title: 'Dokumentai',
                    links: [
                      { label: 'Parapijos statutas', href: '/documents/statute' },
                      { label: 'Finansų ataskaita', href: '/documents/finance' },
                    ],
                  },
                ]}
              />
              <DonationWidget tenant={TENANT} onConfigure={() => undefined} />
              <TestimonialCard
                tenant={TENANT}
                quote="Ši parapija — mūsų dvasiniai namai."
                author="Ona Matulionė"
                role="parapijiečių bendruomenė"
              />
            </div>
          </div>

          <SectionHeader title="Kontaktų forma" headingLevel={2} className="mt-12" tenant={TENANT} />
          <div className="grid gap-8 lg:grid-cols-2">
            <ContactForm
              tenant={TENANT}
              title="Parašykite mums"
              privacyPolicyHref="/privacy"
              onSubmit={async () => ({ ok: true, message: 'Ačiū! Žinutė išsiųsta.' })}
            />
            <div className="flex flex-col gap-4">
              <h3 className="font-heading text-xl font-semibold">Primityvų vitrina / Primitives</h3>
              <div className="flex flex-wrap items-center gap-2">
                <Button tenant={TENANT}>Pagrindinis</Button>
                <Button variant="secondary" tenant={TENANT}>Antrinis</Button>
                <Button variant="ghost" tenant={TENANT}>Šešėlinis</Button>
                <Button variant="danger">Pavojingas</Button>
                <Button variant="link" tenant={TENANT}>Nuoroda</Button>
                <Button loading tenant={TENANT}>Kraunasi</Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Numatytasis</Badge>
                <Badge variant="secondary">Antrinis</Badge>
                <Badge variant="outline">Kontūras</Badge>
                <Badge variant="destructive">Klaida</Badge>
                <Badge variant="vertical" tenant={TENANT}>Parapija</Badge>
                <Badge variant="liturgical-season">Velykos</Badge>
              </div>
              <AvatarGroup
                items={[
                  { name: 'Jonas Ivanauskas' },
                  { name: 'Marius Petrauskas' },
                  { name: 'Ona Matulionė' },
                  { name: 'Vaclovas Kavaliauskas' },
                  { name: 'Antanas Kazlauskas' },
                ]}
                max={3}
              />
              <Avatar name="Jonas Ivanauskas" size="lg" />
              <Input id="demo-input" label="Vardas" helperText="Pagalbinis tekstas" />
              <Input id="demo-input-error" label="El. paštas" error="Neteisingas formatas" defaultValue="blogas" />
              <Textarea id="demo-textarea" label="Žinutė" required />
              <Select
                id="demo-select"
                label="Kalba"
                placeholder="Pasirinkite…"
                options={[
                  { value: 'lt', label: 'Lietuvių' },
                  { value: 'en', label: 'English' },
                ]}
              />
              <Card>
                <CardHeader>
                  <CardTitle>Kortelė</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Numatytoji kortelė su turiniu.</p>
                  <div className="mt-3 flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Spinner size="sm" />
                    <Separator orientation="vertical" className="h-6" />
                    <span className="text-sm text-neutral-500">Rezervuota vieta</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer
        brand={
          <div>
            <p className="font-heading text-lg font-bold text-neutral-50">Šv. Jonų parapija</p>
            <p className="mt-2 text-sm">Kelionė per gyvenimą — kartu.</p>
          </div>
        }
        navigation={[
          { label: 'Pradžia', href: '/' },
          { label: 'Naujienos', href: '/news' },
        ]}
        contact={['Šv. Jono g. 12, Vilnius', '+370 5 261 5454', 'jonai@vilnius.lt']}
        legal={[
          { label: 'Privatumo politika / Privacy', href: '/privacy' },
          { label: 'Slapukai / Cookies', href: '/cookies' },
          { label: 'Prieinamumo pareiškimas / Accessibility', href: '/accessibility' },
        ]}
        copyrightHolder="Šv. Jonų parapija"
      />
    </TranslationProvider>
  );
}

