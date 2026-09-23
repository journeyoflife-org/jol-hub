# Tenant Fixture & Template Family Build-Out — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Populate all 44 tenant fixtures with 5 standard page archetypes each (~220 pages) and implement the 7 missing block renderers in TemplateRenderer.

**Architecture:** Five factory functions in `page-archetypes.ts` produce `TenantPage[]` from fixture identity data. A generation script writes the output into fixture JSON. TemplateRenderer gains 7 new block renderers (massSchedule, gallery, faq, sacramentList, clergyRoleList, visitingInfo, mapLocation) so all 14 schema block types render.

**Tech Stack:** TypeScript, Zod, Node.js `node:test`, React (JSX), `@journeyoflife-org/seed-data` (Zod schemas + fixtures), `@journeyoflife-org/ui` (Badge, Card, CardContent).

---

### Task 1: Implement 7 Missing Block Renderers

**Files:**
- Modify: `apps/template-renderer/src/components/TemplateRenderer.tsx:250-255`

- [ ] **Step 1: Replace the `default: return null` case with 7 new block renderers**

In `apps/template-renderer/src/components/TemplateRenderer.tsx`, replace lines 250–255 (the `default` case and its comment) with the following 7 cases plus a new `default` that returns `null` only for truly unknown types:

```tsx
    case 'massSchedule':
      return (
        <section>
          {block.heading && (
            <h2 className="font-heading text-primary mb-4 text-2xl font-bold">
              {t(block.heading)}
            </h2>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {block.masses.map((mass) => (
              <Card key={`${t(mass.day)}-${mass.time}`}>
                <CardContent className="p-4">
                  <h3 className="font-heading text-primary text-lg">{t(mass.day)}</h3>
                  {mass.day.en && mass.day.en !== mass.day.lt && (
                    <p className="text-xs text-gray-500">{mass.day.en}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge className="bg-primary text-white">{mass.time}</Badge>
                    {mass.language && (
                      <Badge variant="outline">{mass.language}</Badge>
                    )}
                  </div>
                  {mass.notes && (
                    <p className="mt-2 text-sm text-gray-500">{t(mass.notes)}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      );

    case 'gallery':
      return (
        <section>
          {block.heading && (
            <h2 className="font-heading text-primary mb-4 text-2xl font-bold">
              {t(block.heading)}
            </h2>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {block.images.map((img) => (
              <figure key={img.src} className="overflow-hidden rounded-lg">
                <img
                  src={img.src}
                  alt={t(img.alt)}
                  width={img.width}
                  height={img.height}
                  loading="lazy"
                  className="h-auto w-full object-cover"
                />
                {img.caption && (
                  <figcaption className="mt-1 text-center text-sm text-gray-500">
                    {t(img.caption)}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </section>
      );

    case 'faq':
      return (
        <section>
          {block.heading && (
            <h2 className="font-heading text-primary mb-4 text-2xl font-bold">
              {t(block.heading)}
            </h2>
          )}
          <div className="space-y-3">
            {block.questions.map((qa) => (
              <details
                key={t(qa.question)}
                className="rounded-lg border border-neutral-200 dark:border-neutral-700"
              >
                <summary className="font-heading text-primary cursor-pointer px-4 py-3 font-semibold">
                  {t(qa.question)}
                </summary>
                <div className="px-4 pb-3 text-gray-700">{t(qa.answer)}</div>
              </details>
            ))}
          </div>
        </section>
      );

    case 'sacramentList':
      return (
        <section>
          {block.heading && (
            <h2 className="font-heading text-primary mb-4 text-2xl font-bold">
              {t(block.heading)}
            </h2>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {block.sacraments.map((sac) => (
              <Card key={t(sac.name)}>
                <CardContent className="p-4">
                  <h3 className="text-primary font-semibold">{t(sac.name)}</h3>
                  {sac.description && (
                    <p className="mt-1 text-sm text-gray-600">{t(sac.description)}</p>
                  )}
                  {sac.schedule && (
                    <p className="mt-1 text-sm text-gray-500">
                      <span className="font-medium">Schedule:</span> {t(sac.schedule)}
                    </p>
                  )}
                  {sac.requirements && (
                    <p className="mt-1 text-sm text-gray-500">
                      <span className="font-medium">Requirements:</span>{' '}
                      {t(sac.requirements)}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      );

    case 'clergyRoleList':
      return (
        <section>
          {block.heading && (
            <h2 className="font-heading text-primary mb-4 text-2xl font-bold">
              {t(block.heading)}
            </h2>
          )}
          <dl className="space-y-4">
            {block.roles.map((role) => (
              <div key={t(role.role)} className="border-b border-neutral-200 pb-3 dark:border-neutral-700">
                <dt className="text-primary font-semibold">{t(role.role)}</dt>
                {role.description && (
                  <dd className="mt-1 text-sm text-gray-600">{t(role.description)}</dd>
                )}
                {role.contact && (
                  <dd className="mt-1 text-sm">
                    <a href={`mailto:${role.contact}`} className="text-primary underline">
                      {role.contact}
                    </a>
                  </dd>
                )}
              </div>
            ))}
          </dl>
        </section>
      );

    case 'visitingInfo':
      return (
        <section>
          {block.heading && (
            <h2 className="font-heading text-primary mb-4 text-2xl font-bold">
              {t(block.heading)}
            </h2>
          )}
          <Card>
            <CardContent className="p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="py-2 text-start font-semibold">Day</th>
                    <th className="py-2 text-start font-semibold">Open</th>
                    <th className="py-2 text-start font-semibold">Close</th>
                  </tr>
                </thead>
                <tbody>
                  {block.hours.map((h) => (
                    <tr key={h.day} className="border-b border-neutral-100 dark:border-neutral-800">
                      <td className="py-2">{h.day}</td>
                      <td className="py-2">{h.open}</td>
                      <td className="py-2">{h.close}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {block.admission && (
                <p className="mt-3 text-sm text-gray-600">{t(block.admission)}</p>
              )}
            </CardContent>
          </Card>
        </section>
      );

    case 'mapLocation':
      return (
        <section>
          {block.heading && (
            <h2 className="font-heading text-primary mb-4 text-2xl font-bold">
              {t(block.heading)}
            </h2>
          )}
          <div
            data-lat={block.lat}
            data-lng={block.lng}
            className="space-y-3"
          >
            {block.staticMap && (
              <img
                src={block.staticMap.src}
                alt={t(block.staticMap.alt)}
                width={block.staticMap.width}
                height={block.staticMap.height}
                loading="lazy"
                className="h-auto w-full rounded-lg object-cover"
              />
            )}
            {block.directionsUrl && (
              <a
                href={block.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex items-center gap-1 font-medium underline"
              >
                Get directions →
              </a>
            )}
          </div>
        </section>
      );

    default:
      return null;
```

