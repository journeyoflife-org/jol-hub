# Page Package 15 — Marketplace Vendor Dashboard

Batch 2/3 (Phase 2.2) · Governing: design-system-spec v1 (c9165a3e) · SEO strategy (6da34b18) row 15 · Cross-tree boundary as package 14: hub renders the authenticated shell; transactions and payouts are marketplace-side; **zero PSP surface in hub**.

## 1. Wireframe (mobile-first; authenticated surface)

1. Auth gate (vendor role; package 20's AuthGate pattern)
2. Header (admin variant) · 3. Overview cards: orders awaiting action, listing health, messages
4. Listings panel: vendor's products (CRUD → catalog feeds package 13/14 surfaces)
5. Orders panel: order states **mirrored from marketplace events** (contract envelope facts — the dashboard displays `payment_intent_id`-correlated facts; it never touches PSP objects)
6. Payout info block: **read-only summary, marketplace-authoritative** (hub shows status facts only; payout execution is marketplace-side)
7. Footer

## 2. Content model

Editable by vendors: listings (name, description, VAT-incl prices per package 13 rules, images), response to orders (status acknowledgments). NOT editable in hub: payment capture, refunds, payout schedules (marketplace-side, Model A). Order facts arrive via contract v1.1.0 events (dedupe by `event_id`; out-of-order tolerance per contract §1) — dashboard renders the latest fact per `payment_intent_id`.

## 3. SEO metadata (row 15 — Implemented posture)

- **noindex** (authenticated surface; robots policy by kind — SEO hard rule 4 posture); no JSON-LD ever; no hreflang (app surface); auth before any content bytes (package 20 pattern)

## 4. Component mapping

AuthGate ✓ · DashboardShell ✗ (shared build, package 20) · ListingsManager ✗ build · OrdersFactList ✗ build (renders contract facts) · PayoutSummaryCard ✗ build (read-only) — backlog additions to DS §6 authenticated-surface group.

## 5. Audience journeys

- **Vendor (primary)**: manage listings → see order facts → act on fulfillment
- **Marketplace admin**: compliance view of vendor activity (audit trail, read-only)

## 6. a11y acceptance

DS-A11Y-01, 03, 05, 07, 09, 10, 12 — authenticated ≠ exempt (package 20 precedent)

## 7. Analytics

Essential operational telemetry only; no vendor-behavior profiling; PII never logged (marketplace integration posture mirrored)
