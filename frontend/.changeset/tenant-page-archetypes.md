---
'@journeyoflife-org/seed-data': minor
---

feat: page archetype factories + 220 generated pages

Add `generateTenantPages()` — 5 factory functions (home, about, contact,
services, schedule) that produce standard pages from tenant identity data.
All 44 tenant fixtures now carry 5 pages each (220 total).

Exported from `@journeyoflife-org/seed-data`:
- `generateTenantPages(fixture: TenantFixture): TenantPage[]`
