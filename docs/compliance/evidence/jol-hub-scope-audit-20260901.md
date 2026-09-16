# Scope Audit Results — jol-hub (2026-09-01)

**Audit command**: `grep -rlE "funeral|cemetery|memorial|mortuary|burial" --exclude-dir=.git .`

## Summary

| Directory | File Count | Impact |
|---|---|---|
| `frontend/` | 239 | HIGH — UI components, i18n, seed data, commerce types |
| `backend/` | 38 | MEDIUM — API endpoints, models, services |
| `docs/` | 16 | LOW — Documentation only |
| `data/` | 11 | MEDIUM — Data models, schemas |
| `countries/` | 8 | MEDIUM — Country-specific configs (LT, LV, EE) |
| `tools/` | 5 | LOW — Tooling scripts |
| `scripts/` | 1 | LOW |
| `README.md` | 1 | LOW |
| `.github/` | 1 | LOW |
| **TOTAL** | **319** | |

## Key Findings

### 1. Example Entities (Explicit Out-of-Scope)
- `countries/lt/examples/services/funeral-homes/vilnius-funeral-services/entity.yml`
- `countries/lt/examples/services/funeral-homes/kaunas-memorial-care/entity.yml`
- `countries/lt/examples/services/cemetery-services/klaipeda-monument-services/entity.yml`
- `countries/lt/examples/services/cemetery-services/vilnius-grave-care/entity.yml`

### 2. Seed Data (Tenant Fixtures)
- `frontend/packages/seed-data/src/fixtures/tenants/funeral-vilnius.json`
- `frontend/packages/seed-data/src/fixtures/tenants/wave1-church-services.json` (mixed scope)
- `frontend/packages/seed-data/src/fixtures/tenants/reference-sites.json`

### 3. i18n Translations
- `frontend/packages/i18n/src/locales/{en,lt,ru}/common.json` — funeral/cemetery terms
- `frontend/packages/i18n/dist/` — compiled translations

### 4. Backend Models/Services
- 38 files in `backend/` — likely CRM integrations, service types, event handlers

### 5. Commerce Types
- `frontend/packages/commerce/src/types.ts` — service type definitions
- `frontend/packages/commerce/src/gating.ts` — feature gating logic

## Recommendation

**Option A (CONSERVATIVE — Recommended)**:
- Deprecate funeral/cemetery/memorial features with warnings
- Keep code functional but mark as "legacy — not for Catholic mission use"
- Update documentation to emphasize Catholic mission scope
- Remove example entities (safe — examples only)
- Defer full removal until downstream repos migrate

**Option B (AGGRESSIVE)**:
- Remove all 319 files' funeral/cemetery/memorial references
- HIGH RISK: May break downstream satellite repos
- Requires extensive testing + downstream coordination

## Decision Required

User must approve Option A or Option B before proceeding to Phase 1.

---

## Disposition — 2026-09-11 (D-062)

**Status: SUPERSEDED-BY-RATIFIED-SCOPE**

Neither Option A nor Option B applies. This audit's premise — that funeral,
cemetery, and memorial references might be out of scope for the Catholic
mission — was already resolved by the MASTER-PROMPT §5 ratification of
funeral and cemetery-cleaning as canonical verticals 9 and 10, with 10+
live pilot tenants across these verticals. The audit was created
(2026-09-01) after the ratification (2026-08-26) without cross-referencing
the decision log.

No files deprecated, removed, or modified on the basis of this audit.
