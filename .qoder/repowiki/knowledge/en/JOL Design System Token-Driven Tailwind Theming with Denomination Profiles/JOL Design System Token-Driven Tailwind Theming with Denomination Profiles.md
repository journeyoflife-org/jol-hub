---
kind: frontend_style
name: 'JOL Design System: Token-Driven Tailwind Theming with Denomination Profiles'
category: frontend_style
scope:
    - '**'
source_files:
    - frontend/packages/ui/src/tokens/colors.ts
    - frontend/packages/ui/src/tokens/themes/index.ts
    - frontend/packages/ui/src/tokens/tailwind.ts
    - frontend/packages/ui/src/styles/globals.css
    - frontend/packages/ui/src/providers/ThemeProvider.tsx
    - frontend/packages/ui/tailwind.config.ts
    - frontend/apps/master-site/tailwind.config.ts
    - frontend/apps/admin-dashboard/tailwind.config.ts
    - frontend/apps/parish-template/tailwind.config.ts
    - frontend/apps/template-renderer/tailwind.config.ts
    - frontend/packages/ui/ACCESSIBILITY.md
---

## What system/approach is used

The frontend uses a **token-driven design system built on Tailwind CSS**, centralized in the `frontend/packages/ui` package (`@jol-hub/ui`). All visual values (colors, spacing, typography, radii, shadows, breakpoints) are declared as TypeScript tokens and projected into Tailwind via a shared `jolThemeExtension`. Apps consume this extension rather than defining their own palettes. The system supports **denomination-based theme profiles** (`catholic`, `orthodox`, `protestant`, `other`) selected by a `theme_ref` data value — swapping a tenant's look is a configuration change with zero component code edits.

Key technologies:
- **Tailwind CSS** with `darkMode: 'class'` (never media queries), driven by CSS custom properties (`--border`, `--primary`, etc.) for shadcn-style surface tokens.
- **React + Next.js** apps under `frontend/apps/*` (master-site, admin-dashboard, parish-template, template-renderer).
- **Turborepo monorepo** (`pnpm-workspace.yaml`, `turbo.json`) that builds all apps and the shared UI package.
- **PostCSS** per app (`postcss.config.mjs`); `tailwindcss-animate` plugin provides accordion/keyframe animations.
- **CSS-in-JS free**: styles live in `.css` files; global base styles and token variables are emitted from the UI package.

## Key files and packages

- `frontend/packages/ui/src/tokens/colors.ts` — single source of truth for all color scales (`primary`, `secondary`, `accent`, `neutral`, `success`, `warning`, `error`, `info`, `altar`, `candle`, `incense`, `stone`, `wood`, `gold`, plus vertical accents per entity type).
- `frontend/packages/ui/src/tokens/themes/index.ts` — denomination profile registry (`themeRegistry`) mapping `ThemeRef` to palette overrides; `resolveThemeProfile(ref)` projects core scales onto the legacy parish shape.
- `frontend/packages/ui/src/tokens/tailwind.ts` — `jolThemeExtension` object that spreads colors, fonts, spacing, radii, shadows, screens, and `vertical-*` color utilities into Tailwind; `themeColorExtension(ref)` returns per-profile `primary/secondary/accent` maps.
- `frontend/packages/ui/src/styles/globals.css` — accessible reset, focus-visible rules (WCAG 2.2 AA), selection colors, liturgical typography roles (`.text-verse`, `.text-prayer`), and `prefers-reduced-motion` handling.
- `frontend/packages/ui/src/providers/ThemeProvider.tsx` — client-side light/dark/system mode toggle persisted to `localStorage` (`jol-theme-preference`), applies `dark`/`light` class to `<html>`; ships an inline `THEME_INIT_SCRIPT` to prevent FOUT.
- `frontend/packages/ui/tailwind.config.ts` — merges `jolThemeExtension` with shadcn-style `hsl(var(--*))` aliases for surfaces; enforces `darkMode: 'class'`.
- Per-app configs: `apps/master-site/tailwind.config.ts` (hardcoded brand hexes for the master site), `apps/admin-dashboard/tailwind.config.ts` (uses CSS vars + adds a `sacred` palette for Catholic entities), `apps/parish-template/tailwind.config.ts` (selects `catholic` profile via `themeColorExtension('catholic')`), `apps/template-renderer/tailwind.config.ts` (pure `jolThemeExtension`, no hex literals).
- `frontend/packages/ui/ACCESSIBILITY.md` — WCAG 2.2 AA hard rules enforced by `pnpm check-a11y` (axe-core) and `pnpm check-contrast`.
- `frontend/packages/ui/scripts/check-contrast.ts` — validates documented foreground/background pairs against WCAG 2.1 relative luminance thresholds.

