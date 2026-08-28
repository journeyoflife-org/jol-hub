/**
 * Commerce components barrel — STEP 8.
 *
 * Client-side commercial UI (booking, donations, subscriptions, shop) for the
 * template renderer. All components are package-tier-gated via
 * `useTenantFeature` and show ADR-007 "payments pending" states until the
 * commerce backend + Stripe wiring land. Domain logic lives in
 * `@jol-hub/commerce`.
 */
export { CartProvider, useCart } from './cart-context';
export { BookingWidget } from './BookingWidget';
export type { BookingService, BookingStaff, BookingWidgetProps } from './BookingWidget';
export { DonationForm } from './DonationForm';
export type { DonationFormProps } from './DonationForm';
export { SubscriptionManager } from './SubscriptionManager';
export type { SubscriptionManagerProps } from './SubscriptionManager';
export { ProductCard, ProductGrid } from './ProductCard';
export type { ProductGridProps } from './ProductCard';
export { CartShell } from './CartShell';
export type { CartShellProps } from './CartShell';
