/**
 * Commerce API client — STEP 8.
 *
 * Calls the `jol-ecommerce-engine` backend (base URL from COMMERCE_API_URL).
 *
 * PILOT REALITY: the commerce backend does not exist yet. Every call is
 * graceful — when COMMERCE_API_URL is unset the client returns an
 * `unconfigured` result instead of throwing, so components can render a
 * "coming soon" state (consistent with ADR-007 payments-pending).
 *
 * PCI-DSS (SAQ A, ADR-0005 Model A): this client NEVER transmits card data.
 * Payment intent creation is delegated to the backend, which is the sole
 * Stripe integrator boundary. Only opaque client secrets come back.
 *
 * RETRY POLICY: idempotent GETs retry with backoff; POSTs (bookings,
 * donations, subscriptions) are NOT retried automatically to avoid duplicate
 * charges/bookings — the caller decides.
 */
import type {
  BookingConfirmation,
  BookingRequest,
  DonationRequest,
  Order,
  Product,
  Subscription,
  SubscriptionPlan,
} from './types';

/** Commerce API failure taxonomy. */
export type CommerceErrorKind =
  | 'unconfigured' // COMMERCE_API_URL not set (pilot).
  | 'network' // fetch failed / timeout.
  | 'validation' // 4xx from the backend (bad input).
  | 'payment' // payment declined / requires action.
  | 'server'; // 5xx from the backend.

export interface CommerceApiError {
  kind: CommerceErrorKind;
  message: string;
  /** Safe to retry idempotently. */
  retryable: boolean;
}

export type CommerceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: CommerceApiError };

/** Max automatic retries for idempotent GET requests. */
const MAX_GET_RETRIES = 2;

/** Base delay (ms) for GET retry backoff. */
const RETRY_BASE_MS = 250;

/** Resolve the commerce backend base URL, or null when unconfigured. */
export function commerceBaseUrl(): string | null {
  const url = process.env.COMMERCE_API_URL;
  return url && url.trim().length > 0 ? url.replace(/\/+$/, '') : null;
}

/** True when the commerce backend is configured. */
export function isCommerceConfigured(): boolean {
  return commerceBaseUrl() !== null;
}

function unconfiguredResult<T>(): CommerceResult<T> {
  return {
    ok: false,
    error: {
      kind: 'unconfigured',
      message: 'Commerce backend is not configured (COMMERCE_API_URL unset).',
      retryable: false,
    },
  };
}

function errorFromStatus(status: number, body: string): CommerceApiError {
  if (status === 402 || status === 403) {
    return { kind: 'payment', message: body || 'Payment was declined or is not authorised.', retryable: false };
  }
  if (status >= 400 && status < 500) {
    return { kind: 'validation', message: body || 'The request was rejected.', retryable: false };
  }
  return { kind: 'server', message: body || 'The commerce service is temporarily unavailable.', retryable: true };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Low-level fetch with tenant scoping. Adds `X-Tenant` so the backend can
 * enforce RLS (GDPR Art. 9 isolation). GETs retry; mutations do not.
 */
async function request<T>(
  method: 'GET' | 'POST',
  path: string,
  tenantSlug: string | undefined,
  body?: unknown,
): Promise<CommerceResult<T>> {
  const base = commerceBaseUrl();
  if (!base) return unconfiguredResult<T>();

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (tenantSlug) headers['X-Tenant'] = tenantSlug;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const retries = method === 'GET' ? MAX_GET_RETRIES : 0;
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const response = await fetch(`${base}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      if (response.ok) {
        const data = (await response.json()) as T;
        return { ok: true, data };
      }
      const text = await response.text().catch(() => '');
      return { ok: false, error: errorFromStatus(response.status, text) };
    } catch {
      if (attempt >= retries) {
        return {
          ok: false,
          error: { kind: 'network', message: 'Could not reach the commerce service.', retryable: method === 'GET' },
        };
      }
      attempt += 1;
      await sleep(RETRY_BASE_MS * attempt);
    }
  }
}

// =============================================================================
// SHOP
// =============================================================================

/** List a tenant's products (optionally filtered by category). */
export function getProducts(
  tenantSlug: string,
  category?: string,
): Promise<CommerceResult<Product[]>> {
  const query = category ? `&category=${encodeURIComponent(category)}` : '';
  return request<Product[]>('GET', `/products?tenant=${encodeURIComponent(tenantSlug)}${query}`, tenantSlug);
}

/** Fetch order history for a customer. */
export function getOrders(tenantSlug: string, customerId: string): Promise<CommerceResult<Order[]>> {
  return request<Order[]>(
    'GET',
    `/orders?tenant=${encodeURIComponent(tenantSlug)}&customer=${encodeURIComponent(customerId)}`,
    tenantSlug,
  );
}

// =============================================================================
// BOOKING
// =============================================================================

/** Create a booking. NOT retried automatically (avoid duplicate bookings). */
export function createBooking(tenantSlug: string, booking: BookingRequest): Promise<CommerceResult<BookingConfirmation>> {
  return request<BookingConfirmation>('POST', '/bookings', tenantSlug, booking);
}

// =============================================================================
// DONATIONS
// =============================================================================

/**
 * Create a donation payment intent. Returns an opaque client secret to confirm
 * against Stripe-hosted Elements in the browser. NEVER carries card data.
 */
export function createDonationIntent(tenantSlug: string, donation: DonationRequest): Promise<CommerceResult<{ clientSecret: string }>> {
  return request<{ clientSecret: string }>('POST', '/donations', tenantSlug, donation);
}

// =============================================================================
// SUBSCRIPTIONS
// =============================================================================

/** List subscription plans available to a tenant (tier/vertical-filtered). */
export function getSubscriptionPlans(tenantSlug: string): Promise<CommerceResult<SubscriptionPlan[]>> {
  return request<SubscriptionPlan[]>('GET', `/subscriptions/plans?tenant=${encodeURIComponent(tenantSlug)}`, tenantSlug);
}

/**
 * Start a subscription. Returns a Stripe Checkout / Billing Portal redirect
 * URL — hub never hosts the card form itself (SAQ A).
 */
export function createSubscription(
  tenantSlug: string,
  planId: string,
): Promise<CommerceResult<{ checkoutUrl: string }>> {
  return request<{ checkoutUrl: string }>('POST', '/subscriptions', tenantSlug, { planId });
}

/** Fetch the tenant's active subscription (for the manager UI). */
export function getSubscription(tenantSlug: string): Promise<CommerceResult<Subscription | null>> {
  return request<Subscription | null>('GET', `/subscriptions?tenant=${encodeURIComponent(tenantSlug)}`, tenantSlug);
}
