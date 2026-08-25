# E2E suite — STEP 15

Playwright flows against the built app (`next start` via `webServer`).

## Running

```bash
npx playwright install chromium firefox webkit   # needs network
pnpm --filter template-renderer test:e2e
```

On the offline build host the browser binaries are unavailable — the suite
is committed and runs in CI / on equipped workstations.

## Pilot expectations

The platform is in pilot: hub backend, OIDC and payments are not live.
Specs assert the HONEST pilot behavior rather than faking flows:

| Spec | Pilot behavior locked | Full behavior activates when… |
| --- | --- | --- |
| 01 home/news | empty-state copy | backend content plane lands |
| 02 contact | stub CRM success + consent gate | Bitrix24 plane wired |
| 03 services | empty state + soft-404 | services seeded |
| 04 donation | ADR-007 pending notice, zero Stripe DOM | payment boundary opens |
| 05 auth gates | pilot notices, zero decision surfaces | jol-auth configured (then redirects/403) |
| 08 language | select-based switch + persistence | — (already full) |
| 09 mobile | hamburger + skip link | — (already full) |
| 10 SEO | meta/canonical/JSON-LD/lang | — (already full) |

## Conventions

- Fixture tenant: `parish-st-john-vilnius` (seed-data DEFAULT_TENANT_SLUG).
- Tenant headers: production path resolution (no x-tenant override).
- Flakes: 2 retries in CI; a test that flakes twice is quarantined with an
  issue — never raised to infinite retries.
