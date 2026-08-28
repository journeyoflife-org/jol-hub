# ProductCard

DISPLAY-ONLY catalog card — the hub-render side of the CLOSED payment
boundary (hub renders, marketplace transacts; ADR-009 Model A). The
transaction CTA is an **inert placeholder** (disabled button, "available at
launch" pattern): zero transaction wiring, zero PSP surface, zero API
contact while the payment-track freeze stands (DECISION-LOG D-052).

## Consuming pages (traceability)

| Package | Page | Usage |
|---|---|---|
| 13 | Online store | catalog grid cells (via StorefrontGrid) |
| 14 | Product detail | related-products strip |
| 12 | Cemetery services | graves/products where sold (display only) |

Renderer module mapping: `storefront` module (when the marketplace catalog
data source lands; display-only until unfreeze).

## Accessibility

- Price carries an sr-only label (`commerce.priceLabel`).
- Inert CTA: `disabled` + `aria-disabled` + tooltip via externalized string.
- Image alt policy: empty alt only when caller omits `imageAlt` (decorative
  flag is a caller/CMS decision — DS-A11Y-02).
- Covered by `check-a11y` via the Showcase render.
