# Catholic Color Reconciliation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the `catholic` theme profile from core liturgical scales (navy/purple/gold), add a locale-accent axis for national-color overlays, and re-pin the parity snapshot test.

**Architecture:** The denomination axis stays pure (catholic = liturgical identity). National character is a separate opt-in axis via `localeAccents` registry in `colors.ts`, consumed by `localeAccentExtension()` in `tailwind.ts`, and referenced by an optional `localeAccent` field on `TenantIdentitySchema`. The two axes never collide — denomination drives `bg-primary`/`bg-secondary`/`bg-accent`; locale drives `--locale-*` CSS custom properties.

**Tech Stack:** TypeScript, Zod, node:test, tsx, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-09-23-catholic-color-reconciliation-design.md`

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `packages/ui/src/tokens/colors.ts` | Modify (add after line 269) | `localeAccents` registry + `LocaleAccentRef` type |
| `packages/ui/src/tokens/themes/index.ts` | Modify (lines 15–17, 69–117) | Rebuild `catholic` from `themeScale()` projections |
| `packages/ui/src/tokens/tailwind.ts` | Modify (lines 15, 33–40, 57) | `localeAccentExtension()` + `locale` key in `jolThemeExtension` |
| `packages/seed-data/src/schema.ts` | Modify (line 349) | Optional `localeAccent` on `TenantIdentitySchema` |
| `packages/ui/src/__tests__/theme-parity.test.ts` | Modify (full rewrite) | Re-pin baseline, update test names, fix orthodox convergence |
| `.changeset/catholic-liturgical-rebuild.md` | Create | Changeset for breaking visual change |

**Barrel exports:** `packages/ui/src/tokens/index.ts` already does `export * from './colors'`, `export * from './tailwind'` — no changes needed. New exports (`localeAccents`, `LocaleAccentRef`, `localeAccentExtension`) are automatically available via `@journeyoflife-org/ui/tokens`.

---

### Task 1: Add `localeAccents` registry to `colors.ts`

**Files:**
- Modify: `packages/ui/src/tokens/colors.ts:269` (insert after `VerticalAccentName` type)

- [ ] **Step 1: Add the locale accents registry and type**

Insert the following block after line 269 (`export type VerticalAccentName = keyof typeof verticalAccents;`) in `packages/ui/src/tokens/colors.ts`:

```ts
/* ------------------------------------------------------------------ */
/* Locale accents                                                      */
/* ------------------------------------------------------------------ */

/**
 * Per-locale accent palette (header stripes, border accents, locale badges).
 * These are NATIONAL identity, not denominational — they sit on a separate
 * axis from theme profiles (DS-THEME-01) and vertical accents.
 *
 * A tenant's localeAccent is resolved via TenantIdentity.localeAccent (seed-data
 * schema). The template merges these ON TOP of the denomination profile for
 * tenants that opt in; tenants without the field render pure denomination.
 *
 * All values are flat hex — they are decorative accents, not full scales.
 * Each triplet must pass WCAG-AA against the neutral surface when used as
 * foreground-on-surface (DS-A11Y-01).
 */
export const localeAccents = {
  lt: {
    primary: '#00843D',   // Lithuanian green
    secondary: '#FFCC00', // Lithuanian yellow
    accent: '#C8102E',    // Lithuanian red
  },
} as const;

export type LocaleAccentRef = keyof typeof localeAccents;
```

- [ ] **Step 2: Run type-check to verify no errors**

Run: `cd packages/ui && pnpm type-check`
Expected: Exit 0, no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/tokens/colors.ts
git commit -m "feat(tokens): add localeAccents registry for national-color overlays

New localeAccents map in colors.ts provides a separate axis from
denomination theme profiles for national/cultural color accents.
Seeded with LT (Lithuanian) flag values.

Ref: docs/superpowers/specs/2026-09-23-catholic-color-reconciliation-design.md"
```

---

### Task 2: Rebuild `catholic` profile from core liturgical scales

**Files:**
- Modify: `packages/ui/src/tokens/themes/index.ts:15-17` (module doc comment)
- Modify: `packages/ui/src/tokens/themes/index.ts:69-117` (catholic profile)

- [ ] **Step 1: Update the module doc comment**

Replace lines 15–17 in `packages/ui/src/tokens/themes/index.ts`:

```ts
 * MIGRATION BASELINE: the `catholic` profile is the parish-template's legacy
 * hardcoded Tailwind scales, copied VALUE-FOR-VALUE (visual parity is the
 * acceptance criterion; the parity snapshot test pins this).
```

with:

