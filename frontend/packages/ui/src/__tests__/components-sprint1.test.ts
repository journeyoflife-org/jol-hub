/**
 * Component backlog sprint 1 — behaviour + i18n externalization tests
 * (EntityFactCard, MapBlock, EventList, ServiceList, CourseList).
 *
 * Rendered inside TranslationProvider with the LT catalog, so every
 * assertion on UI strings also proves the catalog keys resolve (no
 * key-path fallback leaking into markup).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { TranslationProvider, getMessages } from '@jol-hub/i18n';

import { EntityFactCard } from '../components/composite/entity-fact-card';
import { MapBlock } from '../components/composite/map-block';
import { EventList } from '../components/composite/event-list';
import { ServiceList } from '../components/composite/service-list';
import { CourseList } from '../components/composite/course-list';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function render(component: ReturnType<typeof createElement>): string {
  const wrapped = createElement(TranslationProvider, {
    locale: 'lt',
    messages: getMessages('lt', { vertical: 'parish' }),
    children: component,
  });
  return renderToStaticMarkup(wrapped);
}

/* ------------------------------------------------------------------ */
/* EntityFactCard                                                      */
/* ------------------------------------------------------------------ */

test('EntityFactCard renders dl semantics with linked values', () => {
  const markup = render(
    createElement(EntityFactCard, {
      heading: 'Pagrindiniai faktai',
      items: [
        { label: 'Titulas', value: 'Šv. Petro' },
        { label: 'Vyskupija', value: 'Vilniaus arkivyskupija', href: 'https://x.lt/lt/vyskupija' },
      ],
    }),
  );
  assert.match(markup, /<dl/);
  assert.match(markup, /<dt[^>]*>Titulas<\/dt>/);
  assert.match(markup, /<a href="https:\/\/x\.lt\/lt\/vyskupija"/);
  assert.match(markup, /Pagrindiniai faktai/);
});

/* ------------------------------------------------------------------ */
/* MapBlock — ePrivacy: zero external resources                        */
/* ------------------------------------------------------------------ */

test('MapBlock makes zero network requests (no iframe, no external assets)', () => {
  const markup = render(
    createElement(MapBlock, {
      title: 'Bažnyčia',
      latitude: 54.6872,
      longitude: 25.3021,
      addressLabel: 'Gatvė 1, Vilnius',
      externalHref: 'https://example.com/maps',
    }),
  );
  assert.doesNotMatch(markup, /<iframe/i);
  assert.doesNotMatch(markup, /<img/i);
  // Only user-initiated resource reference is the external-maps link itself
  // (xmlns namespace identifiers are URIs, not fetchable resources).
  const resourceRefs = markup.match(/(src|href)="https?:\/\//g) ?? [];
  assert.equal(resourceRefs.length, 1);
  assert.match(markup, /rel="noopener noreferrer"/);
  assert.match(markup, /role="img"/);
});

test('MapBlock externalizes its UI strings (LT catalog resolves)', () => {
  const markup = render(
    createElement(MapBlock, {
      title: 'Bažnyčia',
      latitude: 54.6872,
      longitude: 25.3021,
      addressLabel: 'Gatvė 1, Vilnius',
      externalHref: 'https://example.com/maps',
    }),
  );
  assert.match(markup, /Statinis žemėlapis/);
  assert.match(markup, /Atidaryti išoriniame žemėlapyje/);
  assert.doesNotMatch(markup, /mapStaticNotice|openInExternalMaps/); // no key fallback
});

/* ------------------------------------------------------------------ */
/* Lists                                                               */
/* ------------------------------------------------------------------ */

test('EventList renders ul/li + resolved view-all link', () => {
  const markup = render(
    createElement(EventList, {
      viewAllHref: '/events',
      items: [
        {
          title: 'Mišios',
          startDateTime: '2026-08-30T11:00:00',
          dateLabel: '2026-08-30',
        },
      ],
    }),
  );
  assert.match(markup, /<ul[^>]*>/);
  assert.match(markup, /<li[^>]*>/);
  assert.match(markup, /Peržiūrėti visus renginius/);
});

test('EventList empty state resolves from the catalog', () => {
  const markup = render(createElement(EventList, { items: [] }));
  assert.match(markup, /Renginių kol kas nėra/);
});

test('ServiceList renders one li per service + resolved view-all', () => {
  const markup = render(
    createElement(ServiceList, {
      viewAllHref: '/services',
      items: [{ title: 'A' }, { title: 'B' }],
    }),
  );
  assert.equal((markup.match(/<li/g) ?? []).length, 2);
  assert.match(markup, /Peržiūrėti visas paslaugas/);
});

test('CourseList attaches sr-only schedule/level labels from the catalog', () => {
  const markup = render(
    createElement(CourseList, {
      items: [{ title: 'Kursas', schedule: 'Antradieniais', level: 'Pradedantiesiems' }],
    }),
  );
  assert.match(markup, /class="sr-only">Tvarkaraštis/);
  assert.match(markup, /class="sr-only">Lygis/);
});

test('CourseList empty state resolves from the catalog', () => {
  const markup = render(createElement(CourseList, { items: [] }));
  assert.match(markup, /Kursų kol kas nėra/);
});

/* ------------------------------------------------------------------ */
/* i18n key parity — LT/EN/RU catalogs all carry the sprint-1 keys     */
/* ------------------------------------------------------------------ */

test('sprint-1 keys exist in all three locale catalogs', () => {
  const keys = [
    'viewAllEvents',
    'viewAllServices',
    'emptyCourses',
    'openInExternalMaps',
    'mapStaticNotice',
    'courseLevelLabel',
    'courseScheduleLabel',
  ];
  for (const locale of ['lt', 'en', 'ru']) {
    const catalog = JSON.parse(
      readFileSync(join(__dirname, '../../../i18n/src/messages', `${locale}.json`), 'utf-8'),
    ) as { collections: Record<string, string> };
    for (const key of keys) {
      assert.ok(catalog.collections[key], `${locale}: missing collections.${key}`);
    }
  }
});
