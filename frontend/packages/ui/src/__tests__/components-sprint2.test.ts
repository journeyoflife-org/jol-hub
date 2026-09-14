/**
 * Component backlog sprint 2 — behaviour tests
 * (ProductCard, StorefrontGrid, VendorDashboardShell, ChatbotEntry,
 * CemeteryMapCanvas, OnboardingSteps).
 *
 * Key assertions beyond the sprint-1 patterns:
 *   - FREEZE COMPLIANCE: the ProductCard transaction CTA is INERT
 *     (disabled + aria-disabled + externalized "available at launch");
 *     no form/action wiring anywhere in the commerce trio.
 *   - AI GATE: ChatbotEntry renders NOTHING by default (hidden, not
 *     degraded — O-010 absent = absolute launch blocker).
 *   - ePrivacy: CemeteryMapCanvas markup carries zero fetchable resources.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { TranslationProvider, getMessages } from '@jol-hub/i18n';

import { ProductCard } from '../components/composite/product-card';
import { StorefrontGrid } from '../components/composite/storefront-grid';
import { VendorDashboardShell } from '../components/composite/vendor-dashboard-shell';
import { ChatbotEntry } from '../components/composite/chatbot-entry';
import { CemeteryMapCanvas } from '../components/composite/cemetery-map-canvas';
import { OnboardingSteps } from '../components/composite/onboarding-steps';

function render(component: ReturnType<typeof createElement>): string {
  const wrapped = createElement(TranslationProvider, {
    locale: 'lt',
    messages: getMessages('lt', { vertical: 'parish' }),
    children: component,
  });
  return renderToStaticMarkup(wrapped);
}

/* ------------------------------------------------------------------ */
/* ProductCard — freeze compliance (inert CTA)                         */
/* ------------------------------------------------------------------ */

test('ProductCard renders display data with an INERT transaction CTA', () => {
  const markup = render(
    createElement(ProductCard, { title: 'Žvakė', price: '4.50', currency: 'EUR' }),
  );
  assert.match(markup, /Žvakė/);
  assert.match(markup, /4\.50/);
  // Inert placeholder: disabled button, resolved label, no click wiring.
  assert.match(markup, /<button[^>]*disabled/);
  assert.match(markup, /aria-disabled="true"/);
  assert.match(markup, /Bus prieinama atidarius/);
  // Zero transaction surface: no forms, no live purchase actions.
  assert.doesNotMatch(markup, /<form/i);
  assert.doesNotMatch(markup, /type="submit"/i);
});

test('StorefrontGrid renders one li per product + resolved empty state', () => {
  const grid = render(
    createElement(StorefrontGrid, {
      items: [{ title: 'A', price: '1.00' }, { title: 'B', price: '2.00' }],
    }),
  );
  assert.equal((grid.match(/<li/g) ?? []).length, 2);
  const empty = render(createElement(StorefrontGrid, { items: [] }));
  assert.match(empty, /Prekių kol kas nėra/);
});

test('VendorDashboardShell renders header + stats without any API surface', () => {
  const markup = render(
    createElement(VendorDashboardShell, {
      vendorName: 'Krautuvėlė',
      stats: [{ label: 'Prekės', value: '12' }],
    }),
  );
  assert.match(markup, /aria-label="Krautuvėlė"/);
  assert.match(markup, /<dt[^>]*>Prekės<\/dt>/);
  assert.match(markup, /<dd[^>]*>12<\/dd>/);
});

/* ------------------------------------------------------------------ */
/* ChatbotEntry — hidden by default (AI gate)                          */
/* ------------------------------------------------------------------ */

test('ChatbotEntry renders NOTHING by default (hidden, not degraded)', () => {
  const markup = render(createElement(ChatbotEntry, { faqHref: '/faq' }));
  assert.equal(markup, '');
});

test('ChatbotEntry enabled renders only a public FAQ link (no AI backend)', () => {
  const markup = render(createElement(ChatbotEntry, { enabled: true, faqHref: '/faq' }));
  assert.match(markup, /href="\/faq"/);
  assert.match(markup, /Dažniausiai užduodami klausimai/);
  assert.doesNotMatch(markup, /<form/i);
});

/* ------------------------------------------------------------------ */
/* CemeteryMapCanvas — static, ePrivacy-safe                           */
/* ------------------------------------------------------------------ */

test('CemeteryMapCanvas renders a static SVG grid with externalized legend', () => {
  const markup = render(
    createElement(CemeteryMapCanvas, {
      title: 'Kapinių apžvalga',
      rows: 2,
      cols: 3,
      plots: [{ id: 'A-1', status: 'available' }],
    }),
  );
  assert.match(markup, /role="img"/);
  assert.match(markup, /aria-label="Kapinių apžvalga"/);
  assert.equal((markup.match(/<rect/g) ?? []).length, 6); // rows*cols
  assert.match(markup, /Laisva/);
  assert.match(markup, /Rezervuota/);
  assert.match(markup, /Užimta/);
  // ePrivacy: zero fetchable resources in the markup.
  const resourceRefs = markup.match(/(src|href)="https?:\/\//g) ?? [];
  assert.equal(resourceRefs.length, 0);
});

/* ------------------------------------------------------------------ */
/* OnboardingSteps                                                     */
/* ------------------------------------------------------------------ */

test('OnboardingSteps renders ol semantics with aria-current on the active step', () => {
  const markup = render(
    createElement(OnboardingSteps, {
      items: [
        { title: 'Registracija', status: 'done' },
        { title: 'Pasirinkimas', status: 'current' },
        { title: 'Pradžia', status: 'upcoming' },
      ],
    }),
  );
  assert.match(markup, /<ol/);
  assert.equal((markup.match(/aria-current="step"/g) ?? []).length, 1);
  assert.match(markup, /Pasirinkimas/);
});

/* ------------------------------------------------------------------ */
/* i18n key parity — sprint-2 keys in all three catalogs               */
/* ------------------------------------------------------------------ */

test('sprint-2 keys exist in all three locale catalogs', () => {
  const expected: Record<string, string[]> = {
    commerce: ['availableAtLaunch', 'emptyProducts', 'outOfStockBadge', 'preOrderBadge'],
    collections: ['chatbotEntryLabel', 'plotAvailable', 'plotReserved', 'plotOccupied'],
  };
  for (const locale of ['lt', 'en', 'ru']) {
    const catalog = JSON.parse(
      readFileSync(join(__dirname, '../../../i18n/src/messages', `${locale}.json`), 'utf-8'),
    ) as Record<string, Record<string, string>>;
    for (const [ns, keys] of Object.entries(expected)) {
      for (const key of keys) {
        assert.ok(catalog[ns][key], `${locale}: missing ${ns}.${key}`);
      }
    }
  }
});