```ts
 * LITURGICAL BASELINE: the `catholic` profile projects from the core design-
 * system scales (Baltic navy, liturgical purple, liturgical gold) via
 * themeScale(). The parity snapshot test pins these projected values.
 * National character (e.g. LT flag) is a separate axis — see localeAccents
 * in colors.ts and TenantIdentity.localeAccent in seed-data schema.
```

- [ ] **Step 2: Replace the catholic profile body**

Replace lines 69–117 (the entire `catholic` constant, from the JSDoc comment through the closing `};`) with:

```ts
/**
 * CATHOLIC profile — core liturgical scales projected via themeScale().
 * Baltic navy primary, liturgical purple secondary, liturgical gold accent.
 * The parity snapshot test pins these values (theme-parity.test.ts).
 */
const catholic: ThemeProfile = {
  id: 'catholic',
  palettes: {
    primary: themeScale(corePrimary),    // Baltic navy  #1e3a5f
    secondary: themeScale(coreSecondary), // Liturgical purple #4a1a6b
    accent: themeScale(accent),          // Liturgical gold   #d4af37
  },
};
```

- [ ] **Step 3: Run type-check to verify no errors**

Run: `cd packages/ui && pnpm type-check`
Expected: Exit 0, no errors.

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/tokens/themes/index.ts
git commit -m "fix(tokens): rebuild catholic profile from core liturgical scales

Replace 33 hardcoded LT-flag hex values with themeScale() projections
of core design-system scales (navy/purple/gold). The catholic profile
now follows the same pattern as orthodox — denomination identity, not
national identity (MASTER-PROMPT §1/§11, DS-THEME-01).

BREAKING: themeColorExtension('catholic') now returns navy/purple/gold.

Ref: docs/superpowers/specs/2026-09-23-catholic-color-reconciliation-design.md"
```

---

### Task 3: Re-pin parity test to liturgical baseline

**Files:**
- Modify: `packages/ui/src/__tests__/theme-parity.test.ts` (full rewrite)

- [ ] **Step 1: Verify parity tests now fail (expected after Task 2's catholic rebuild)**

Run: `cd packages/ui && tsx --test src/__tests__/theme-parity.test.ts`
Expected: Tests 1 and 2 FAIL (catholic no longer equals `LEGACY_PARISH_COLORS`). Test 3 PASS (shape check — values are still valid hex). Test 4 FAIL (`notDeepEqual` fails because catholic and orthodox now share the same primary scale).

- [ ] **Step 2: Rewrite the parity test file**

Replace the entire contents of `packages/ui/src/__tests__/theme-parity.test.ts` with:

```ts
/**
 * Theme parity tests — liturgical baseline for the catholic profile.
 *
 * The catholic profile projects from core design-system scales (Baltic navy,
 * liturgical purple, liturgical gold) via themeScale(). These tests freeze
 * the projected values as a snapshot and assert strict equality — the offline
 * proof that the token layer produces the expected liturgical palette.
 *
 * PREVIOUS BASELINE (superseded 2026-09-23): the parish-template's legacy
 * LT-flag Tailwind scales (#00843D / #FFCC00 / #C8102E). That baseline
 * encoded national identity in a denomination slot (category error,
 * MASTER-PROMPT §1/§11). The old values are preserved in the localeAccents
 * registry (colors.ts) for tenants that opt in via TenantIdentity.localeAccent.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { themeRegistry, resolveThemeProfile } from '../tokens/themes';
import { themeColorExtension } from '../tokens/tailwind';

/**
 * FROZEN SNAPSHOT — the catholic profile's liturgical scales as projected
 * by themeScale() from core design-system tokens (colors.ts).
 *
 * Editing this constant is FORBIDDEN without an explicit design decision;
 * it is the parity reference, not live config.
 */
const CATHOLIC_LITURGICAL_BASELINE = {
  primary: {
    DEFAULT: '#1e3a5f',
    50: '#f0f4f8',
    100: '#d9e2ec',
    200: '#bcccdc',
    300: '#9fb3c8',
    400: '#829ab1',
    500: '#627d98',
    600: '#486581',
    700: '#334e68',
    800: '#1e3a5f',
    900: '#0a1929',
  },
  secondary: {
    DEFAULT: '#4a1a6b',
    50: '#faf5fd',
    100: '#f3e8fa',
    200: '#e6ccf2',
    300: '#d3a6e6',
    400: '#b975d1',
    500: '#9d4fb5',
    600: '#7f3596',
    700: '#672a7a',
    800: '#4a1a6b',
    900: '#3d1757',
  },
  accent: {
    DEFAULT: '#d4af37',
    50: '#fdf9e8',
    100: '#faf0c5',
    200: '#f6e28f',
    300: '#efcf52',
    400: '#e5bb2c',
    500: '#d4af37',
    600: '#b28a1c',
    700: '#8e6a16',
    800: '#755517',
    900: '#644718',
  },
} as const;

