import type { Metadata } from 'next';
import Link from 'next/link';
import {
  listParishes,
  searchParishes,
} from '@/lib/tenant/resolver';
import type { ParishConfig } from '@/lib/tenant/config';

// ---------------------------------------------------------------------------
// SEO Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'JOL-HUB — Lietuvos Katalikų Bažnyčios platforma',
  description:
    'Raskite parapijas, pamaldų tvarkaraščius ir dvasines resursus. Oficiali Lietuvos Katalikų Bažnyčios skaitmeninė platforma.',
  keywords: [
    'Katalikų Bažnyčia',
    'Lietuva',
    'parapija',
    'pamaldos',
    'mišios',
    'Lithuanian Catholic Church',
    'parish',
    'mass schedule',
  ],
  alternates: {
    canonical: 'https://jol-hub.eu',
    languages: {
      lt: 'https://jol-hub.eu/lt',
      ru: 'https://jol-hub.eu/ru',
      en: 'https://jol-hub.eu/en',
      'x-default': 'https://jol-hub.eu/lt',
    },
  },
  openGraph: {
    title: 'JOL-HUB — Lietuvos Katalikų Bažnyčios platforma',
    description:
      'Raskite parapijas, pamaldų tvarkaraščius ir dvasines resursus.',
    url: 'https://jol-hub.eu',
    siteName: 'JOL-HUB',
    locale: 'lt_LT',
    alternateLocale: ['en_US', 'ru_RU'],
    type: 'website',
  },
};

// ---------------------------------------------------------------------------
// ISR — revalidate every 10 minutes
// ---------------------------------------------------------------------------

export const revalidate = 600;

// ---------------------------------------------------------------------------
// Liturgical season helper
// ---------------------------------------------------------------------------

type LiturgicalSeason =
  | 'advent'
  | 'christmas'
  | 'ordinary-after-epiphany'
  | 'lent'
  | 'easter'
  | 'ordinary-after-pentecost';

interface SeasonInfo {
  name: string;
  color: string;         // Tailwind bg class
  textColor: string;     // Tailwind text class
  borderColor: string;   // Tailwind border class
  emoji: string;
  description: string;
}

function getLiturgicalSeason(date: Date): SeasonInfo {
  const month = date.getMonth() + 1; // 1–12
  const day = date.getDate();

  // Advent: ~4 Sundays before Christmas (Dec 1–24 approx)
  if ((month === 12 && day <= 24) || (month === 11 && day >= 27)) {
    return {
      name: 'Adventas',
      color: 'bg-purple-700',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-700',
      emoji: '🕯️',
      description: 'Laukimo ir vilties metas',
    };
  }
  // Christmas: Dec 25 – Jan 7
  if ((month === 12 && day >= 25) || (month === 1 && day <= 7)) {
    return {
      name: 'Kalėdų laikas',
      color: 'bg-amber-500',
      textColor: 'text-amber-600',
      borderColor: 'border-amber-500',
      emoji: '⭐',
      description: 'Kristaus gimimo džiaugsmas',
    };
  }
  // Lent: ~Feb 14 – Apr 1 (rough approximation)
  if ((month === 2 && day >= 14) || month === 3 || (month === 4 && day <= 1)) {
    return {
      name: 'Gavėnia',
      color: 'bg-violet-900',
      textColor: 'text-violet-900',
      borderColor: 'border-violet-900',
      emoji: '✝️',
      description: 'Atgailos ir maldos metas',
    };
  }
  // Easter: ~Apr 2 – Jun 12
  if ((month === 4 && day >= 2) || month === 5 || (month === 6 && day <= 12)) {
    return {
      name: 'Velykų laikas',
      color: 'bg-yellow-400',
      textColor: 'text-yellow-600',
      borderColor: 'border-yellow-400',
      emoji: '🌟',
      description: 'Prisikėlimo ir džiaugsmo metas',
    };
  }
  // Ordinary time
  return {
    name: 'Eilinis laikas',
    color: 'bg-emerald-600',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-600',
    emoji: '🌿',
    description: 'Tikėjimo augimo metas',
  };
}

// ---------------------------------------------------------------------------
// Diocese label helper
// ---------------------------------------------------------------------------

