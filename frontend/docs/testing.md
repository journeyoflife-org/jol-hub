# Frontend Testing Strategy — STEP 15

Comprehensive testing across all layers: unit, integration, E2E,
accessibility and security. This document is the single reference for
running, extending and reasoning about the suites.

## The pyramid

```
        E2E (Playwright)          10 critical flows, 3 browsers
       Integration (MSW)          route handlers ↔ mocked backend
      Unit (vitest + RTL)         components, hooks, editor core
     Logic (node:test)            pure modules, no DOM — 8 packages
```

Many unit tests, fewer integration, fewest E2E — each tier mocks more of
the world and runs faster than the one above it.

## Two runners, by design

| Runner | Tier | Where | Why |
| --- | --- | --- | --- |
| `node:test` (`tsx --test`) | pure logic | `src/__tests__/*.test.ts` in each package | zero-config, fast, no DOM needed — established STEPS 6–14 |
| vitest 4 | DOM tiers | `apps/template-renderer/src/__tests__/vitest/**` | jsdom + RTL + MSW + v8 coverage |

Vitest cannot execute `node:test` registrations and the logic suites
predate it; both stay green in CI. New DOM-dependent tests go to vitest;
new pure-logic tests may use either (prefer vitest for new files).

## Running locally

```bash
cd frontend

pnpm test                      # logic suites, all packages (turbo)
pnpm test:unit                 # logic + vitest DOM tiers
pnpm test:security             # XSS / RBAC / isolation suite
pnpm test:a11y                 # axe-core (renderer check needs the app running)
pnpm test:e2e                  # Playwright (browser binaries required)

# Coverage (v8, thresholds enforced in vitest.config.ts)
pnpm --filter template-renderer test:vitest:coverage

# Build-output gates (after `pnpm --filter template-renderer build`)
pnpm --filter template-renderer check-perf       # STEP 13 budgets
pnpm --filter template-renderer check-secrets    # secret leakage scan
```

## Suites at a glance

| Suite | File(s) | Covers |
| --- | --- | --- |
| Components | `vitest/components.test.tsx` | Button, Badge, ContactForm (GDPR consent gate) |
| Hooks | `vitest/hooks.test.tsx` | useTranslations, tenant feature gates, cart isolation |
| Editor core | `vitest/editor-lib.test.ts` | constraints, diff, moderation helpers, prohibited patterns |
| Editor components | `vitest/editor-components.test.tsx` | BlockEditor/MediaUploader/ModerationQueue gates + flows |
| Integration | `vitest/api-integration.test.ts` | `/api/editor/*`, `/api/perf` via real handlers + MSW |
| Security | `vitest/security.test.tsx` | XSS battery, URL policy, RBAC matrix, slug injection |
| Logic | `__tests__/*.test.ts` per package | resolver, LRU, seo, a11y, commerce, crm, rbac, perf |
| E2E | `apps/template-renderer/e2e/*.spec.ts` | 10 critical flows (see `e2e/README.md`) |

## MSW — how API mocking works

Integration tests import the REAL Next.js route handlers and call them
with `NextRequest` objects. Outbound calls to the hub backend are
intercepted by `setupServer(...backendHandlers)` from
`@jol-hub/testing` — the reserved origin `http://backend.test` is stubbed
into `BACKEND_API_URL` before each dynamic route import (routes capture
the env at module load). Tests NEVER touch a real backend, Stripe or
Bitrix24.

## Coverage policy

- Provider: v8, scoped to the DOM/security-critical subset
  (`src/lib/editor/**`, `src/components/editor/**`).
- Thresholds are a RATCHET (see `vitest.config.ts`): raise, never lower.
- `lib/editor` — the constrained-editor security core — sits at ~85%+;
  the editor *components* are partially covered through their gates and
  primary flows.
- Pure-logic packages are covered by their own node:test suites (not v8).
- "Coverage is a guide, not a goal" — 100% coverage ≠ 0 bugs; the XSS
  battery and RBAC matrix exist because risk, not coverage, demanded them.

## E2E pilot expectations

The platform is in pilot: hub backend, OIDC and payments are not live.
Specs lock the HONEST pilot behavior (empty states, payment-pending
notice, auth redirects) instead of faking flows — `e2e/README.md` maps
each spec to the condition that activates its full version.

## Determinism rules (spec RULES)

1. **No random data** — fixtures in `packages/testing/src/{mocks,fixtures}`
   are constant; session expiry is a fixed 2099 date.
2. **No time dependence** — no wall-clock assertions; `beforeEach` pins TZ.
3. **No network** — MSW (node) or `vi.stubGlobal('fetch', …)`; vitest
   timeouts fail accidental waits.
4. **Isolation** — RTL cleanup after every test, `localStorage.clear()`
   in cart tests, `vi.resetModules()` around env-capturing route imports.

## Naming convention

`Component.should.behavior` — e.g.
`ContactForm.should.block submission without consent`.

## Adding tests

1. Pure logic → `__tests__/*.test.ts` next to the code (`node:test` or
   vitest), or under `vitest/` if it needs jsdom.
2. Components → render through `renderWithProviders` from
   `@jol-hub/testing` (real theme + i18n providers; pass a `wrapper` for
   tenant/auth contexts).
3. API surface → add a case to `api-integration.test.ts`; add/override
   MSW handlers via `server.use(...)` — never stub handler code.
4. Security surface → extend the payload batteries in
   `@jol-hub/testing` (`XSS_PAYLOADS`, `CONTACT_XSS_PAYLOADS`) so every
   sanitization layer runs the same canonical list.

## Mock data & fixtures

| Source | Purpose | Update when… |
| --- | --- | --- |
| `packages/testing/src/mocks/tenant.ts` | tenant records (tiers) | tier/feature matrix changes |
| `packages/testing/src/mocks/auth.ts` | session/RBAC fixtures | role taxonomy changes |
| `packages/testing/src/mocks/api.ts` | MSW handlers + canned JSON | backend contract changes |
| `packages/testing/src/fixtures/blocks.ts` | block drafts + XSS battery | new block type or payload class |
| `packages/seed-data/src/fixtures/tenants/*.json` | rendered content | E2E flows need real content |

Keep fixtures deterministic; prefer overriding a field over copying a
whole fixture.

## Flaky-test policy

CI retries E2E twice. A test that flakes twice is **quarantined with an
issue** — never promoted to indefinite retries. Flaky count target: 0.

## CI

`.github/workflows/frontend-test.yml` runs five parallel-ish tiers
(unit, build-gate, a11y, security, e2e←unit) on every frontend PR and
blocks merge via the `test-summary` gate. Artifacts: coverage report,
Playwright report (14-day retention). `ci.yml` keeps lint/type-check/
basic tests; this workflow owns the STEP-15 tiers.

## Compliance mapping

- SOC 2 CC7.2 — testing as quality control (this suite + CI gate).
- SOC 2 CC8.1 — change control: merge blocked while tiers are red.
- GDPR Art. 32 — security tests (XSS battery, RBAC matrix, isolation,
  secret-leakage scan) are the technical-measure evidence.
- ISO 27001:2022 A.8.8 — the budget/secret/security gates run on every
  change (technical compliance review).