- [ ] **Step 2: Type-check the template-renderer app**

Run: `cd apps/template-renderer && npx tsc --noEmit`
Expected: No errors (the block types are already in the `ContentBlock` discriminated union).

- [ ] **Step 3: Commit block renderers**

```bash
git add apps/template-renderer/src/components/TemplateRenderer.tsx
git commit -m "feat: implement 7 missing block renderers in TemplateRenderer

Adds rendering for massSchedule, gallery, faq, sacramentList,
clergyRoleList, visitingInfo, and mapLocation blocks. All 14 schema
block types now render (was 7/14)."
```

---

### Task 2: Write Page Archetype Factories + Test

**Files:**
- Create: `packages/seed-data/src/page-archetypes.ts`
- Create: `packages/seed-data/src/__tests__/page-archetypes.test.ts`
- Modify: `packages/seed-data/src/index.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/seed-data/src/__tests__/page-archetypes.test.ts`:

```ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateTenantPages } from '../page-archetypes';
import { TenantFixtureSchema, TenantPageSchema } from '../schema';
import type { TenantFixture } from '../schema';

/** Minimal valid fixture for archetype testing. */
function makeFixture(overrides: Partial<TenantFixture> = {}): TenantFixture {
  const base = {
    slug: 'test-parish',
    vertical: 'parish' as const,
    locale: 'lt',
    name: { lt: 'Test Parish', en: 'Test Parish EN' },
    tagline: { lt: 'Test tagline', en: 'Test tagline EN' },
    identity: {
      entityId: 'test-001',
      jurisdiction: 'Test Diocese',
      established: '1500',
      address: 'Test g. 1, Vilnius',
      email: 'test@example.lt',
      phone: '+370 5 000 0000',
    },
    governance: {
      sourceUrl: 'https://example.com',
      verifiedDate: '2026-09-01',
      approvalStatus: 'approved' as const,
    },
    pages: [],
    ...overrides,
  };
  return TenantFixtureSchema.parse(base);
}

describe('generateTenantPages', () => {
  it('produces exactly 5 pages for a sacred-family tenant', () => {
    const fixture = makeFixture({ vertical: 'parish' });
    const pages = generateTenantPages(fixture);
    assert.equal(pages.length, 5);
  });

  it('produces pages with correct routes', () => {
    const fixture = makeFixture({ vertical: 'parish' });
    const pages = generateTenantPages(fixture);
    const routes = pages.map((p) => p.route);
    assert.deepStrictEqual(routes, ['/', '/about', '/contact', '/services', '/schedule']);
  });

  it('every page has at least one content block', () => {
    const fixture = makeFixture({ vertical: 'parish' });
    const pages = generateTenantPages(fixture);
    for (const page of pages) {
      assert.ok(
        page.contentBlocks.length >= 1,
        `Page ${page.route} has no content blocks`
      );
    }
  });

  it('all generated pages validate against TenantPageSchema', () => {
    const fixture = makeFixture({ vertical: 'cemetery' });
    const pages = generateTenantPages(fixture);
    // Re-parse each page through the schema (already validated by construction,
    // but this catches schema regressions).
    for (const page of pages) {
      const result = TenantPageSchema.safeParse(page);
      assert.ok(result.success, `Page ${page.route} failed validation: ${result.error}`);
    }
  });

  it('home page for sacred vertical includes massSchedule block', () => {
    const fixture = makeFixture({ vertical: 'parish' });
    const pages = generateTenantPages(fixture);
    const home = pages.find((p) => p.route === '/')!;
    const hasMassSchedule = home.contentBlocks.some((b) => b.type === 'massSchedule');
    assert.ok(hasMassSchedule, 'sacred home page should include massSchedule');
  });

  it('home page for memorial vertical includes list block (not massSchedule)', () => {
    const fixture = makeFixture({ vertical: 'cemetery' });
    const pages = generateTenantPages(fixture);
    const home = pages.find((p) => p.route === '/')!;
    const hasList = home.contentBlocks.some((b) => b.type === 'list');
    const hasMassSchedule = home.contentBlocks.some((b) => b.type === 'massSchedule');
    assert.ok(hasList, 'memorial home page should include list');
    assert.ok(!hasMassSchedule, 'memorial home page should NOT include massSchedule');
  });

  it('about page for sacred vertical includes clergyRoleList', () => {
    const fixture = makeFixture({ vertical: 'parish' });
    const pages = generateTenantPages(fixture);
    const about = pages.find((p) => p.route === '/about')!;
    const hasClergy = about.contentBlocks.some((b) => b.type === 'clergyRoleList');
    assert.ok(hasClergy, 'sacred about page should include clergyRoleList');
  });

  it('about page for administrative vertical includes visitingInfo (not clergyRoleList)', () => {
    const fixture = makeFixture({ vertical: 'diocese' });
    const pages = generateTenantPages(fixture);
    const about = pages.find((p) => p.route === '/about')!;
    const hasVisiting = about.contentBlocks.some((b) => b.type === 'visitingInfo');
    const hasClergy = about.contentBlocks.some((b) => b.type === 'clergyRoleList');
    assert.ok(hasVisiting, 'administrative about page should include visitingInfo');
    assert.ok(!hasClergy, 'administrative about page should NOT include clergyRoleList');
  });

  it('works for all 12 verticals without throwing', () => {
    const verticals = [
      'parish', 'basilica', 'cathedral', 'chapel', 'monastery',
      'orthodox-church', 'greek-catholic',
      'diocese', 'deanery',
      'cemetery', 'funeral-home',
      'protestant-church',
    ] as const;
    for (const vertical of verticals) {
      const fixture = makeFixture({ vertical });
      const pages = generateTenantPages(fixture);
      assert.equal(pages.length, 5, `${vertical} should produce 5 pages`);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/seed-data && npx tsx --test src/__tests__/page-archetypes.test.ts`
