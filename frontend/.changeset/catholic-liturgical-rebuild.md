---
"@journeyoflife-org/ui": minor
"@journeyoflife-org/seed-data": minor
---

fix(tokens): rebuild catholic theme profile from core liturgical scales

The catholic theme profile previously used Lithuanian national flag colors
(green/yellow/red) — a category error that encoded national identity in a
denomination slot (MASTER-PROMPT §1/§11 violation). The profile now uses
core liturgical scales: Baltic navy primary, liturgical purple secondary,
liturgical gold accent.

BREAKING: `themeColorExtension('catholic')` now returns navy/purple/gold
instead of green/yellow/red. All templates rendering the catholic profile
will change color. The parity snapshot test has been re-pinned to the new
baseline (change-controlled, see spec).

New: `localeAccents` registry in colors.ts and `localeAccentExtension()`
in tailwind.ts provide a separate axis for national/cultural color overlays.
Tenants opt in via `TenantIdentity.localeAccent` in seed-data schema.
