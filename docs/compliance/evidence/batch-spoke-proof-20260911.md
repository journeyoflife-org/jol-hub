# Batch Spoke Proof — 9 Vertical Sites (Task 4.1)

> **Date:** 2026-09-11
> **Hub commit:** `c6494c74` (feat/pages-step6)
> **Page specs:** 04–12 (docs/design/pages/)
> **Playbook:** docs/compliance/evidence/spoke-playbook.md

## Phase A — Scaffold Results

All 9 spokes scaffolded from `jol-frontend-repo-template` via `instantiate.sh`.

| Spoke | Commit | Drift | PSP (INV-3) | Theme (INV-7) | Secrets | Workflow (INV-6) |
|---|---|---|---|---|---|---|
| cathedral | 8193a44 | PASS | PASS | PASS | PASS | PASS |
| diocese | cc9390d | PASS | PASS | PASS | PASS | PASS |
| deanery | 07c7e8e | PASS | PASS | PASS | PASS | PASS |
| parish | 64d1da6 | PASS | PASS | PASS | PASS | PASS |
| funeral | 557aba4 | PASS | PASS | PASS | PASS | PASS |
| cemetery-care | d20a7a8 | PASS | PASS | PASS | PASS | PASS |
| protestant | 4d2b767 | PASS | PASS | PASS | PASS | PASS |
| orthodox | b2abe65 | PASS | PASS | PASS | PASS | PASS |
| other-church | 9165d23 | PASS | PASS | PASS | PASS | PASS |

**Result: 9/9 spokes — all 5 shell gates PASS**

## Phase B — Fixture Updates

9 fixtures updated with 3-locale parity (lt/en/ru):

| Fixture | Localized texts | ru keys added | TODO markers |
|---|---|---|---|
| cathedral-kaunas | 33 | 33 | 25 |
| diocese-vilnius | 33 | 33 | 25 |
| deanery-vilnius-city | 36 | 36 | 25 |
| parish-st-john-vilnius | 51 | 51 | 38 |
| funeral-vilnius | 59 | 59 | 35 |
| cemetery-vilnius | 69 | 69 | 40 |
| lutheran-kaunas | 30 | 30 | 21 |
| orthodox-vilnius-cathedral | 48 | 48 | 39 |
| greek-catholic-vilnius | 49 | 49 | 36 |
| **TOTAL** | **408** | **408** | **284** |

All fixtures validate against `TenantFixtureSchema.safeParse()` → VALID.
17/17 hub invariant tests pass.

## Phase C — Page Components

Each spoke has 6 source files:
- `src/app/page.tsx` — wireframe from page spec
- `src/app/layout.tsx` — from template (unchanged)
- `src/lib/resolve-locale.ts` — 3-locale resolution
- `src/lib/json-ld.ts` — Church entity + breadcrumb builders
- `src/lib/analytics.ts` — consent-gated events
- `src/fixtures/tenant.json` — spoke fixture copy

### A11y static analysis (all 9 spokes)

| Check | Result |
|---|---|
| `<h1>` present | 9/9 PASS |
| `aria-label` on sections | 9/9 PASS |
| JSON-LD scripts | 9/9 PASS |
| No denomination literals in src/app/ | 9/9 PASS (INV-7) |
| No PSP imports in src/ | 9/9 PASS (INV-3) |

## Hub Invariant Tests

| Test suite | Result |
|---|---|
| adr011-invariants.test.ts | 17/17 PASS, exit 0 |

## Deferred (require owner action)

| Item | Blocker |
|---|---|
| GitHub repo creation (9 repos) | Owner must create at journeyoflife-org |
| Remote configuration + push | Requires GitHub repos |
| Branch protection | Requires GitHub repos |
| Lighthouse ≥ 90 mobile | Requires Proxmox deployment |
| Breakpoint check 360/768/1024/1440 | Requires running instance |
| type-check, test:unit, test:e2e | @jol-hub/* packages not published |
| Proxmox deployment with noindex | Requires infra setup |

## Spoke-to-Page-Spec Mapping

| Spoke | Page pkg | Wireframe | JSON-LD type |
|---|---|---|---|
| cathedral | 04 | hero + contact + CTA | Church (cathedral) |
| diocese | 05 | hero + stats + CTA | ReligiousOrganization |
| deanery | 06 | hero + stats + CTA | ItemList |
| parish | 07 | hero + schedule + contact + CTA | Church (parish) |
| funeral | 11 | hero + contact + stats + CTA | FuneralHome |
| cemetery-care | 12 | hero + contact + services + stats + CTA | LocalBusiness |
| protestant | 08 | hero + schedule + contact + CTA | PlaceOfWorship (Lutheran) |
| orthodox | 09 | hero + schedule + stats + CTA | Church (Orthodox) |
| other-church | 10 | hero + schedule + contact + stats + CTA | PlaceOfWorship |

## Rollback

Each spoke is independently reversible via `git revert <sha>`.
Forward-only correction policy — never force-push.
