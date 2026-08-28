/**
 * @jol-hub/commerce — commerce domain core (STEP 8).
 *
 * Framework-agnostic logic: types, API client, cart/VAT math, EUR formatting,
 * package-tier capability gating. React bindings (hooks + components) live in
 * the template renderer (`src/components/commerce/`).
 *
 * COMPLIANCE: PCI-DSS SAQ A (ADR-0005 Model A) — hub never touches card data;
 * GDPR Art. 9 — all commerce entities are tenant-scoped (RLS). See
 * `scripts/check-payment-boundary.sh`.
 */
export * from './types';
export * from './money';
export * from './cart';
export * from './gating';
export * from './commerce-api';
