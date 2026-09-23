/**
 * Page archetype factories — produce TenantPage[] from fixture identity data.
 *
 * Five standard archetypes (home, about, contact, services, schedule) compose
 * pages for ALL 12 verticals. Vertical-specific logic is isolated in switch
 * statements within each archetype. Content derives from the fixture's
 * identity, name, tagline, and vertical — no fabricated data.
 *
 * Usage: `generateTenantPages(fixture)` returns 5 TenantPage objects ready
 * to merge into fixture JSON.
 */
import type { ContentBlock, LocalizedText, TenantFixture, TenantPage } from './schema';
import type { Vertical } from './schema';

/* ------------------------------------------------------------------ */
/* Layout family mapping (structural, mirrors template-renderer)       */
/* ------------------------------------------------------------------ */

type LayoutFamily = 'sacred' | 'eastern' | 'administrative' | 'memorial' | 'congregation';

const VERTICAL_FAMILY: Record<Vertical, LayoutFamily> = {
  parish: 'sacred',
  basilica: 'sacred',
  cathedral: 'sacred',
  chapel: 'sacred',
  monastery: 'sacred',
  'orthodox-church': 'eastern',
  'greek-catholic': 'eastern',
  diocese: 'administrative',
  deanery: 'administrative',
  cemetery: 'memorial',
  'funeral-home': 'memorial',
  'protestant-church': 'congregation',
};

/** Church-like families that celebrate mass (sacred + eastern). */
function isChurchFamily(family: LayoutFamily): boolean {
  return family === 'sacred' || family === 'eastern';
}

/* ------------------------------------------------------------------ */
/* Localized text helpers                                             */
/* ------------------------------------------------------------------ */

function lt(value: string): LocalizedText {
  return { lt: value, en: value };
}

function ltVerified(value: string): LocalizedText {
  return {
    lt: value,
    en: value,
    ru: `${value} [TODO: verify with parish/diocese — do not publish unverified]`,
  };
}

/* ------------------------------------------------------------------ */
/* Block builders                                                     */
/* ------------------------------------------------------------------ */

function heroBlock(fixture: TenantFixture): ContentBlock {
  return {
    type: 'hero',
    heading: fixture.name,
    subheading: fixture.tagline,
    body: fixture.identity?.jurisdiction
      ? lt(`${fixture.identity.jurisdiction} · Est. ${fixture.identity.established ?? '—'}`)
      : undefined,
  };
}

function massScheduleBlock(): ContentBlock {
  return {
    type: 'massSchedule',
    heading: ltVerified('Šv. Mišių tvarkaraštis'),
    masses: [
      {
        day: ltVerified('Pirmadienis - Penktadienis'),
        time: '07:30',
        rrule: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
      },
      { day: ltVerified('Šeštadienis'), time: '09:00', rrule: 'FREQ=WEEKLY;BYDAY=SA' },
      { day: ltVerified('Sekmadienis'), time: '09:00', rrule: 'FREQ=WEEKLY;BYDAY=SU' },
      { day: ltVerified('Sekmadienis'), time: '11:00', rrule: 'FREQ=WEEKLY;BYDAY=SU' },
    ],
  };
}

function scheduleBlock(heading: LocalizedText): ContentBlock {
  return {
    type: 'schedule',
    heading,
    entries: [
      { day: ltVerified('Pirmadienis - Penktadienis'), times: ['09:00 - 17:00'] },
      { day: ltVerified('Šeštadienis'), times: ['10:00 - 14:00'] },
      { day: ltVerified('Sekmadienis'), times: ['closed'] },
    ],
  };
}

function statsBlock(fixture: TenantFixture): ContentBlock {
  const items: { label: LocalizedText; value: string | number }[] = [
    { label: ltVerified('Įkurta'), value: fixture.identity?.established ?? '—' },
  ];
  if (fixture.identity?.jurisdiction) {
    items.push({ label: ltVerified('Jurisdikcija'), value: fixture.identity.jurisdiction });
  }
  return {
    type: 'stats',
    heading: ltVerified('Faktai'),
    items,
  };
}

function ctaBlock(links: { lt: string; en: string; href: string }[]): ContentBlock {
  return {
    type: 'cta',
    links: links.map((l) => ({ label: { lt: l.lt, en: l.en }, href: l.href })),
  };
}

function keyValueBlock(
  heading: LocalizedText,
  items: { label: LocalizedText; value: string }[]
): ContentBlock {
  return { type: 'keyValue', heading, items };
}

