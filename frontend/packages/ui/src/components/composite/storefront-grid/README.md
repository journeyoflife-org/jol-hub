# StorefrontGrid

DISPLAY-ONLY catalog grid — responsive `<ul>` of ProductCards with an i18n
empty state. Hub-render side of the CLOSED payment boundary: catalog data
arrives via props (tenant content pipeline); transactions stay on the
marketplace side until the payment-track freeze is lifted (D-052).

## Consuming pages (traceability)

| Package | Page | Usage |
|---|---|---|
| 13 | Online store | primary catalog surface |
| 12 | Cemetery services | products/graves grid where sold (display only) |

Renderer module mapping: `storefront` module (lands with the catalog data
source; display-only until unfreeze).

## Accessibility

- `<ul>/<li>` list semantics; card content inherits ProductCard a11y.
- Empty state externalized (`commerce.emptyProducts`).
- Covered by `check-a11y` via the Showcase render.