const DIOCESE_LABELS: Record<string, string> = {
  vilnius: 'Vilniaus arkivyskupija',
  kaunas: 'Kauno arkivyskupija',
  siauliai: 'Šiaulių vyskupija',
  telsiai: 'Telšių vyskupija',
  panevezys: 'Panevėžio vyskupija',
  kaisiadorys: 'Kaišiadorių vyskupija',
  vilkaviskis: 'Vilkaviškio vyskupija',
};

// ---------------------------------------------------------------------------
// Sub-components (Server Components — no 'use client')
// ---------------------------------------------------------------------------

function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-primary-100 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="JOL-HUB pagrindinis puslapis"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-black text-white"
            aria-hidden="true"
          >
            J
          </span>
          <span>JOL-HUB</span>
        </Link>

        {/* Nav links */}
        <nav aria-label="Pagrindinė navigacija">
          <ul className="flex items-center gap-1 sm:gap-2">
            <li>
              <Link
                href="#parishes"
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary-50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Parapijos
              </Link>
            </li>
            <li>
              <Link
                href="#donate"
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary-50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Aukoti
              </Link>
            </li>
            <li>
              <Link
                href="https://app.jol-hub.eu/login"
                className="ml-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Prisijungti
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

function HeroSection({ season }: { season: SeasonInfo }) {
  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 py-20 sm:py-28"
      aria-labelledby="hero-heading"
    >
      {/* Background decoration */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        aria-hidden="true"
      >
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-secondary" />
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-secondary" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Liturgical season badge */}
        <div className="mb-6 flex justify-center">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium text-white/90 ${season.borderColor} border-opacity-50 bg-white/10 backdrop-blur-sm`}
          >
            <span aria-hidden="true">{season.emoji}</span>
            <span>{season.name}</span>
            <span className="text-white/60">—</span>
            <span className="text-white/80">{season.description}</span>
          </span>
        </div>

        {/* Main heading */}
        <h1
          id="hero-heading"
          className="mb-6 text-center font-serif text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl"
        >
          Lietuvos Katalikų{' '}
          <span className="text-secondary">Bažnyčios</span> platforma
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-center text-lg text-primary-100 sm:text-xl">
          Raskite savo parapiją, sužinokite pamaldų tvarkaraštį ir
          prisijunkite prie katalikų bendruomenės visoje Lietuvoje.
        </p>

        {/* Parish search form */}
        <form
          action="/search"
          method="get"
          className="mx-auto max-w-xl"
          role="search"
          aria-label="Parapijų paieška"
        >
          <div className="flex overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-white/20">
            <label htmlFor="parish-search" className="sr-only">
              Ieškoti parapijos pagal pavadinimą arba miestą
            </label>
            <input
              id="parish-search"
              type="search"
              name="q"
              placeholder="Parapijos pavadinimas arba miestas…"
              autoComplete="off"
              className="flex-1 border-0 bg-transparent px-5 py-4 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-0"
            />
            <button
              type="submit"
              className="flex items-center gap-2 bg-primary px-6 py-4 font-semibold text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
            >
              <SearchIcon />
              <span className="hidden sm:inline">Ieškoti</span>
            </button>
          </div>
        </form>

        {/* Quick stats */}
        <dl className="mt-12 grid grid-cols-3 gap-4 text-center sm:gap-8">
          {[
            { value: '700+', label: 'Parapijų' },
            { value: '7', label: 'Vyskupijų' },
            { value: '3', label: 'Kalbos' },
          ].map(({ value, label }) => (
            <div key={label}>
              <dt className="order-2 mt-1 text-sm font-medium text-primary-200">
                {label}
              </dt>
              <dd className="order-1 font-serif text-3xl font-bold text-white sm:text-4xl">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function ParishCard({ parish }: { parish: ParishConfig }) {
  const city = parish.contact.address.city;
  const dioceseLabel =
    DIOCESE_LABELS[parish.dioceseId] ?? parish.dioceseId;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-primary">
      {/* Color accent bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary-400 to-secondary" />

      <div className="flex flex-1 flex-col p-5">
        {/* Name */}
        <h3 className="mb-1 font-serif text-lg font-bold text-foreground leading-snug">
          <Link
            href={`https://${parish.subdomain}.jol-hub.eu`}
            className="after:absolute after:inset-0 focus-visible:outline-none"
            target="_blank"
            rel="noopener noreferrer"
          >
            {parish.name}
          </Link>
        </h3>

        {/* Diocese + city */}
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {city} · {dioceseLabel}
        </p>

        {/* Description */}
        {parish.description && (
          <p className="mb-4 flex-1 text-sm text-muted-foreground line-clamp-2">
            {parish.description}
          </p>
        )}

        {/* Service times preview */}
        {parish.serviceTimes.length > 0 && (
          <div className="mb-4 rounded-lg bg-primary-50 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">
              Sekmadienio mišios
            </p>
            <p className="mt-0.5 text-sm text-primary-900">
              {parish.serviceTimes
                .filter((s) => s.dayOfWeek === 0 && s.type === 'mass')
                .map((s) => s.time)
                .join(', ') || '—'}
            </p>
          </div>
        )}

        {/* Features badges */}
        <div className="flex flex-wrap gap-1.5">
          {parish.features.liveStream && (
            <FeatureBadge icon="📺" label="Tiesioginė transliacija" />
          )}
          {parish.features.donations && (
            <FeatureBadge icon="💚" label="Aukos" />
          )}
          {parish.features.onlineConfession && (
            <FeatureBadge icon="🙏" label="Internetinė išpažintis" />
          )}
        </div>
      </div>

      {/* CTA footer */}
      <div className="border-t border-border px-5 py-3">
        <span className="text-sm font-medium text-primary transition-colors group-hover:text-primary-600 group-focus-within:text-primary-600">
          Atidaryti parapijos puslapį →
        </span>
      </div>
    </article>
  );
}

