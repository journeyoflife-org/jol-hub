# @jol-hub/ui

JOL Design System + shared component library for the JOL-HUB multi-tenant
platform (all verticals: basilicas, cathedrals, dioceses, parishes,
monasteries, orthodox & eastern-rite churches, protestant congregations,
funeral homes, cemeteries).

Aesthetic contract: **dignified, accessible, culturally appropriate** for
Lithuanian (and eventually 27-country) religious institutions — never
flashy-corporate. WCAG 2.2 AA is the floor, not the goal.

## Token architecture

```
src/tokens/
├── colors.ts       # semantic + church scales (50–950), light/dark roles
├── typography.ts   # font stacks, sizes, weights, liturgical roles
├── spacing.ts      # 4px grid + semantic names
├── breakpoints.ts  # mobile-first (sm 640 → 2xl 1536)
├── radii.ts        # none → pill
├── shadows.ts      # elevation + WCAG-safe focus rings
├── tailwind.ts     # jolThemeExtension — Tailwind bridge
└── index.ts        # barrel
```

**Rules**

1. No hex value may appear anywhere in the workspace outside `src/tokens/`.
2. Every token is a TypeScript `export const` object; the generated CSS
   (`src/styles/tokens.css`) is derived from them — never edited by hand.
   Regenerate: `pnpm generate:tokens`.
3. Color scales follow the 50→950 convention with an optional `DEFAULT`.

**Color families**

| Family | Role |
| --- | --- |
| `primary` | Institutional deep navy (headings, buttons, chrome) |
| `secondary` | Liturgical purple |
| `accent` / `gold` | Liturgical gold — decorative; use 700 for small text |
| `neutral` | Surfaces & body text |
| `success` / `warning` / `error` / `info` | Status |
| `altar`, `candle`, `incense`, `stone`, `wood` | Church-specific semantics |
| `vertical.*` | Per-vertical accent (one entry per tenant vertical) |

CSS custom properties mirror every token: `--jol-color-<scale>-<stop>`,
`--jol-surface`, `--jol-text`, `--jol-link`, `--jol-focus`,
`--jol-space-*`, `--jol-radius-*`, `--jol-shadow-*`, `--jol-font-*`, with a
`.dark` override block and a `prefers-color-scheme` fallback for no-JS.

## Adding a vertical-specific accent

1. Pick (or add) a scale stop in `src/tokens/colors.ts`.
2. Add/replace the entry in `verticalAccents` (must reference a scale
   value — no new hex literals).
3. Re-run `pnpm generate:tokens` and `pnpm check-contrast`.
4. Use the generated utilities: `bg-vertical-<name>`, `text-vertical-<name>`,
   `border-vertical-<name>` (or `var(--jol-vertical-<name>)` in raw CSS).

## Contrast requirements (WCAG 2.2 AA)

- Normal text ≥ **4.5:1**, large text & UI components (focus rings) ≥ **3:1**.
- The contract lives in `scripts/check-contrast.ts` (WCAG 2.1 relative
  luminance). Any new text/focus combination MUST be added there.
- Run: `pnpm check-contrast` (exits non-zero on failure; wire into CI).
- Focus: global `:focus-visible` outline uses `--jol-focus`; custom controls
  that suppress outlines MUST apply the `.focus-ring` class instead.

## Theme switching API

```tsx
import { ThemeProvider, useTheme, THEME_INIT_SCRIPT } from '@jol-hub/ui/providers';
```

- `<ThemeProvider>` — React context; modes `light | dark | system`
  (default `system`); persists to `localStorage['jol-theme-preference']`;
  toggles the `dark` class on `<html>` (Tailwind `darkMode: 'class'`).
- `useTheme()` → `{ theme, resolvedTheme, setTheme, toggleTheme }`.
- **FOUT prevention:** inline `THEME_INIT_SCRIPT` in the document before
  first paint (see `apps/template-renderer/src/app/layout.tsx`).

## Styles

Apps import, in this order:

```ts
import '@jol-hub/ui/styles/tokens.css';  // generated custom properties
import '@jol-hub/ui/styles/globals.css'; // reset, base, focus, a11y utils
```

Globals include a targeted modern reset, `.sr-only` / `.not-sr-only`,
`.focus-ring`, `.text-verse` / `.text-prayer` liturgical roles, and CSS
logical properties throughout for RTL readiness. No `!important`.

## Fonts

System-first stacks (Inter / Source Serif 4 preferred, graceful fallbacks).
Webfonts are not fetched at build time — the CI environment is offline;
vendor files via `next/font/local` when they become available.

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm type-check` | `tsc --noEmit` |
| `pnpm generate:tokens` | regenerate `src/styles/tokens.css` |
| `pnpm check-contrast` | WCAG AA verification (fails on violations) |
| `pnpm verify` | type-check + check-contrast |
