/**
 * Money helpers — STEP 8.
 *
 * All amounts travel as integer EURO CENTS (no float drift). Display uses
 * locale-aware EUR formatting; tax is shown VAT-INCLUSIVE with a breakdown
 * (LT standard rate 21%). Pure functions — fully unit-testable.
 */
import type { Cents } from './types';

/** Lithuanian standard VAT rate. */
export const LT_VAT_RATE = 0.21;

/**
 * Format cents as a locale-aware EUR string (e.g. `12.50` → "12,50 €" in lt).
 * Uses Intl.NumberFormat so the symbol/decimal separators follow the locale.
 */
export function formatEur(cents: Cents, locale = 'lt'): string {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
  });
  return formatter.format(cents / 100);
}

/** Sum of `unitPrice * quantity` for a set of lines (cents). */
export function lineTotal(unitPrice: Cents, quantity: number): Cents {
  return unitPrice * quantity;
}

/**
 * Extract the VAT portion from a VAT-INCLUSIVE amount.
 * inclusive = net * (1 + rate)  →  vat = inclusive * rate / (1 + rate).
 * Rounded to the nearest cent.
 */
export function vatFromInclusive(inclusive: Cents, rate: number = LT_VAT_RATE): Cents {
  return Math.round((inclusive * rate) / (1 + rate));
}

/** Net (pre-VAT) portion of a VAT-inclusive amount. */
export function netFromInclusive(inclusive: Cents, rate: number = LT_VAT_RATE): Cents {
  return inclusive - vatFromInclusive(inclusive, rate);
}

/** A VAT breakdown for display at checkout. */
export interface VatBreakdown {
  /** VAT-inclusive total. */
  totalInclusive: Cents;
  /** Net (pre-VAT) subtotal. */
  net: Cents;
  /** VAT amount. */
  vat: Cents;
  /** Applied rate (e.g. 0.21). */
  rate: number;
}

/** Build a VAT breakdown from a VAT-inclusive total. */
export function vatBreakdown(totalInclusive: Cents, rate: number = LT_VAT_RATE): VatBreakdown {
  const vat = vatFromInclusive(totalInclusive, rate);
  return { totalInclusive, net: totalInclusive - vat, vat, rate };
}
