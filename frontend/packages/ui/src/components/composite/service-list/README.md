# ServiceList

Semantic list wrapper around `ServiceCard` (responsive two-column grid) with
an i18n empty state and an optional "view all" link. Implements the
`service-list` module in its **contained** variant per package 03.

## Consuming pages (traceability)

| Package | Page | Usage |
|---|---|---|
| 03 | Basilica landing | `service-list` (contained) — sacraments/visitor services |
| 04 | Cathedral landing | same composition |
| 07 | Parish church landing | same composition |
| 11 | Funeral services | service offers listing |
| 12 | Cemetery services | care/cleaning services listing |

Renderer module mapping: `service-list` (variant `contained`).

## Accessibility

- List semantics, price values carry sr-only labels (ServiceCard).
- "View all" link: `focus-ring`, ≥24px target.
- Empty state is an externalized string.
- Covered by `check-a11y` via the Showcase render.
