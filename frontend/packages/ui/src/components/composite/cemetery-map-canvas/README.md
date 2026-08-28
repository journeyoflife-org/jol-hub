# CemeteryMapCanvas

STATIC plot-overview canvas — inline-SVG plot grid rendered entirely from
props: zero network requests, no tile service, no consent prompt
(ePrivacy-safe, MapBlock posture). PLOT DATA IS NEVER INDEXED — consumers
render this on noindex surfaces only (package 22 rule).

## Consuming pages (traceability)

| Package | Page | Usage |
|---|---|---|
| 22 | Cemetery plot overview (noindex) | primary map surface |

Renderer module mapping: `cemetery-map` module (noindex route only).

## Accessibility

- SVG `role="img"` + `aria-label={title}`.
- Legend strings externalized (`collections.plot*`), swatches aria-hidden.
- Covered by `check-a11y` via the Showcase render.
