# O-021 ADJUDICATION — Donation Widget vs Payment Boundary (Model A)

Date: 2026-08-28 · Authority: D-039 (owner grant to the 2.3 task) · Governing: ADR-009 (Model A, boundary CLOSED), ADR-010 (guard + exemption discipline), contract v1.1.0 · Status: **RECOMMENDATION RECORDED — awaiting owner disposition verdict** (no code touched in this task).

## 1. Precise contradiction (verified READ-ONLY)

**The widget** (`frontend/packages/ui/src/components/donation/`, 2,694 lines, 15 files): `DonationWidget.tsx` imports `loadStripe` from `@stripe/stripe-js` and loads `process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`; `StripePaymentForm.tsx` / `DonationPaymentStep.tsx` implement a card-data step; `stripe-error-mapping.ts`, `DonationApi.ts`, `BitrixCrmSync.ts` (cites "ADR-007"), `useDonationWidgetFlow.ts` complete the PSP-integrated flow. Exported publicly via `packages/ui/src/index.ts` (L96–100).

**ADR-009 Model A forbids exactly this**: jol-hub stays OUT of PCI scope; the marketplace `payments_app` is the SOLE PSP integrator; zero PSP SDKs/keys/card fields in the hub tree. The widget contradicts §2 directly. (It predates ADR-009's ratification — legacy contradiction, not negligence.)

**Reference map — the critical finding (live-but-narrow):**

| Reference | Uses the PSP widget? | Consequence |
|---|---|---|
| `template-renderer/src/modules/donation-cta-module.tsx` (the production renderer module, feature-gated `donations`) | **NO** — uses commerce `DonationForm` with explicit "Stripe is not wired in the pilot" pending-payments notice | The tenant-facing surface is already Model-A-consistent |
| `master-site/src/app/donate/page.tsx` | **YES** — renders `DonationWidget` with hardcoded parish props (demo content) | Legacy demo surface, PSP-wired |
| `parish-template/src/app/templates/parish/page.tsx` | **YES** — imports `DonationWidget` (legacy pilot template) | Legacy demo surface, PSP-wired |
| `packages/ui/src/dev/Showcase.tsx` | YES (dev showcase) | Dev-only |

**Composite variant** (`packages/ui/src/components/composite/donation-widget/`, 141 lines): a separate, Model-A-COMPLIANT implementation (no `loadStripe`; header comment explicitly directs to Stripe-hosted fields/Checkout and cites "ADR-007"). It is the forward-compatible seed.

**"ADR-007" citation note**: no `ADR-007-*.md` exists in `docs/decisions/` (registry: 001, 002, 008, 009, 010). References to "ADR-007 payments-boundary" appear only in widget-era code comments and `frontend/docs/wave0/*` — presumed superseded/uncommitted ancestor of ADR-009. Recorded as factual observation; the live governance instrument is ADR-009.

## 2. Disposition recommendation: **DORMANT-REMOVAL + GUARD EXTENSION** (staged, because references exist)

The widget has live references, so per the 2.3 task's own contingency this is a **staged removal**, not a blind delete:

- **S1 (owner-verdict-gated)**: unwire the two demo apps — `master-site/donate` page and `parish-template` parish page swap to the composite/handoff pattern (or the pages are retired). No production renderer change needed (it never consumed the widget).
- **S2**: delete `packages/ui/src/components/donation/` + its `index.ts` exports; git history preserves the code (no archive branch needed — history retention is the preservation mechanism; an archive branch would carry PSP code forward unnecessarily).
- **S3**: **GUARD EXTENSION** (specified below, implemented after verdict) — makes re-introduction mechanically impossible.
- Rationale vs alternatives: keeping it "dormant-but-present" fails — the export from `packages/ui/index.ts` means any consumer can import PSP surface; Model A's value is the mechanical invariant, not the intent.

## 3. Guard extension specification (implement after verdict; falsification-mandatory per ADR-010's permanent obligation)

Extend `scripts/check-payment-boundary.sh` with a new layer: **PSP-import detection in frontend code**:
- Target scope: `frontend/apps/**` + `frontend/packages/**` (`.ts/.tsx/.js/.jsx`)
- Fail on: `@stripe/stripe-js`, `@stripe/react-stripe-js`, `@stripe/*` imports; `loadStripe(`; `NEXT_PUBLIC_STRIPE_` env references; other PSP SDK markers (paypal/braintree/adyen/mollie SDK imports — same class)
- Exemptions via the existing **VOCAB/RULEDOC ledger discipline only** (ADR-010): this spec's own prose is a doc, already ledger-eligible if it ever lands where the scanner looks; no new exemption class
- **Falsification tests (mandatory, both directions)**: (a) planted `import { loadStripe } from '@stripe/stripe-js'` in a scratch file → exit 1; (b) clean tree post-S2 → exit 0; (c) canary must ALSO run against today's tree and exit 1 (proving the detector sees the current violation — the pre-S2 state)

## 4. Marketplace-side reuse note (pointer, not a move)

Worth porting INTO the marketplace tree (where PSP surface is legal and `payments_app` owns Elements): `donation-validation.ts` (amount/frequency validation rules), `stripe-error-mapping.ts` (PSP error → humane-message taxonomy), `useDonationWidgetFlow.ts` state-machine shape, `donation-icons.tsx`. NOT worth porting: `BitrixCrmSync.ts` (hub-CRM coupling), the publishable-key env pattern (marketplace already has its own SAQ-A posture). Marketplace tree has its own governance — any port is a marketplace-tree task under ITS rules, never this one.

## 5. Owner decision points

1. **Disposition verdict**: accept DORMANT-REMOVAL (staged S1→S3), or direct otherwise
2. **Demo-page fate** (S1): unwire-and-keep the two demo pages vs retire them entirely
3. **Guard extension**: authorize implementation in hub (and the mirror update to the jol-m-infrastructure record copy, per the ADR-010 two-tree pattern, when executed)
4. **Timing**: removal now (before implementation phases) vs bundled with the donation-components build task (batch-2 phasing note)