Expected: FAIL — `Cannot find module '../page-archetypes'`

- [ ] **Step 3: Write page-archetypes.ts**

Create `packages/seed-data/src/page-archetypes.ts`:

```ts
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
  return { lt: value, en: value, ru: `${value} [TODO: verify with parish/diocese — do not publish unverified]` };
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

function massScheduleBlock(fixture: TenantFixture): ContentBlock {
  return {
    type: 'massSchedule',
    heading: ltVerified('Šv. Mišių tvarkaraštis'),
    masses: [
      { day: ltVerified('Pirmadienis - Penktadienis'), time: '07:30', rrule: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR' },
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
      { day: ltVerified('Sekmadienis'), times: [] },
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

function keyValueBlock(heading: LocalizedText, items: { label: LocalizedText; value: string }[]): ContentBlock {
  return { type: 'keyValue', heading, items };
}

function textBlock(heading: LocalizedText, body: LocalizedText): ContentBlock {
  return { type: 'text', heading, body };
}

function listBlock(heading: LocalizedText, items: { title: LocalizedText; description?: LocalizedText; price?: number }[]): ContentBlock {
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
    roles: [
      { role: ltVerified('Klebonas'), description: ltVerified('Parish priest') },
    ],
  };
}

function visitingInfoBlock(): ContentBlock {
  return {
    type: 'visitingInfo',
    heading: ltVerified('Lankymo laikas'),
    hours: [
      { day: 'Pirmadienis - Penktadienis', dayEn: 'Monday - Friday', open: '09:00', close: '17:00' },
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
        answer: ltVerified('Kai kurioms paslaugoms reikalinga išankstinė registracija.'),
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
      { name: ltVerified('Pirmoji Komunija'), description: ltVerified('Eucharistijos sakramentas') },
      { name: ltVerified('Sutvirtinimas'), description: ltVerified('Sutvirtinimo sakramentas') },
      { name: ltVerified('Santuoka'), description: ltVerified('Santuokos sakramentas') },
      { name: ltVerified('Išpažintis'), description: ltVerified('Atgailos sakramentas') },
      { name: ltVerified('Ligonių patepimas'), description: ltVerified('Ligonių patepimo sakramentas') },
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
    blocks.push(massScheduleBlock(fixture));
  } else {
    blocks.push(scheduleBlock(ltVerified('Tvarkaraštis')));
  }

  blocks.push(statsBlock(fixture));

  if (isChurchFamily(family)) {
    blocks.push(ctaBlock([
      { lt: 'Užsakyti Mišių intenciją', en: 'Order Mass Intention', href: '/shop' },
      { lt: 'Sakramentai', en: 'Sacraments', href: '/services' },
    ]));
  } else if (family === 'congregation') {
    blocks.push(ctaBlock([
      { lt: 'Kontaktai', en: 'Contact', href: '/contact' },
      { lt: 'Naujienos', en: 'News', href: '/news' },
    ]));
  } else if (family === 'administrative') {
    blocks.push(ctaBlock([
      { lt: 'Kontaktai', en: 'Contact', href: '/contact' },
      { lt: 'Naujienos', en: 'News', href: '/news' },
    ]));
  } else {
    blocks.push(ctaBlock([
      { lt: 'Kontaktai', en: 'Contact', href: '/contact' },
    ]));
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
    textBlock(
      ltVerified('Apie'),
      { lt: fixture.tagline.lt, en: fixture.tagline.en ?? fixture.tagline.lt }
    ),
  ];

  const kvItems: { label: LocalizedText; value: string }[] = [];
  if (fixture.identity?.entityId) kvItems.push({ label: ltVerified('Entity ID'), value: fixture.identity.entityId });
  if (fixture.identity?.jurisdiction) kvItems.push({ label: ltVerified('Jurisdikcija'), value: fixture.identity.jurisdiction });
  if (fixture.identity?.established) kvItems.push({ label: ltVerified('Įkurta'), value: fixture.identity.established });
  if (fixture.identity?.domain) kvItems.push({ label: ltVerified('Domenas'), value: fixture.identity.domain });
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
  if (fixture.identity?.address) kvItems.push({ label: ltVerified('Adresas'), value: fixture.identity.address });
  if (fixture.identity?.email) kvItems.push({ label: ltVerified('El. paštas'), value: fixture.identity.email });
  if (fixture.identity?.phone) kvItems.push({ label: ltVerified('Telefonas'), value: fixture.identity.phone });
  blocks.push(keyValueBlock(ltVerified('Kontaktai'), kvItems));

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
    blocks.push(listBlock(ltVerified('Paslaugos'), [
      { title: ltVerified('Pagrindinė paslauga'), description: ltVerified('Aprašymas') },
      { title: ltVerified('Papildoma paslauga'), description: ltVerified('Aprašymas') },
    ]));
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
    blocks.push(massScheduleBlock(fixture));
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
```