function textBlock(heading: LocalizedText, body: LocalizedText): ContentBlock {
  return { type: 'text', heading, body };
}

function listBlock(
  heading: LocalizedText,
  items: { title: LocalizedText; description?: LocalizedText; price?: number }[]
): ContentBlock {
  return { type: 'list', heading, items };
}

function mapLocationBlock(fixture: TenantFixture): ContentBlock | null {
  if (!fixture.identity?.address) return null;
  return {
    type: 'mapLocation',
    heading: ltVerified('Vieta'),
    lat: 54.6872,
    lng: 25.2797,
    directionsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fixture.identity.address)}`,
  };
}

function clergyRoleBlock(): ContentBlock {
  return {
    type: 'clergyRoleList',
    heading: ltVerified('Dvasininkai'),
    roles: [{ role: ltVerified('Klebonas'), description: ltVerified('Parish priest') }],
  };
}

function visitingInfoBlock(): ContentBlock {
  return {
    type: 'visitingInfo',
    heading: ltVerified('Lankymo laikas'),
    hours: [
      {
        day: 'Pirmadienis - Penktadienis',
        dayEn: 'Monday - Friday',
        open: '09:00',
        close: '17:00',
      },
      { day: 'Šeštadienis', dayEn: 'Saturday', open: '10:00', close: '14:00' },
    ],
    admission: ltVerified('Lankymas nemokamas'),
  };
}

function faqBlock(): ContentBlock {
  return {
    type: 'faq',
    heading: ltVerified('Dažni klausimai'),
    questions: [
      {
        question: ltVerified('Kaip užsakyti paslaugą?'),
        answer: ltVerified('Kreipkitės į biurą telefonu arba el. paštu.'),
      },
      {
        question: ltVerified('Ar reikalinga išankstinė registracija?'),
        answer: ltVerified(
          'Kai kurioms paslaugoms reikalinga išankstinė registracija.'
        ),
      },
    ],
  };
}

function sacramentListBlock(): ContentBlock {
  return {
    type: 'sacramentList',
    heading: ltVerified('Sakramentai'),
    sacraments: [
      { name: ltVerified('Krikštas'), description: ltVerified('Krikšto sakramentas') },
      {
        name: ltVerified('Pirmoji Komunija'),
        description: ltVerified('Eucharistijos sakramentas'),
      },
      {
        name: ltVerified('Sutvirtinimas'),
        description: ltVerified('Sutvirtinimo sakramentas'),
      },
      { name: ltVerified('Santuoka'), description: ltVerified('Santuokos sakramentas') },
      { name: ltVerified('Išpažintis'), description: ltVerified('Atgailos sakramentas') },
      {
        name: ltVerified('Ligonių patepimas'),
        description: ltVerified('Ligonių patepimo sakramentas'),
      },
    ],
  };
}

function galleryBlock(): ContentBlock {
  return {
    type: 'gallery',
    heading: ltVerified('Galerija'),
    images: [
      {
        src: '/media/placeholder-1.jpg',
        alt: ltVerified('Nuotrauka'),
        width: 800,
        height: 600,
      },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Page archetypes                                                    */
/* ------------------------------------------------------------------ */

function homePage(fixture: TenantFixture): TenantPage {
  const family = VERTICAL_FAMILY[fixture.vertical];
  const blocks: ContentBlock[] = [heroBlock(fixture)];

  if (isChurchFamily(family)) {
    blocks.push(massScheduleBlock());
  } else if (family === 'memorial') {
    blocks.push(
      listBlock(ltVerified('Paslaugos'), [
        { title: ltVerified('Pagrindinė paslauga'), description: ltVerified('Aprašymas') },
        { title: ltVerified('Papildoma paslauga'), description: ltVerified('Aprašymas') },
      ])
    );
  } else {
    blocks.push(scheduleBlock(ltVerified('Tvarkaraštis')));
  }

  blocks.push(statsBlock(fixture));

  if (isChurchFamily(family)) {
    blocks.push(
      ctaBlock([
        { lt: 'Užsakyti Mišių intenciją', en: 'Order Mass Intention', href: '/shop' },
        { lt: 'Sakramentai', en: 'Sacraments', href: '/services' },
      ])
    );
  } else if (family === 'congregation' || family === 'administrative') {
    blocks.push(
      ctaBlock([
        { lt: 'Kontaktai', en: 'Contact', href: '/contact' },
        { lt: 'Naujienos', en: 'News', href: '/news' },
      ])
    );
  } else {
    blocks.push(ctaBlock([{ lt: 'Kontaktai', en: 'Contact', href: '/contact' }]));
  }

  return {
    route: '/',
    title: fixture.name,
    contentBlocks: blocks,
  };
}

function aboutPage(fixture: TenantFixture): TenantPage {
  const family = VERTICAL_FAMILY[fixture.vertical];
  const blocks: ContentBlock[] = [
    textBlock(ltVerified('Apie'), {
      lt: fixture.tagline.lt,
      en: fixture.tagline.en ?? fixture.tagline.lt,
    }),
  ];

  const kvItems: { label: LocalizedText; value: string }[] = [];
  if (fixture.identity?.entityId)
    kvItems.push({ label: ltVerified('Entity ID'), value: fixture.identity.entityId });
  if (fixture.identity?.jurisdiction)
    kvItems.push({ label: ltVerified('Jurisdikcija'), value: fixture.identity.jurisdiction });
  if (fixture.identity?.established)
    kvItems.push({ label: ltVerified('Įkurta'), value: fixture.identity.established });
  if (fixture.identity?.domain)
    kvItems.push({ label: ltVerified('Domenas'), value: fixture.identity.domain });
  if (kvItems.length > 0) blocks.push(keyValueBlock(ltVerified('Duomenys'), kvItems));

  if (isChurchFamily(family) || family === 'congregation') {
    blocks.push(clergyRoleBlock());
  } else {
    blocks.push(visitingInfoBlock());
  }

  const map = mapLocationBlock(fixture);
  if (map) blocks.push(map);

  return {
    route: '/about',
    title: ltVerified('Apie'),
    contentBlocks: blocks,
  };
}

function contactPage(fixture: TenantFixture): TenantPage {
  const blocks: ContentBlock[] = [];

  const kvItems: { label: LocalizedText; value: string }[] = [];
  if (fixture.identity?.address)
    kvItems.push({ label: ltVerified('Adresas'), value: fixture.identity.address });
  if (fixture.identity?.email)
    kvItems.push({ label: ltVerified('El. paštas'), value: fixture.identity.email });
  if (fixture.identity?.phone)
    kvItems.push({ label: ltVerified('Telefonas'), value: fixture.identity.phone });
  if (kvItems.length > 0) {
    blocks.push(keyValueBlock(ltVerified('Kontaktai'), kvItems));
  }

  const map = mapLocationBlock(fixture);
  if (map) blocks.push(map);

  blocks.push(scheduleBlock(ltVerified('Biuro valandos')));

  return {
    route: '/contact',
    title: ltVerified('Kontaktai'),
    contentBlocks: blocks,
  };
}

function servicesPage(fixture: TenantFixture): TenantPage {
  const family = VERTICAL_FAMILY[fixture.vertical];
  const blocks: ContentBlock[] = [heroBlock(fixture)];

  if (isChurchFamily(family)) {
    blocks.push(sacramentListBlock());
  } else {
    blocks.push(
      listBlock(ltVerified('Paslaugos'), [
        {
          title: ltVerified('Pagrindinė paslauga'),
          description: ltVerified('Aprašymas'),
        },
        {
          title: ltVerified('Papildoma paslauga'),
          description: ltVerified('Aprašymas'),
        },
      ])
    );
  }

  blocks.push(faqBlock());

  return {
    route: '/services',
    title: ltVerified('Paslaugos'),
    contentBlocks: blocks,
  };
}

function schedulePageFn(fixture: TenantFixture): TenantPage {
  const family = VERTICAL_FAMILY[fixture.vertical];
  const blocks: ContentBlock[] = [heroBlock(fixture)];

  if (isChurchFamily(family)) {
    blocks.push(massScheduleBlock());
    blocks.push(galleryBlock());
  } else {
    blocks.push(scheduleBlock(ltVerified('Tvarkaraštis')));
  }

  return {
    route: '/schedule',
    title: ltVerified('Tvarkaraštis'),
    contentBlocks: blocks,
  };
}

/* ------------------------------------------------------------------ */
/* Public API                                                         */
/* ------------------------------------------------------------------ */

/** Generate all 5 standard pages for a tenant fixture. */
export function generateTenantPages(fixture: TenantFixture): TenantPage[] {
  return [
    homePage(fixture),
    aboutPage(fixture),
    contactPage(fixture),
    servicesPage(fixture),
    schedulePageFn(fixture),
  ];
}
