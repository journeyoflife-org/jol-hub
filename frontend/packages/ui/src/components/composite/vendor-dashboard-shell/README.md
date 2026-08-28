# VendorDashboardShell

DISPLAY-ONLY vendor surface shell — header card (vendor name + caller-provided
stats) plus a consumer-composed content region. Requires ZERO marketplace API
contact to render meaningfully (everything arrives via props); transaction and
payout surfaces remain inert until the payment-track freeze is lifted (D-052).

## Consuming pages (traceability)

| Package | Page | Usage |
|---|---|---|
| 15 | Vendor/marketplace dashboard (hub-render view) | page shell |

Renderer module mapping: admin/marketplace hub-render surfaces (the
transacting side lives in the marketplace tree, never here).

## Accessibility

- `<section aria-label={vendorName}>` landmark labelling.
- Stats rendered as `<dl>` (programmatic label/value association).
- Covered by `check-a11y` via the Showcase render.