## Architecture and conventions

### Token layering
1. **Core scales** (`colors.ts`) define semantic palettes at 50–950 steps.
2. **Theme profiles** (`themes/index.ts`) map a `ThemeRef` to `primary/secondary/accent` overrides using the legacy parish shape (50–900 + DEFAULT). The `catholic` profile is a frozen value-for-value copy of the original parish-template Tailwind config, pinned by a snapshot test.
3. **Tailwind bridge** (`tokens/tailwind.ts`) exposes `jolThemeExtension` (full design system) and `themeColorExtension(ref)` (profile-specific palette spread).
4. **App configs** extend Tailwind with either the full extension or a profile subset; they never import raw hex values outside the token layer.
5. **Runtime themes** — `ThemeProvider` toggles `dark`/`light` classes; CSS custom properties (`--jol-surface`, `--jol-text`, `--jol-focus`, etc.) are generated from tokens and consumed by components.

### Denomination theming
- Theme selection follows the ADR-001 chain extended with `→ theme`: subdomain → tenant → schema → locale → template → content → `theme_ref`.
- Components must not branch on denomination; only `tokens/themes/` may contain profile IDs. This is enforced by a grep gate referenced in the module comments.
- The `parish-template` demonstrates the pattern: set `THEME_REF = 'catholic'` in its Tailwind config and swap it to another profile without touching any component.

### Dark mode
- Always `darkMode: ['class']`; never `media`. Tenants or user preference control mode via `document.documentElement.classList.toggle('dark', ...)`. The `ThemeProvider` persists the choice to `localStorage` and includes an inline pre-hydration script so the correct theme renders before first paint.

### Accessibility baseline
- Global reset avoids blanket resets; uses CSS logical properties for RTL readiness (27-locale roadmap).
- Focus indicators are always visible via `:focus-visible` with a 2px outline; custom controls use the `.focus-ring` class instead of `outline: none`.
- No `!important` anywhere.
- Contrast pairs are validated programmatically; AA thresholds are enforced by CI scripts.

### Responsive strategy
- Breakpoints are defined in `tokens/breakpoints.ts` and exposed through `jolThemeExtension.screens`; apps inherit these rather than redefining them.
- Spacing and radii come from `tokens/spacing.ts` and `tokens/radii.ts`, ensuring consistent rhythm across apps.

## Conventions and constraints

- **No hex literals outside `tokens/`**. Enforced by the comment in `colors.ts` stating "No hex value may appear anywhere in the workspace outside `tokens/`" and by the `template-renderer` config comment that explicitly forbids hex in app configs.
- **Theme profiles are DATA, not code**. Swapping a tenant's theme is a `theme_ref` data change; components and templates must not contain denomination literals. Enforcement is via a grep gate referenced in `themes/index.ts`.
- **Dark mode via class, not media query**. Every Tailwind config sets `darkMode: ['class']`; the `ThemeProvider` manages the class on `<html>`.
- **Surface tokens via CSS custom properties**. Shadcn-style mappings (`border: hsl(var(--border))`, `background: hsl(var(--background))`, etc.) are retained for backwards compatibility; new surfaces should use token scales (`neutral-*`, `primary-*`) and generated `--jol-*` CSS variables.
- **Accessibility is mandatory**. New components must pass `pnpm check-a11y` (axe-core, WCAG 2.0–2.2 A+AA) and `pnpm check-contrast`. Hard rules include native elements first, visible focus, touch targets ≥ 24×24px (aim 40–44px), no positive tabindex, and color never being the only signal.
- **Motion respects reduced motion**. `globals.css` disables animations when `prefers-reduced-motion: reduce` is set; components should use `motion-reduce:transition-none`.
- **Per-vertical accents**. Entity types (parish, basilica, cathedral, chapel, monastery, diocese, deanery, cemetery, funeral-home, orthodox-church, greek-catholic, protestant-church) each have a dedicated accent color derived from the token scales, exposed as `vertical-parish`, `vertical-basilica`, etc.
- **Liturgical typography roles**. Semantic classes `.text-verse` and `.text-prayer` provide church-appropriate serif styling with line-height and letter-spacing tuned for scripture/prayer text.