function FeatureBadge({ icon, label }: { icon: string; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
      title={label}
    >
      <span aria-hidden="true">{icon}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

function DonateSection() {
  return (
    <section
      id="donate"
      aria-labelledby="donate-heading"
      className="bg-gradient-to-br from-secondary-50 to-amber-50 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-4xl" aria-hidden="true">
            💚
          </span>
          <h2
            id="donate-heading"
            className="mt-4 font-serif text-3xl font-bold text-gray-900 sm:text-4xl"
          >
            Paremkite savo parapiją
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Jūsų auka padeda išlaikyti bažnyčią, finansuoti bendruomenės
            programas ir saugoti mūsų kultūrinį paveldą.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/donate"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-semibold text-white shadow-md transition-all hover:bg-primary-600 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <span aria-hidden="true">💳</span>
              Aukoti dabar
            </Link>
            <Link
              href="/donate#recurring"
              className="inline-flex items-center gap-2 rounded-xl border border-primary px-8 py-4 text-base font-semibold text-primary transition-colors hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <span aria-hidden="true">🔄</span>
              Reguliari auka
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Saugus mokėjimas · GDPR atitinkantis · Gavimo patvirtinimas el. paštu
          </p>
        </div>
      </div>
    </section>
  );
}

function FeatureHighlights() {
  const features = [
    {
      icon: '⛪',
      title: 'Parapijų katalogas',
      description:
        'Raskite artimiausią parapiją pagal miestą, vyskupiją arba šventojo vardą. Pamaldų tvarkaraščiai atnaujinami realiuoju laiku.',
    },
    {
      icon: '📅',
      title: 'Liturginis kalendorius',
      description:
        'Sekite liturginius laikus — Adventą, Gavėnią, Velykų laikotarpį. Šventinių dienų priminimai tiesiai į jūsų el. paštą.',
    },
    {
      icon: '📺',
      title: 'Tiesioginės transliacijos',
      description:
        'Stebėkite šv. Mišias internetu. Ypač naudinga tikintiesiems, negalintiems atvykti į bažnyčią asmeniškai.',
    },
    {
      icon: '🌍',
      title: 'Trys kalbos',
      description:
        'Platforma veikia lietuviškai, rusiškai ir angliškai. Liturginiai terminai verčiami tiksliai, be automatinių klaidų.',
    },
    {
      icon: '🔒',
      title: 'Privatumas pagal GDPR',
      description:
        'Jūsų duomenys saugomi pagal ES reikalavimus. Aiški slapukų politika, jokio nepageidaujamo stebėjimo.',
    },
    {
      icon: '📱',
      title: 'Pritaikyta mobiliems',
      description:
        'Pilnai veikianti mobiliuosiuose įrenginiuose. Greitai įkraunama, prieinama neįgaliesiems (WCAG 2.1 AA).',
    },
  ];

  return (
    <section
      aria-labelledby="features-heading"
      className="bg-background py-16 sm:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2
            id="features-heading"
            className="font-serif text-3xl font-bold text-foreground sm:text-4xl"
          >
            Viskas vienoje vietoje
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            JOL-HUB — oficiali Lietuvos Katalikų Bažnyčios skaitmeninė platforma.
          </p>
        </div>

        <ul
          role="list"
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <li
              key={feature.title}
              className="rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="mb-3 text-3xl" aria-hidden="true">
                {feature.icon}
              </div>
              <h3 className="mb-2 font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="text-lg font-bold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              JOL-HUB
            </Link>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Oficiali Lietuvos Katalikų Bažnyčios skaitmeninė platforma.
              Jungiantys parapijas su tikinčiaisiais.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              © {new Date().getFullYear()} JOL-HUB. Visos teisės saugomos.
            </p>
          </div>

          {/* Links */}
          <nav aria-label="Parapijoms">
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground">
              Parapijoms
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="https://app.jol-hub.eu/register"
                  className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                >
                  Registruoti parapiją
                </Link>
              </li>
              <li>
                <Link
                  href="https://app.jol-hub.eu/login"
                  className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                >
                  Prisijungti
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                >
                  Kainodara
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Teisinė informacija">
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground">
              Teisinė
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/privacy"
                  className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                >
                  Privatumo politika
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                >
                  Naudojimo sąlygos
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                >
                  Slapukų politika
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}

// Simple inline SVG to avoid external icon deps
function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Page (Server Component)
// ---------------------------------------------------------------------------

export default async function HomePage() {
  const season = getLiturgicalSeason(new Date());

  // Load featured parishes (first 6)
  const featuredParishes = await listParishes({ limit: 6 });

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Pereiti prie pagrindinio turinio
      </a>

      <NavBar />

      <main id="main-content">
        {/* Hero + search */}
        <HeroSection season={season} />

        {/* Featured parishes */}
        <section
          id="parishes"
          aria-labelledby="parishes-heading"
          className="bg-muted/30 py-16 sm:py-20"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2
                  id="parishes-heading"
                  className="font-serif text-3xl font-bold text-foreground sm:text-4xl"
                >
                  Parapijų katalogas
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Atraskite katalikų bendruomenes visoje Lietuvoje
                </p>
              </div>
              <Link
                href="/parishes"
                className="self-start whitespace-nowrap rounded-lg border border-primary px-5 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:self-auto"
              >
                Visos parapijos →
              </Link>
            </div>

            {featuredParishes.length > 0 ? (
              <ul
                role="list"
                className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
              >
                {featuredParishes.map((parish) => (
                  <li key={parish.id} className="relative">
                    <ParishCard parish={parish} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-8 text-center text-muted-foreground">
                Šiuo metu parapijų nėra. Bandykite vėliau.
              </p>
            )}
          </div>
        </section>

        {/* Platform features */}
        <FeatureHighlights />

        {/* Donate CTA */}
        <DonateSection />

        {/* Admin CTA */}
        <section
          aria-labelledby="admin-cta-heading"
          className="bg-primary-900 py-16 sm:py-20"
        >
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2
              id="admin-cta-heading"
              className="font-serif text-3xl font-bold text-white sm:text-4xl"
            >
              Esate parapijos administratorius?
            </h2>
            <p className="mt-4 text-lg text-primary-200">
              Valdykite savo parapijos puslapį, skelbkite pamaldų tvarkaraštį
              ir bendraukite su tikinčiaisiais per vieną platformą.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="https://app.jol-hub.eu/register"
                className="inline-flex items-center gap-2 rounded-xl bg-secondary px-8 py-4 text-base font-bold text-gray-900 shadow-md transition-all hover:bg-secondary-400 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-primary-900"
              >
                <span aria-hidden="true">🚀</span>
                Pradėti nemokamai
              </Link>
              <Link
                href="https://app.jol-hub.eu/login"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-8 py-4 text-base font-semibold text-white transition-colors hover:border-white/60 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-900"
              >
                Prisijungti
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
