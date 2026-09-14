# Block Schema Extension — JSON-LD Mapping

> **Decision:** Task 2.5 (2026-09-11). Seven new block types added to
> `@jol-hub/seed-data` ContentBlockSchema. This document records the
> JSON-LD mapping and routing decisions.

## New Block Types

| Block | JSON-LD Type | Typed Route? | Rationale |
|---|---|---|---|
| `massSchedule` | `Event` (with `startDate`) | **Yes** | Mass times are events, not opening hours. `startDate` required. |
| `gallery` | `ImageGallery` | No | Renders through `[...slug]` catch-all. |
| `faq` | `FAQPage` | **Yes** | FAQ schema.org type for rich snippets. |
| `sacramentList` | `Service` | **Yes** | Sacraments are liturgical services. |
| `clergyRoleList` | None (roles only) | No | **Art. 9 compliance**: names come from RLS-scoped API, never fixtures. |
| `visitingInfo` | `openingHoursSpecification` | No | Visitor hours, not mass times. |
| `mapLocation` | `Place` (with `geo`) | No | Self-hosted tiles or static image. |

## Key Decisions

### Mass Times ≠ Opening Hours

Mass times use `Event` with `startDate` (ISO 8601 datetime), **not**
`openingHoursSpecification`. The latter models visitor opening hours
and belongs to `visitingInfo`. This distinction is critical for
structured data correctness.

### Clergy Names Are Art. 9 Personal Data

The `clergyRoleList` block carries **roles only** (e.g. "Parish Priest",
"Deacon"). Clergy names are personal data under GDPR Art. 9 and must
come from the RLS-scoped content API at runtime, never from committed
fixtures. This is a hard invariant.

### Typed Routes vs Catch-All

Blocks that carry their own JSON-LD (`massSchedule`, `faq`, `sacramentList`)
**may** need first-class typed routes for proper rendering and URL
structure. However, the `[...slug]` catch-all can render them via the
generic block renderer. The decision to add typed routes is deferred
to the spoke implementation phase (Phase 3+).

### Gallery WCAG Compliance

Every image in a `gallery` block **must** have `alt` text (WCAG 1.1.1).
The schema enforces this with `alt: LocalizedTextSchema` (required).

### Map Self-Hosted or Static

The `mapLocation` block supports:
- Interactive map via self-hosted tiles (no third-party SDK)
- Static map image fallback (for JS-disabled browsers)
- Optional `directionsUrl` (e.g. Google Maps link)

No third-party map SDK is embedded (per page package 03 §7).

## Schema Version

The schema version remains `tenant-fixture/v1`. Adding new block types
is a **backward-compatible** change (MINOR bump per semver).

## Rollback

Reverting this change means removing the 7 new block schemas from
`schema.ts` and the `ContentBlockSchema` discriminated union. Any
fixtures using the new blocks would fail validation — but no fixtures
use them yet (they're added in Phase 3 spoke implementations).
