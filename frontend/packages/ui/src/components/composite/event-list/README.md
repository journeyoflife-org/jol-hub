# EventList

Semantic `<ul>` wrapper around `EventCard` with an i18n empty state and an
optional "view all" link. The page-composition heading comes from
`SectionHeader` (outline correctness stays at the composition level).

## Consuming pages (traceability)

| Package | Page | Usage |
|---|---|---|
| 03 | Basilica landing | `event-list` module (reference structure) |
| 04 | Cathedral landing | same composition |
| 06 | Deaneries landing | upcoming-deanery-events block |
| 07 | Parish church landing | `event-list` module |

Renderer module mapping: `event-list`.

## Accessibility

- List semantics (`<ul>/<li>`), card titles as list-item headings.
- "View all" link: `focus-ring`, ≥24px target.
- Empty state is an externalized string (no inline literals).
- Covered by `check-a11y` via the Showcase render.