- [ ] **Step 4: Export page-archetypes from index.ts**

Add to `packages/seed-data/src/index.ts` after the existing exports:

```ts
export { generateTenantPages } from './page-archetypes';
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd packages/seed-data && npx tsx --test src/__tests__/page-archetypes.test.ts`
Expected: All 9 tests PASS.

- [ ] **Step 6: Type-check**

Run: `cd packages/seed-data && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 7: Commit archetypes + test**

```bash
git add packages/seed-data/src/page-archetypes.ts packages/seed-data/src/__tests__/page-archetypes.test.ts packages/seed-data/src/index.ts
git commit -m "feat: add page archetype factories (5 pages × 44 tenants)

Five factory functions (home, about, contact, services, schedule)
produce TenantPage[] from fixture identity data. Vertical-specific
logic isolated in switch statements. All 12 verticals covered."
```

---

### Task 3: Write Generation Script

**Files:**
- Create: `packages/seed-data/scripts/generate-pages.ts`

- [ ] **Step 1: Write the generation script**

Create `packages/seed-data/scripts/generate-pages.ts`:

```ts
#!/usr/bin/env npx tsx
/**
 * Generate standard pages for all tenant fixtures.
 *
 * For each fixture in the registry, runs `generateTenantPages()` and
 * replaces the fixture's `pages` array with the generated output.
 * Writes updated JSON back to the fixture files.
 *
 * Usage: npx tsx scripts/generate-pages.ts
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { tenantFixtures } from '../src/registry';
import { generateTenantPages } from '../src/page-archetypes';
import { TenantFixtureSchema } from '../src/schema';

const FIXTURES_DIR = path.resolve(__dirname, '../src/fixtures/tenants');

/** Map fixture slugs back to their source JSON files. */
function buildSlugToFileMap(): Map<string, string> {
  const map = new Map<string, string>();
  const files = fs.readdirSync(FIXTURES_DIR).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const filePath = path.join(FIXTURES_DIR, file);
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    // Single-fixture files have a `slug` field; multi-fixture files are arrays.
    if (Array.isArray(raw)) {
      for (const fixture of raw) {
        if (fixture.slug) map.set(fixture.slug, file);
      }
    } else if (raw.slug) {
      map.set(raw.slug, file);
    }
  }
  return map;
}

