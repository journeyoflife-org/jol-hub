# Catholic Theme Profile — Color Reconciliation Design

**Date:** 2026-09-23
**Status:** Approved
**Scope:** Color reconciliation only — rebuild `catholic` profile, define locale-accent axis, re-pin parity test

## Problem

The `catholic` theme profile in `packages/ui/src/tokens/themes/index.ts` uses Lithuanian national flag colors (green `#00843D` / yellow `#FFCC00` / red `#C8102E`). This is a category error: national identity is encoded in a denomination slot, violating MASTER-PROMPT §1/§11 (the platform must scale to 27 EU countries without rework).

The core design-system scales in `packages/ui/src/tokens/colors.ts` already define the correct liturgical colors: Baltic navy (`primary`, DEFAULT `#1e3a5f`), liturgical purple (`secondary`, DEFAULT `#4a1a6b`), liturgical gold (`accent`, DEFAULT `#d4af37`). The `orthodox` profile already projects from these scales via `themeScale()`. The `catholic` profile does not — it hardcodes 33 LT-flag hex values.

## Decision

**Approach A — Tenant-level locale-accent overlay.** Rebuild the `catholic` profile from core liturgical scales. Preserve the LT-flag values in a separate `localeAccents` registry for tenants that opt in via a new `localeAccent` field on `TenantIdentitySchema`.

### Approaches considered

| Approach | Description | Verdict |
|---|---|---|
| A — Tenant-level `localeAccent` | New registry + optional schema field + pure-function bridge | **Selected** |
| B — Extend `verticalAccents` | Reuse existing vertical accent pattern for locale | Rejected: conflates building-type and national-identity axes |
| C — Composite profiles (`catholic-lt`) | New theme profiles per denomination×locale | Rejected: combinatorial explosion, violates DS-THEME-01 |

## Design

### Section 1 — Catholic profile rebuild

**File:** `packages/ui/src/tokens/themes/index.ts`

Replace the 33 hardcoded LT-flag hex values in the `catholic` profile with `themeScale()` projections of the core liturgical scales:

```ts
const catholic: ThemeProfile = {
  id: 'catholic',
  palettes: {
    primary: themeScale(corePrimary),   // Baltic navy  #1e3a5f
    secondary: themeScale(coreSecondary), // Liturgical purple #4a1a6b
    accent: themeScale(accent),        // Liturgical gold   #d4af37
  },
};
```

The `catholic` profile now follows the same pattern as `orthodox`. The module doc comment is updated to reflect the new baseline.

**Unchanged:** `ThemeProfile` interface, `ThemeRef` type, `themeRegistry`, `resolveThemeProfile()`, `themeColorExtension()` output shape.

### Section 2 — Locale accent registry

**File:** `packages/ui/src/tokens/colors.ts` (after `verticalAccents`, ~line 267)

New map and type, following the `verticalAccents` pattern but carrying a 3-color palette (national flags need three values):

```ts
export const localeAccents = {
  lt: {
    primary: '#00843D',   // Lithuanian green
    secondary: '#FFCC00', // Lithuanian yellow
    accent: '#C8102E',    // Lithuanian red
  },
} as const;

export type LocaleAccentRef = keyof typeof localeAccents;
```

**Design decisions:**
- Flat hex, not scales — locale accents are decorative (header stripes, borders, badges), not full UI palettes.
- Registry lives in `colors.ts`, not `themes/` — locale accents are not theme profiles (DS-THEME-01 enforcement boundary).
- Only `lt` is seeded — adding more locales is a data addition, not a code change.
- Values are documented as decorative accents (UI elements ≥ 3:1 ratio).

### Section 3 — Tenant schema extension

**File:** `packages/seed-data/src/schema.ts` (on `TenantIdentitySchema`)

Add one optional field:

```ts
localeAccent: z.string().optional(),
```

**Design decisions:**
- `z.string().optional()`, not `z.enum()` — avoids a cross-package import from seed-data → ui (circular dependency risk). Runtime validation belongs in the template resolver.
- On `TenantIdentitySchema`, not `TenantFixtureSchema` — locale accent is identity data (who the tenant is), not content data.
- Optional, not defaulted — the denomination profile is the baseline; locale accent is an opt-in overlay.

