# EntityFactCard

Definition-list fact card for entity landings: dedication, architectural
style, founded year, diocese/deanery links — label/value rows with optional
linked values (absolute URLs per SEO hard rule 1).

## Consuming pages (traceability)

| Package | Page | Usage |
|---|---|---|
| 03 | Basilica landing | fact card in two-column-60-40 content module (dedication, style, founded, diocese link) |
| 04 | Cathedral landing | same composition (see 03 reference structure) |
| 07 | Parish church landing | same composition |
| 09 | Orthodox churches landing | same composition (+ native-name fact row) |

Renderer module mapping: `content` module variant `two-column-60-40` side slot.

## Accessibility

- `<dl>/<dt>/<dd>` semantics (programmatic label/value association).
- Linked values: `focus-ring` + ≥24px inline-flex target (DS-A11Y-04/07).
- Covered by `check-a11y` via the Showcase render.