test('token-value equality: catholic profile == liturgical baseline (navy/purple/gold)', () => {
  const { palettes } = resolveThemeProfile('catholic');
  assert.deepEqual(palettes.primary, CATHOLIC_LITURGICAL_BASELINE.primary);
  assert.deepEqual(palettes.secondary, CATHOLIC_LITURGICAL_BASELINE.secondary);
  assert.deepEqual(palettes.accent, CATHOLIC_LITURGICAL_BASELINE.accent);
});

test('snapshot: themeColorExtension output matches liturgical baseline', () => {
  assert.deepEqual(themeColorExtension('catholic'), {
    primary: { ...CATHOLIC_LITURGICAL_BASELINE.primary },
    secondary: { ...CATHOLIC_LITURGICAL_BASELINE.secondary },
    accent: { ...CATHOLIC_LITURGICAL_BASELINE.accent },
  });
});

test('config-only swap: every registered ref resolves with the same palette shape', () => {
  const catholicShape = Object.keys(resolveThemeProfile('catholic').palettes.primary).sort();
  for (const ref of ['catholic', 'protestant', 'orthodox', 'other'] as const) {
    const profile = themeRegistry[ref];
    assert.equal(profile.id, ref);
    for (const palette of Object.values(profile.palettes)) {
      assert.deepEqual(Object.keys(palette).sort(), catholicShape);
      for (const value of Object.values(palette)) {
        assert.match(value, /^#[0-9a-fA-F]{6}$/, `${ref}: malformed hex ${value}`);
      }
    }
  }
});

// NOTE: catholic and orthodox currently converge on the same primary palette
// (both project from corePrimary via themeScale). They differ in secondary/accent
// role assignments. When a future orthodox pilot provides distinct palette values,
// a distinctness assertion can be re-added here.
test('catholic and orthodox share primary scale but maintain independent profiles', () => {
  const orthodox = themeColorExtension('orthodox');
  const catholic = themeColorExtension('catholic');
  // Same primary (both from corePrimary)
  assert.deepEqual(orthodox.primary, catholic.primary);
  // Same shape
  assert.deepEqual(Object.keys(orthodox), Object.keys(catholic));
  // Independent profile objects (not the same reference)
  assert.notEqual(resolveThemeProfile('catholic'), resolveThemeProfile('orthodox'));
});
```

- [ ] **Step 3: Run the updated parity tests**

Run: `cd packages/ui && tsx --test src/__tests__/theme-parity.test.ts`
Expected: All 4 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/__tests__/theme-parity.test.ts
git commit -m "test(tokens): re-pin parity test to liturgical baseline

Replace LEGACY_PARISH_COLORS (LT-flag values) with
CATHOLIC_LITURGICAL_BASELINE (navy/purple/gold from core scales).
Fix orthodox convergence test — catholic and orthodox now share
primary scale (both project from corePrimary).

Change-controlled per spec: docs/superpowers/specs/2026-09-23-
catholic-color-reconciliation-design.md §5"
```

---

### Task 4: Add `localeAccentExtension()` to Tailwind bridge

**Files:**
- Modify: `packages/ui/src/tokens/tailwind.ts:15` (import)
- Modify: `packages/ui/src/tokens/tailwind.ts:40` (insert function after)
- Modify: `packages/ui/src/tokens/tailwind.ts:57` (add locale key)

- [ ] **Step 1: Add `localeAccents` and `LocaleAccentRef` to the import**

Replace line 15 in `packages/ui/src/tokens/tailwind.ts`:

```ts
import { colorScales, liturgicalClassic, verticalAccents } from './colors';
```

with:

```ts
import { colorScales, liturgicalClassic, localeAccents, verticalAccents } from './colors';
import type { LocaleAccentRef } from './colors';
```

- [ ] **Step 2: Add the `localeAccentExtension()` function**

Insert the following after line 40 (after the closing `}` of `themeColorExtension`):

```ts
/**
 * Locale-accent CSS custom property fragment.
 *
 * Returns CSS variable declarations for the tenant's locale accent palette.
 * The denomination profile provides primary/secondary/accent via
 * `themeColorExtension()`; locale accents are a SEPARATE overlay applied
 * by the template when the tenant opts in via TenantIdentity.localeAccent.
 *
 * Returns an empty object if no ref is provided or the ref is unknown —
 * the no-locale-accent case is the default and produces zero CSS output.
 */
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

- [ ] **Step 3: Add `locale` key to `jolThemeExtension.colors`**

Replace line 57:

```ts
    vertical: { ...verticalAccents },
```

with:

```ts
    vertical: { ...verticalAccents },
    locale: { ...localeAccents },
```

- [ ] **Step 4: Run type-check**

Run: `cd packages/ui && pnpm type-check`
Expected: Exit 0, no errors.

- [ ] **Step 5: Run all ui tests**

Run: `cd packages/ui && pnpm test`
Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/tokens/tailwind.ts
git commit -m "feat(tokens): add localeAccentExtension() to Tailwind bridge

New pure function returns CSS custom properties (--locale-primary,
--locale-secondary, --locale-accent) for a tenant's locale accent
palette. Also adds `locale` key to jolThemeExtension.colors for
Tailwind utility generation.

Graceful no-op for unknown refs (returns {}).

Ref: docs/superpowers/specs/2026-09-23-catholic-color-reconciliation-design.md"
```

---

### Task 5: Extend `TenantIdentitySchema` with `localeAccent` field

**Files:**
- Modify: `packages/seed-data/src/schema.ts:341-350`

- [ ] **Step 1: Add the `localeAccent` field**

Replace lines 341–350 in `packages/seed-data/src/schema.ts`:

```ts
export const TenantIdentitySchema = z.object({
  entityId: z.string().min(1),
  jurisdiction: z.string().optional(),
  established: z.string().optional(),
  address: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  domain: z.string().optional(),
  theme: z.string().optional(),
});
```

with:

```ts
export const TenantIdentitySchema = z.object({
  entityId: z.string().min(1),
  jurisdiction: z.string().optional(),
  established: z.string().optional(),
  address: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  domain: z.string().optional(),
  theme: z.string().optional(),
  /**
   * Optional locale-accent reference — applies national/cultural color
   * accents ON TOP of the denomination theme profile. Values reference
   * the `localeAccents` registry in @journeyoflife-org/ui tokens/colors.
   *
   * Tenants WITHOUT this field render pure denomination identity.
   * Tenants WITH this field get a locale-flavored overlay (header stripe,
   * border accent, optional badge) — controlled by the template.
   */
  localeAccent: z.string().optional(),
});
```

- [ ] **Step 2: Run type-check**

Run: `cd packages/seed-data && pnpm type-check`
Expected: Exit 0, no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/seed-data/src/schema.ts
git commit -m "feat(seed-data): add optional localeAccent to TenantIdentitySchema

Opt-in field for national/cultural color accents. References the
localeAccents registry in @journeyoflife-org/ui. Uses z.string()
(not z.enum) to avoid cross-package circular dependency.

Ref: docs/superpowers/specs/2026-09-23-catholic-color-reconciliation-design.md"
```

---

### Task 6: Add changeset for breaking visual change

**Files:**
- Create: `.changeset/catholic-liturgical-rebuild.md`

- [ ] **Step 1: Create the changeset file**

Create `.changeset/catholic-liturgical-rebuild.md` with:

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add .changeset/catholic-liturgical-rebuild.md
git commit -m "chore: add changeset for catholic liturgical rebuild

Documents the breaking visual change for CHANGELOG generation."
```

---

### Task 7: Full verification

- [ ] **Step 1: Run the ui package verify script (type-check + tests + contrast + a11y)**

Run: `cd packages/ui && pnpm verify`
Expected: Exit 0. All tests pass. Contrast check passes. A11y check passes.

- [ ] **Step 2: Run seed-data type-check**

Run: `cd packages/seed-data && pnpm type-check`
Expected: Exit 0, no errors.

- [ ] **Step 3: Verify no hex values leaked outside tokens/**

Run: `cd /opt/jol/repos/jol-hub/frontend && grep -rn '#00843D\|#FFCC00\|#C8102E' --include='*.ts' --include='*.tsx' packages/ apps/ | grep -v 'node_modules' | grep -v '__tests__' | grep -v 'tokens/'`
Expected: Only matches in `tokens/colors.ts` (the `localeAccents` registry) and test files. Zero matches in component code, templates, or apps.

- [ ] **Step 4: Verify DS-THEME-01 grep gate still passes**

Run: `cd /opt/jol/repos/jol-hub/frontend && bash scripts/check-theme-literals.sh 2>/dev/null || echo "Script not found or not executable — verify manually"`
Expected: Exit 0 if script exists. If not, manually verify: no denomination literals (`'catholic'`, `'protestant'`, `'orthodox'`) in component code outside `tokens/`.

- [ ] **Step 5: Run turbo verify across the workspace (if available)**

Run: `cd /opt/jol/repos/jol-hub/frontend && pnpm turbo run type-check test --filter=@journeyoflife-org/ui --filter=@journeyoflife-org/seed-data`
Expected: Exit 0. All type-checks and tests pass for both packages.

- [ ] **Step 6: Final commit (if any verification fixes were needed)**

If any fixes were required in steps 1–5, commit them now. Otherwise, skip.
