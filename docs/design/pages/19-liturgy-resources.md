# Page Package 19 — Liturgy & Resources

Batch 3/3 (Phase 2.2) · Governing: design-system-spec v1 (c9165a3e) · SEO strategy (6da34b18) row 19 · Renderer modules: `hero`, `event-list`, `content` (resource library), `subscription-cta`.

## 1. Wireframe (mobile-first)

1. Header/nav + breadcrumb · 2. `hero` (contained): "Liturgy & resources" + season indicator (current liturgical season — DS §4 season token drives the accent)
3. `event-list` (contained, primary): upcoming masses/liturgy grouped by week, filter by type
4. `content` (contained): resource library sections (readings, prayers, documents) as linked cards
5. `subscription-cta` (contained): calendar subscribe (ICS) — consent-gated
6. Footer

## 2. Content model — recurring-event model (task-specific)

| Field | Req | Behavior |
|---|---|---|
| event.title / type | ✓ | controlled vocabulary (mass, vespers, sacrament…) translated |
| event.startDate + location | ✓ | per-occurrence; organizer = tenant org |
| event.recurrence (RRULE-style) | ○ | **source of truth is the recurrence rule, not stored occurrences** — renderer materializes the next N occurrences at render time; exceptions (cancellations/moved feasts) stored as overrides |
| liturgical_season ref | auto | computed per DS §4 (Easter-algorithm utility, golden-value tested); seasons affect **tokens only**, never event data |
| resource docs (title+url+type) | ✓ | locale-scoped links |

## 3. SEO metadata (row 19 — Implemented)

- Title: `{Liturgy & Resources} — {tenant}` / event details: `{Event title} — {date} — {tenant}`
- JSON-LD: `Event` — **startDate, location, organizer** (+ `BreadcrumbList`) — **Implemented** builder; recurring events emit materialized occurrences (rule itself is never JSON-LD); past events drop from index (noindex after end date)
- hreflang/canonical: as package 01 §3

## 4. Component mapping

PageShell ✓ · BreadcrumbBar ✓/partial · EventCalendar/EventCard ✓ · RecurrenceMaterializer ✗ **build (new — data-layer utility, not a visual component)** · ResourceCardGrid ✗ minor build · SubscriptionCTA ✓ (module exists)

## 5. Audience journeys

- **Parishioner**: this week's masses → single event detail → calendar subscribe
- **Parish admin**: manage recurrence + exceptions without touching each occurrence (ergonomics per DS §3)

## 6. a11y acceptance

DS-A11Y-01, 03 (filter controls keyboard), 05 (event dialogs), 07, 09, 10 (subscribe form), 12

## 7. Analytics

`page_view` (essential) · `event_open` · `calendar_subscribe_start` · `filter_use` (consent-gated, aggregate)