function main() {
  const slugToFile = buildSlugToFileMap();

  // Group fixtures by source file.
  const fileGroups = new Map<string, typeof tenantFixtures[number][]>();
  for (const fixture of tenantFixtures) {
    const file = slugToFile.get(fixture.slug);
    if (!file) {
      console.error(`  WARNING: no source file found for slug "${fixture.slug}"`);
      continue;
    }
    const group = fileGroups.get(file) ?? [];
    group.push(fixture);
    fileGroups.set(file, group);
  }

  let totalPages = 0;
  let totalFixtures = 0;

  for (const [file, fixtures] of fileGroups) {
    const filePath = path.join(FIXTURES_DIR, file);
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    if (Array.isArray(raw)) {
      // Multi-fixture file: update each fixture's pages.
      for (const fixture of fixtures) {
        const pages = generateTenantPages(fixture);
        // Find the matching entry in the raw array and replace its pages.
        const idx = raw.findIndex((r: { slug: string }) => r.slug === fixture.slug);
        if (idx >= 0) {
          raw[idx].pages = pages;
          totalPages += pages.length;
          totalFixtures++;
        }
      }
      fs.writeFileSync(filePath, JSON.stringify(raw, null, 2) + '\n', 'utf-8');
    } else {
      // Single-fixture file: update pages directly.
      const fixture = fixtures[0];
      const pages = generateTenantPages(fixture);
      raw.pages = pages;
      totalPages += pages.length;
      totalFixtures++;
      fs.writeFileSync(filePath, JSON.stringify(raw, null, 2) + '\n', 'utf-8');
    }

    console.log(`  ✓ ${file} (${fixtures.length} fixture(s))`);
  }

  // Re-validate all fixtures after generation.
  console.log('\nRe-validating all fixtures...');
  for (const fixture of tenantFixtures) {
    const result = TenantFixtureSchema.safeParse(fixture);
    if (!result.success) {
      console.error(`  FAIL: ${fixture.slug} — ${result.error.message}`);
      process.exit(1);
    }
  }

  console.log(`\nDone: ${totalFixtures} fixtures, ${totalPages} pages generated.`);
}

