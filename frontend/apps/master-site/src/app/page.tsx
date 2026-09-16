import type { Metadata } from 'next';
import Link from 'next/link';
import { listParishes, searchParishes } from '@/lib/tenant/resolver';
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
    description: 'Raskite parapijas, pamaldų tvarkaraščius ir dvasines resursus.',
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
  color: string; // Tailwind bg class
  textColor: string; // Tailwind text class
  borderColor: string; // Tailwind border class
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
    <header className="border-primary-100 sticky top-0 z-50 border-b bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="text-primary focus-visible:ring-primary flex items-center gap-2 text-xl font-bold focus-visible:outline-none focus-visible:ring-2"
          aria-label="JOL-HUB pagrindinis puslapis"
        >
          <span
            className="bg-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-black text-white"
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
                className="text-muted-foreground hover:bg-primary-50 hover:text-primary focus-visible:ring-primary rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2"
              >
                Parapijos
              </Link>
            </li>
            <li>
              <Link
                href="#donate"
                className="text-muted-foreground hover:bg-primary-50 hover:text-primary focus-visible:ring-primary rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2"
              >
                Aukoti
              </Link>
            </li>
            <li>
              <Link
                href="https://app.jol-hub.eu/login"
                className="bg-primary hover:bg-primary-600 focus-visible:ring-primary ml-2 rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
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
      className="from-primary-900 via-primary-800 to-primary-700 relative overflow-hidden bg-gradient-to-br py-20 sm:py-28"
      aria-labelledby="hero-heading"
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 opacity-10" aria-hidden="true">
        <div className="bg-secondary absolute -left-20 -top-20 h-96 w-96 rounded-full" />
        <div className="bg-secondary absolute -bottom-20 -right-20 h-96 w-96 rounded-full" />
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
          Lietuvos Katalikų <span className="text-secondary">Bažnyčios</span> platforma
        </h1>

        <p className="text-primary-100 mx-auto mb-10 max-w-2xl text-center text-lg sm:text-xl">
          Raskite savo parapiją, sužinokite pamaldų tvarkaraštį ir prisijunkite prie katalikų
          bendruomenės visoje Lietuvoje.
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
              className="bg-primary hover:bg-primary-600 focus-visible:ring-primary flex items-center gap-2 px-6 py-4 font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
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
              <dt className="text-primary-200 order-2 mt-1 text-sm font-medium">{label}</dt>
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
  const dioceseLabel = DIOCESE_LABELS[parish.dioceseId] ?? parish.dioceseId;

  return (
    <article className="border-border bg-card focus-within:ring-primary group flex flex-col overflow-hidden rounded-xl border shadow-sm transition-shadow focus-within:ring-2 hover:shadow-md">
      {/* Color accent bar */}
      <div className="from-primary via-primary-400 to-secondary h-1.5 w-full bg-gradient-to-r" />

      <div className="flex flex-1 flex-col p-5">
        {/* Name */}
        <h3 className="text-foreground mb-1 font-serif text-lg font-bold leading-snug">
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
        <p className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-wide">
          {city} · {dioceseLabel}
        </p>

        {/* Description */}
        {parish.description && (
          <p className="text-muted-foreground mb-4 line-clamp-2 flex-1 text-sm">
            {parish.description}
          </p>
        )}

        {/* Service times preview */}
        {parish.serviceTimes.length > 0 && (
          <div className="bg-primary-50 mb-4 rounded-lg px-3 py-2">
            <p className="text-primary-700 text-xs font-semibold uppercase tracking-wide">
              Sekmadienio mišios
            </p>
            <p className="text-primary-900 mt-0.5 text-sm">
              {parish.serviceTimes
                .filter((s) => s.dayOfWeek === 0 && s.type === 'mass')
                .map((s) => s.time)
                .join(', ') || '—'}
            </p>
          </div>
        )}

        {/* Features badges */}
        <div className="flex flex-wrap gap-1.5">
          {parish.features.liveStream && <FeatureBadge icon="📺" label="Tiesioginė transliacija" />}
          {parish.features.donations && <FeatureBadge icon="💚" label="Aukos" />}
          {parish.features.onlineConfession && (
            <FeatureBadge icon="🙏" label="Internetinė išpažintis" />
          )}
        </div>
      </div>

      {/* CTA footer */}
      <div className="border-border border-t px-5 py-3">
        <span className="text-primary group-hover:text-primary-600 group-focus-within:text-primary-600 text-sm font-medium transition-colors">
          Atidaryti parapijos puslapį →
        </span>
      </div>
    </article>
  );
}

