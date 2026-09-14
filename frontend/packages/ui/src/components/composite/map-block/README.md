# MapBlock

STATIC location map — inline-SVG canvas with a marker, address caption, and
an optional user-initiated external-maps link. Makes **zero network requests**
(no third-party tiles, no consent prompt) — the ePrivacy-safe default for
entity landings. The consent-gated interactive variant (external tiles) is
`MapEmbed`, a separate component mounted only behind consent.

## Consuming pages (traceability)

| Package | Page | Usage |
|---|---|---|
| 03 | Basilica landing | `map` module (lightweight location map) |
| 04 | Cathedral landing | same composition |
| 07 | Parish church landing | same composition |
| 12 | Cemetery services | location map (CemeteryMapCanvas remains the large interactive plan, separate backlog) |

Renderer module mapping: `map` module, `static` variant (default).

## Accessibility

- SVG carries `role="img"` + composed aria-label (title + address + coordinates).
- External link: `focus-ring`, ≥24px target, `rel="noopener noreferrer"`.
- Covered by `check-a11y` via the Showcase render.