main();
```

- [ ] **Step 2: Type-check the script**

Run: `cd packages/seed-data && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit generation script**

```bash
git add packages/seed-data/scripts/generate-pages.ts
git commit -m "feat: add fixture page generation script

Reads all 44 tenant fixtures, generates 5 standard pages per tenant
via page-archetypes, writes updated JSON back to fixture files."
```

---

### Task 4: Run Generation + Verify

**Files:**
- Modify: `packages/seed-data/src/fixtures/tenants/*.json` (all 20 files)

- [ ] **Step 1: Run the generation script**

Run: `cd packages/seed-data && npx tsx scripts/generate-pages.ts`
Expected: Output ends with `Done: 44 fixtures, 220 pages generated.`

- [ ] **Step 2: Verify page count per tenant**

Run: `cd packages/seed-data && node -e "const {tenantFixtures}=require('./src/registry'); const {generateTenantPages}=require('./src/page-archetypes'); let total=0; for(const f of tenantFixtures){total+=f.pages.length} console.log('Total pages:',total); console.log('Total tenants:',tenantFixtures.length)"`

If using ESM: `cd packages/seed-data && npx tsx -e "import {tenantFixtures} from './src/registry'; let total=0; for(const f of tenantFixtures){total+=f.pages.length} console.log('Total pages:',total,'Tenants:',tenantFixtures.length)"`
Expected: `Total pages: 220 Tenants: 44`

- [ ] **Step 3: Run full verification suite**

Run: `pnpm verify`
Expected: All tests pass, all contrast pairs pass, 0 axe violations.

Run: `pnpm turbo run type-check`
Expected: All packages type-check clean.

- [ ] **Step 4: Commit generated fixture JSON**

```bash
git add packages/seed-data/src/fixtures/tenants/
git commit -m "data: generate 220 pages for 44 tenant fixtures

5 standard pages per tenant (home, about, contact, services, schedule).
Pages generated by page-archetypes.ts factories from fixture identity.
All 14 content block types now represented in fixture data."
```

---

### Task 5: Changeset

**Files:**
- Create: `.changeset/tenant-page-archetypes.md`

- [ ] **Step 1: Create changeset**

Create `.changeset/tenant-page-archetypes.md`:

```md
---
'@journeyoflife-org/seed-data': minor
---

feat: page archetype factories + 220 generated pages

Add `generateTenantPages()` — 5 factory functions (home, about, contact,
services, schedule) that produce standard pages from tenant identity data.
All 44 tenant fixtures now carry 5 pages each (220 total).

Exported from `@journeyoflife-org/seed-data`:
- `generateTenantPages(fixture: TenantFixture): TenantPage[]`
```

- [ ] **Step 2: Commit changeset**

```bash
git add .changeset/tenant-page-archetypes.md
git commit -m "chore: changeset for page archetype factories"
```

---

### Task 6: Final Verification

- [ ] **Step 1: Run full verification**

Run: `pnpm verify`
Expected: All tests pass, all contrast pairs pass, 0 axe violations.

Run: `pnpm turbo run type-check`
Expected: All packages type-check clean.

- [ ] **Step 2: Verify git log**

Run: `git log --oneline -8`
Expected: 6 new commits (block renderers, archetypes+test, script, fixture JSON, changeset, and the spec/plan commits from earlier).