function FeatureBadge({ icon, label }: { icon: string; label: string }) {
  return (
    <span
      className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
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
      className="from-secondary-50 bg-gradient-to-br to-amber-50 py-16 sm:py-20"
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
            Jūsų auka padeda išlaikyti bažnyčią, finansuoti bendruomenės programas ir saugoti mūsų
            kultūrinį paveldą.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/donate"
              className="bg-primary hover:bg-primary-600 focus-visible:ring-primary inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold text-white shadow-md transition-all hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              <span aria-hidden="true">💳</span>
              Aukoti dabar
            </Link>
            <Link
              href="/donate#recurring"
              className="border-primary text-primary hover:bg-primary-50 focus-visible:ring-primary inline-flex items-center gap-2 rounded-xl border px-8 py-4 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
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
    <section aria-labelledby="features-heading" className="bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2
            id="features-heading"
            className="text-foreground font-serif text-3xl font-bold sm:text-4xl"
          >
            Viskas vienoje vietoje
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            JOL-HUB — oficiali Lietuvos Katalikų Bažnyčios skaitmeninė platforma.
          </p>
        </div>

        <ul role="list" className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <li
              key={feature.title}
              className="border-border bg-card rounded-xl border p-6 shadow-sm"
            >
              <div className="mb-3 text-3xl" aria-hidden="true">
                {feature.icon}
              </div>
              <h3 className="text-foreground mb-2 font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-border bg-card border-t" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="text-primary focus-visible:ring-primary text-lg font-bold focus-visible:outline-none focus-visible:ring-2"
            >
              JOL-HUB
            </Link>
            <p className="text-muted-foreground mt-2 max-w-xs text-sm">
              Oficiali Lietuvos Katalikų Bažnyčios skaitmeninė platforma. Jungiantys parapijas su
              tikinčiaisiais.
            </p>
            <p className="text-muted-foreground mt-4 text-xs">
              © {new Date().getFullYear()} JOL-HUB. Visos teisės saugomos.
            </p>
          </div>

          {/* Links */}
          <nav aria-label="Parapijoms">
            <h4 className="text-foreground mb-3 text-sm font-semibold uppercase tracking-wide">
              Parapijoms
            </h4>
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li>
                <Link
                  href="https://app.jol-hub.eu/register"
                  className="hover:text-primary focus-visible:ring-primary transition-colors focus-visible:outline-none focus-visible:ring-1"
                >
                  Registruoti parapiją
                </Link>
              </li>
              <li>
                <Link
                  href="https://app.jol-hub.eu/login"
                  className="hover:text-primary focus-visible:ring-primary transition-colors focus-visible:outline-none focus-visible:ring-1"
                >
                  Prisijungti
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="hover:text-primary focus-visible:ring-primary transition-colors focus-visible:outline-none focus-visible:ring-1"
                >
                  Kainodara
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Teisinė informacija">
            <h4 className="text-foreground mb-3 text-sm font-semibold uppercase tracking-wide">
              Teisinė
            </h4>
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-primary focus-visible:ring-primary transition-colors focus-visible:outline-none focus-visible:ring-1"
                >
                  Privatumo politika
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-primary focus-visible:ring-primary transition-colors focus-visible:outline-none focus-visible:ring-1"
                >
                  Naudojimo sąlygos
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="hover:text-primary focus-visible:ring-primary transition-colors focus-visible:outline-none focus-visible:ring-1"
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
        className="focus:bg-primary sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
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
                  className="text-foreground font-serif text-3xl font-bold sm:text-4xl"
                >
                  Parapijų katalogas
                </h2>
                <p className="text-muted-foreground mt-2">
                  Atraskite katalikų bendruomenes visoje Lietuvoje
                </p>
              </div>
              <Link
                href="/parishes"
                className="border-primary text-primary hover:bg-primary-50 focus-visible:ring-primary self-start whitespace-nowrap rounded-lg border px-5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 sm:self-auto"
              >
                Visos parapijos →
              </Link>
            </div>

            {featuredParishes.length > 0 ? (
              <ul role="list" className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {featuredParishes.map((parish) => (
                  <li key={parish.id} className="relative">
                    <ParishCard parish={parish} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground mt-8 text-center">
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
        <section aria-labelledby="admin-cta-heading" className="bg-primary-900 py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2
              id="admin-cta-heading"
              className="font-serif text-3xl font-bold text-white sm:text-4xl"
            >
              Esate parapijos administratorius?
            </h2>
            <p className="text-primary-200 mt-4 text-lg">
              Valdykite savo parapijos puslapį, skelbkite pamaldų tvarkaraštį ir bendraukite su
              tikinčiaisiais per vieną platformą.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="https://app.jol-hub.eu/register"
                className="bg-secondary hover:bg-secondary-400 focus-visible:ring-secondary focus-visible:ring-offset-primary-900 inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-bold text-gray-900 shadow-md transition-all hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <span aria-hidden="true">🚀</span>
                Pradėti nemokamai
              </Link>
              <Link
                href="https://app.jol-hub.eu/login"
                className="focus-visible:ring-offset-primary-900 inline-flex items-center gap-2 rounded-xl border border-white/30 px-8 py-4 text-base font-semibold text-white transition-colors hover:border-white/60 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
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
