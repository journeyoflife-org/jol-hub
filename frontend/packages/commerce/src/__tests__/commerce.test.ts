/**
 * Commerce core tests — STEP 8.
 *
 * Covers cart math, VAT-inclusive breakdown, EUR formatting and capability
 * gating. Run via `pnpm --filter @jol-hub/commerce test` (tsx --test).
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  addItem,
  emptyCart,
  isEmpty,
  lineCount,
  removeItem,
  setQuantity,
  subtotal,
  unitCount,
} from '../cart';
import { formatEur, LT_VAT_RATE, netFromInclusive, vatBreakdown, vatFromInclusive } from '../money';
import { entitledCapabilities, hasCommerceCapability } from '../gating';
import { MIN_DONATION_CENTS } from '../types';

test('addItem adds a line and increments quantity on repeat', () => {
  let cart = emptyCart();
  cart = addItem(cart, { productId: 'p1', name: 'Roses', unitPrice: 1500 });
  cart = addItem(cart, { productId: 'p1', name: 'Roses', unitPrice: 1500 });
  assert.equal(lineCount(cart), 1);
  assert.equal(unitCount(cart), 2);
});

test('addItem keeps variants as separate lines', () => {
  let cart = emptyCart();
  cart = addItem(cart, { productId: 'p1', name: 'Urn', unitPrice: 9900, variant: 'color: white' });
  cart = addItem(cart, { productId: 'p1', name: 'Urn', unitPrice: 9900, variant: 'color: oak' });
  assert.equal(lineCount(cart), 2);
});

test('setQuantity below 1 removes the line', () => {
  let cart = emptyCart();
  cart = addItem(cart, { productId: 'p1', name: 'Candles', unitPrice: 300 });
  cart = setQuantity(cart, 'p1', 0);
  assert.equal(isEmpty(cart), true);
});

test('removeItem removes only the targeted line', () => {
  let cart = emptyCart();
  cart = addItem(cart, { productId: 'p1', name: 'A', unitPrice: 100 });
  cart = addItem(cart, { productId: 'p2', name: 'B', unitPrice: 200 });
  cart = removeItem(cart, 'p1');
  assert.equal(lineCount(cart), 1);
  assert.equal(subtotal(cart), 200);
});

test('subtotal is VAT-inclusive and quantity-aware', () => {
  let cart = emptyCart();
  cart = addItem(cart, { productId: 'p1', name: 'A', unitPrice: 1250, quantity: 2 });
  cart = addItem(cart, { productId: 'p2', name: 'B', unitPrice: 500 });
  assert.equal(subtotal(cart), 3000);
});

test('vatFromInclusive extracts 21% VAT correctly', () => {
  // €12.10 inclusive → €2.10 VAT, €10.00 net.
  assert.equal(vatFromInclusive(1210), 210);
  assert.equal(netFromInclusive(1210), 1000);
});

test('vatBreakdown sums back to the inclusive total', () => {
  const breakdown = vatBreakdown(3000);
  assert.equal(breakdown.net + breakdown.vat, breakdown.totalInclusive);
  assert.equal(breakdown.rate, LT_VAT_RATE);
});

test('formatEur renders locale-aware EUR', () => {
  const lt = formatEur(1250, 'lt');
  assert.match(lt, /12[.,]50/);
  assert.match(lt, /€/);
});

test('hasCommerceCapability reflects the feature set', () => {
  const features = ['donations', 'booking'];
  assert.equal(hasCommerceCapability(features, 'donations'), true);
  assert.equal(hasCommerceCapability(features, 'booking'), true);
  assert.equal(hasCommerceCapability(features, 'shop'), false);
});

test('entitledCapabilities lists only entitled flags', () => {
  const entitled = entitledCapabilities(['shop', 'subscriptions']);
  assert.deepEqual(entitled.sort(), ['shop', 'subscriptions']);
});

test('MIN_DONATION_CENTS enforces the €1 Stripe minimum', () => {
  assert.equal(MIN_DONATION_CENTS, 100);
});
