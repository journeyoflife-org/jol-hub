/**
 * Commerce domain types — STEP 8.
 *
 * Shared vocabulary for booking, donations, subscriptions and the shop.
 *
 * SECURITY / COMPLIANCE:
 * - PCI-DSS (SAQ A, ADR-0005 Model A): card data NEVER appears in these types
 *   or anywhere in jol-hub. Payments are confirmed against a client secret via
 *   Stripe-hosted surfaces (js.stripe.com) in the browser; intent creation is
 *   delegated to the internal payment API. No PAN/CVV/magstripe fields exist.
 * - GDPR Art. 9: commercial payloads must not carry special-category data
 *   across tenants. Every entity is tagged with its `tenantSlug` (RLS context).
 * - Amounts are integer EURO CENTS to avoid float drift; display via money.ts.
 */

/** Monetary amount in EUR cents (integer). */
export type Cents = number;

/** Commercial capability flags gated by package tier (FEATURES_BY_TIER). */
export type CommerceCapability = 'booking' | 'donations' | 'shop' | 'subscriptions';

/** A sellable product (flowers, coffins, urns, vestments, cleaning supplies). */
export interface Product {
  id: string;
  /** Owning tenant — RLS isolation; never served cross-tenant. */
  tenantSlug: string;
  name: string;
  description?: string;
  /** VAT-inclusive unit price. */
  price: Price;
  category?: string;
  imageUrl?: string;
  /** Variant axes, e.g. [{ name: 'size', options: ['S','M','L'] }]. */
  variants?: ProductVariant[];
  stock: StockStatus;
}

export interface ProductVariant {
  name: string;
  options: string[];
}

export interface Price {
  /** VAT-inclusive unit amount in cents. */
  amount: Cents;
  currency: 'EUR';
}

export type StockStatus =
  | { kind: 'in-stock'; quantity: number }
  | { kind: 'low-stock'; quantity: number }
  | { kind: 'out-of-stock' }
  | { kind: 'backorder' };

/** A line in a cart. */
export interface CartItem {
  productId: string;
  name: string;
  /** VAT-inclusive unit price in cents. */
  unitPrice: Cents;
  quantity: number;
  /** Selected variant descriptor, e.g. "size: M". */
  variant?: string;
}

export interface Cart {
  items: CartItem[];
}

/** Order lifecycle (created server-side; hub never computes charges client-side). */
export interface Order {
  id: string;
  tenantSlug: string;
  items: CartItem[];
  /** VAT-inclusive total in cents. */
  total: Cents;
  status: 'pending' | 'paid' | 'fulfilled' | 'cancelled' | 'refunded';
  createdAt: string;
}

/** A bookable time slot for a service. */
export interface BookingSlot {
  id: string;
  tenantSlug: string;
  serviceId: string;
  /** ISO 8601 start. */
  startDateTime: string;
  /** ISO 8601 end. */
  endDateTime: string;
  staffId?: string;
  available: boolean;
}

/** A booking request submitted by a customer. */
export interface BookingRequest {
  tenantSlug: string;
  serviceId: string;
  slotId: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
    notes?: string;
  };
  /** GDPR consent to process the booking data. */
  consent: boolean;
}

export interface BookingConfirmation {
  reference: string;
  tenantSlug: string;
  startDateTime: string;
  /** iCal/ICS download for calendar integration (optional). */
  icsUrl?: string;
}

/** A subscription plan (e.g. cemetery-care schedule). */
export interface SubscriptionPlan {
  id: string;
  tenantSlug: string;
  name: string;
  interval: 'month' | 'year';
  /** VAT-inclusive recurring amount in cents. */
  amount: Cents;
  features: string[];
}

export interface Subscription {
  id: string;
  tenantSlug: string;
  planId: string;
  status: 'active' | 'past_due' | 'cancelled' | 'trialing';
  currentPeriodEnd: string;
}

/** A donation request (churches/dioceses). */
export interface DonationRequest {
  tenantSlug: string;
  /** VAT-irrelevant amount in cents; minimum €1 (100 cents). */
  amount: Cents;
  frequency: 'one-time' | 'monthly' | 'annual';
  /** Donor may hide their name (privacy). */
  anonymous: boolean;
  /** GDPR consent to process the donation. */
  consent: boolean;
  /** Tax-receipt eligibility flag surfaced to the donor. */
  taxReceiptRequested?: boolean;
}

/** Minimum donation amount in cents (Stripe limitation, €1). */
export const MIN_DONATION_CENTS = 100;