### Section 4 — Tailwind bridge extension

**File:** `packages/ui/src/tokens/tailwind.ts`

New export alongside `themeColorExtension()`:

```ts
export function localeAccentExtension(
  ref?: string
): Record<string, string> {
  if (!ref || !(ref in localeAccents)) return {};
  const palette = localeAccents[ref as LocaleAccentRef];
  return {
    '--locale-primary': palette.primary,
    '--locale-secondary': palette.secondary,
    '--locale-accent': palette.accent,
  };
}
```

Also add `locale: { ...localeAccents }` to `jolThemeExtension.colors` (alongside existing `vertical` key) for Tailwind utility generation.

**Design decisions:**
- CSS custom properties (`--locale-*`), not Tailwind class overrides — the denomination palette stays intact on `bg-primary` etc.; the template uses `--locale-*` explicitly for decorative elements. The two axes never collide.
- Pure function, no side effects — matches the existing `themeColorExtension()` pattern.
- Graceful no-op for unknown refs — returns `{}`, no error, no warning.

### Section 5 — Parity test re-pin

**File:** `packages/ui/src/__tests__/theme-parity.test.ts`

Replace `LEGACY_PARISH_COLORS` with `CATHOLIC_LITURGICAL_BASELINE` containing the navy/purple/gold values produced by `themeScale()` projections. Update test names to reflect the new baseline. Add a comment documenting the superseded LT-flag values and the reason for the change.

**Orthodox convergence test:** The existing `assert.notDeepEqual(orthodox.primary, catholic.primary)` assertion will fail because both profiles now project from the same core scales. Replace with a comment explaining the convergence; the shape check (test 3) provides the real validation. When a future orthodox pilot provides distinct values, the distinctness assertion can be re-added.

**Change control:** The re-pin is documented in this spec, in the CHANGELOG changeset, and in the git commit message. The old LT-flag values are preserved in the `localeAccents` registry.

### Section 6 — Scope boundary

**Out of scope:**
1. No tenant fixture data changes (no fixture gets `localeAccent: 'lt'` added).
2. No template rendering changes (apps continue calling `themeColorExtension('catholic')`).
3. No new Tailwind classes in components.
4. No contrast-check extension in `scripts/check-contrast.ts`.
5. No spoke repository changes.

**Error handling:**
- `localeAccentExtension()` with unknown ref → returns `{}` (silent no-op).
- Invalid `ThemeRef` → compile-time enforcement via TypeScript union.
- Invalid `localeAccent` string in tenant data → caught by resolver guard (`if !(ref in localeAccents)`).

## Files changed

| File | Change type | Description |
|---|---|---|
| `packages/ui/src/tokens/themes/index.ts` | Modify | Rebuild `catholic` from `themeScale()` projections |
| `packages/ui/src/tokens/colors.ts` | Add | `localeAccents` registry + `LocaleAccentRef` type |
| `packages/ui/src/tokens/tailwind.ts` | Add | `localeAccentExtension()` + `locale` key in `jolThemeExtension` |
| `packages/seed-data/src/schema.ts` | Modify | Optional `localeAccent` on `TenantIdentitySchema` |
| `packages/ui/src/__tests__/theme-parity.test.ts` | Modify | Re-pin baseline, update test names, fix orthodox convergence |
| `.changeset/` | Add | Changeset for breaking visual change |

**Total: 5 files modified, 1 changeset added. No new files created.**

## Compliance

- **DS-THEME-01:** Denomination profiles encode liturgical identity, not national. The `catholic` profile now complies.
- **MASTER-PROMPT §1/§11:** The platform scales to 27 EU countries — denomination identity is universal, locale identity is a data overlay.
- **ADR-011 INV-5:** No denomination literals introduced in component code. The `localeAccents` registry lives in `tokens/` (the permitted location).
- **WCAG 2.1 AA:** Locale accent values are decorative (UI elements ≥ 3:1). No text-contrast claims are made for locale accent pairs.
- **SOC 2 CC3.1 / ISO 27001 A.8.32:** The parity test re-pin is change-controlled (documented in spec, CHANGELOG, and commit message).
