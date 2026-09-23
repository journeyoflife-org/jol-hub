---
version: alpha
name: Journey of Life Design System
description: >
  Multi-tenant Catholic platform design system. System-first typography (Inter +
  Source Serif 4), 4px spacing grid, denomination-based theme profiles (catholic,
  orthodox, protestant, other) projected from core liturgical scales (Baltic navy,
  liturgical purple, liturgical gold). WCAG 2.1 AA compliant. Supports 27 EU
  locales via locale-accent overlays. Dark mode via class toggle.
colors:
  primary: "#1e3a5f"
  on-primary: "#fafafa"
  secondary: "#4a1a6b"
  on-secondary: "#fafafa"
  accent: "#d4af37"
  on-accent: "#171717"
  canvas: "#fafafa"
  ink: "#171717"
  muted: "#525252"
  surface-card: "#fafafa"
  hairline: "#e5e5e5"
  danger: "#b91c1c"
  success: "#15803d"
  warning: "#b45309"
  info: "#0369a1"
  link: "#0369a1"
  focus: "#0284c7"
typography:
  display-lg:
    fontFamily: "'Source Serif 4', Georgia, serif"
    fontSize: 2.25rem
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.025em
  heading-lg:
    fontFamily: "'Source Serif 4', Georgia, serif"
    fontSize: 1.875rem
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.025em
  heading-md:
    fontFamily: "'Source Serif 4', Georgia, serif"
    fontSize: 1.5rem
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.025em
  heading-sm:
    fontFamily: "'Source Serif 4', Georgia, serif"
    fontSize: 1.25rem
    fontWeight: 600
    lineHeight: 1.375
    letterSpacing: -0.025em
  body-lg:
    fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif"
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: 0px
  body-md:
    fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif"
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: 0px
  body-sm:
    fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif"
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0px
  caption:
    fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif"
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0.025em
  verse:
    fontFamily: "'Source Serif 4', Georgia, serif"
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 2
    letterSpacing: 0px
  prayer:
    fontFamily: "'Source Serif 4', Georgia, serif"
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 2
    letterSpacing: 0.025em
  button-md:
    fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif"
    fontSize: 0.875rem
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: 0px
  code-md:
    fontFamily: "ui-monospace, 'Cascadia Mono', monospace"
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0px
rounded:
  none: 0px
  sm: 2px
  md: 6px
  lg: 8px
  xl: 12px
  full: 9999px
spacing:
  xxs: 2px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
  section: 64px
  ceremonial: 64px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: 40px
  button-primary-hover:
    backgroundColor: "primary-700"
  button-primary-disabled:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: 40px
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: 40px
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: 40px
  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
    height: 40px
  text-input-focused:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
  text-input-error:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
  card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: "16px"
  card-elevated:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
  badge-default:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  badge-secondary:
    backgroundColor: "neutral-100"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  badge-destructive:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-primary}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  badge-vertical:
    backgroundColor: "vertical-accent"
    textColor: "{colors.on-primary}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  badge-liturgical-season:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  select:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
    height: 40px
  textarea:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  separator:
    backgroundColor: "{colors.hairline}"
  avatar:
    backgroundColor: "neutral-200"
    textColor: "{colors.muted}"
    rounded: "{rounded.full}"
  spinner:
    backgroundColor: "transparent"
    textColor: "currentColor"
  skeleton:
    backgroundColor: "neutral-200"
---

# Journey of Life Design System

## Overview

The JOL design system is a **multi-tenant, denomination-aware** component foundation for a Catholic platform scaling to 27 EU countries. It provides:

- **Core liturgical scales** — Baltic navy, liturgical purple, liturgical gold — projected onto denomination-specific theme profiles
- **Locale accent overlays** — national/cultural colors (e.g. Lithuanian flag) applied separately via tenant identity
- **Vertical accents** — structural color coding for parish, basilica, cathedral, etc.
- **System-first typography** — Inter (sans) + Source Serif 4 (serif) with graceful fallback
- **WCAG 2.1 AA** compliance across all color pairings
- **Dark mode** via class toggle with automatic OS preference detection

### Architecture

```
tokens/
├── colors.ts          Core scales + semantic roles + vertical accents + locale accents
├── themes/            Denomination profiles (catholic, orthodox, protestant, other)
├── typography.ts      Font stacks, sizes, weights, semantic roles
├── spacing.ts         4px grid + semantic names
├── breakpoints.ts     Mobile-first breakpoints
├── radii.ts           Border radius scale
├── shadows.ts         Elevation + WCAG focus rings
└── tailwind.ts        Bridge: tokens → Tailwind theme.extend
```

Components consume tokens via Tailwind utility classes. Apps apply theme profiles via `themeColorExtension(ref)`. No denomination literals exist in component code (DS-THEME-01).

## Colors

### Core Scales

Three liturgical scales anchor the system. Each is a full 50–950 ramp projected from a single source color:

| Scale | Source | Hex | Role |
|-------|--------|-----|------|
| `primary` | Baltic navy | `#1e3a5f` | UI chrome, primary actions, headings |
| `secondary` | Liturgical purple | `#4a1a6b` | Complementary UI, secondary actions |
| `accent` | Liturgical gold | `#d4af37` | Highlights, liturgical season markers |

### Semantic Roles

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `surface` | `#fafafa` | `#0a0a0a` | Page background |
| `surface-muted` | `#f5f5f5` | `#171717` | Card/section background |
| `text` | `#171717` | `#fafafa` | Primary text |
| `text-muted` | `#525252` | `#d4d4d4` | Secondary text, captions |
| `border` | `#e5e5e5` | `#262626` | Dividers, hairlines |
| `link` | `#0369a1` | `#7dd3fc` | Hyperlinks |
| `focus` | `#0284c7` | `#38bdf8` | Focus ring indicator |

### Liturgical Material Scales

Six named scales evoke sacred materiality. Use sparingly for decorative or thematic elements:

| Scale | Evokes | Source |
|-------|--------|--------|
| `altar` | Stone, marble | `#c2a165` |
| `candle` | Warm amber | `#ec9d1e` |
| `incense` | Smoky violet | `#8c7798` |
| `stone` | Limestone, concrete | `#78716c` |
| `wood` | Timber, walnut | `#b37350` |
| `gold` | Liturgical gold (scale-capable) | `#d4af37` |

### Theme Profiles

Denomination profiles are the **primary color API**. Each profile projects the three core scales via `themeScale()`, producing Tailwind-compatible `primary-*`, `secondary-*`, `accent-*` ramps.

| Profile | Primary | Secondary | Accent |
|---------|---------|-----------|--------|
| `catholic` | Baltic navy `#1e3a5f` | Liturgical purple `#4a1a6b` | Liturgical gold `#d4af37` |
| `orthodox` | Byzantine gold `#8B6914` | Icon red `#8B1A1A` | Deep teal `#1A5C5C` |
| `protestant` | Forest green `#1A5C3A` | Earth brown `#6B4226` | Harvest gold `#C8961E` |
| `other` | Slate gray `#4A5568` | Steel blue `#2C5282` | Warm amber `#D69E2E` |

Switching is config-only — no component code changes:

```ts
theme: { extend: { colors: { ...themeColorExtension('catholic') } } }
```

### Vertical Accents

Structural color coding for entity types. Flat hex values (not scales):

| Vertical | Hex | Evokes |
|----------|-----|--------|
| `parish` | `#1e3a5f` | Baltic navy |
| `basilica` | `#d4af37` | Liturgical gold |
| `cathedral` | `#334e68` | Deep navy |
| `chapel` | `#d17d14` | Candle amber |
| `monastery` | `#894a38` | Wood/earth |
| `diocese` | `#334e68` | Administrative navy |
| `deanery` | `#486581` | Mid navy |
| `cemetery` | `#57534e` | Stone warm gray |
| `funeral-home` | `#44403c` | Dark warm gray |
| `orthodox-church` | `#4a1a6b` | Liturgical purple |
| `greek-catholic` | `#7f3596` | Lighter purple |
| `protestant-church` | `#15803d` | Green |

### Locale Accents

National/cultural color overlays. Applied via `localeAccentExtension()` as CSS custom properties (`--locale-primary`, `--locale-secondary`, `--locale-accent`). Separate from denomination profiles.

| Locale | Primary | Secondary | Accent |
|--------|---------|-----------|--------|
| `lt` (Lithuania) | `#00843D` | `#FFCC00` | `#C8102E` |

### Contrast Compliance

All 26 documented pairings meet WCAG 2.1 AA (≥ 4.5:1 for body text, ≥ 3:1 for large text/UI). Verified by `pnpm verify:contrast`.

**Do:**
- Use semantic roles (`text`, `surface`, `border`) for UI chrome
- Use theme profile colors (`primary`, `secondary`, `accent`) for branded elements
- Test new pairings with `pnpm verify:contrast`

**Don't:**
- Hard-code hex values in components — use token names or Tailwind utilities
- Use liturgical material scales for text on white without checking contrast
- Place `accent` (gold) behind white text — fails contrast

## Typography

### Font Strategy

System-first stacks with preferred faces. Webfonts are NOT fetched at build time (CI is offline):

| Stack | Preferred Face | Fallback | Usage |
|-------|---------------|----------|-------|
| `sans` | Inter | system-ui, -apple-system, Segoe UI, Roboto | Body, UI, captions |
| `serif` | Source Serif 4 | Georgia, Times New Roman | Headings, scripture, prayers |
| `mono` | Cascadia Mono | Menlo, Consolas | Technical/tabular values |

### Semantic Roles

| Role | Family | Size | Weight | Line Height | Usage |
|------|--------|------|--------|-------------|-------|
| `body` | sans | base (1rem) | 400 | 1.625 | Default copy |
| `heading` | serif | varies | 600 | 1.25 | Section/page headings |
| `caption` | sans | sm (0.875rem) | 400 | 1.5 | Metadata, hints |
| `verse` | serif | lg (1.125rem) | 400 | 2.0 | Scripture (italic) |
| `prayer` | serif | lg (1.125rem) | 400 | 2.0 | Prayer text |

**Do:**
- Use `font-heading` class for headings (serif stack)
- Use `font-body` or default sans for UI text
- Use `verse` role for scripture quotations

**Don't:**
- Mix serif and sans within the same text block
- Use font weights below 400 for body text (contrast)
- Set line-height below 1.25 for body copy

## Layout & Spacing

### 4px Grid

All spacing derives from a 4px base. The numeric scale maps to Tailwind defaults:

| Token | rem | px | Usage |
|-------|-----|----|-------|
| `xs` | 0.25 | 4 | Tight gaps (icon + label) |
| `sm` | 0.5 | 8 | Related elements |
| `md` | 0.75 | 12 | Default inner padding |
| `lg` | 1 | 16 | Comfortable spacing |
| `xl` | 1.5 | 24 | Section padding |
| `2xl` | 2 | 32 | Major separation |
| `3xl` | 3 | 48 | Large gaps |
| `4xl` | 4 | 64 | Section breaks |

### Semantic Spacing

| Name | Value | Intent |
|------|-------|--------|
| `tight` | 4px | Dense inline elements |
| `cozy` | 8px | Related control groups, card padding (mobile) |
| `comfortable` | 16px | Default section padding |
| `spacious` | 32px | Major section separation |
| `ceremonial` | 64px | Hero / sanctuary-level whitespace |

### Breakpoints

Mobile-first. Values match Tailwind defaults:

| Name | Width |
|------|-------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |

## Elevation & Depth

| Level | Shadow | Usage |
|-------|--------|-------|
| `none` | — | Flat elements, borders only |
| `sm` | `0 1px 2px` | Subtle lift (badges, small cards) |
| `md` | `0 4px 6px` | Cards, dropdowns |
| `lg` | `0 10px 15px` | Popovers, modals |
| `xl` | `0 20px 25px` | Dialogs, overlays |
| `2xl` | `0 25px 50px` | Maximum elevation |

### Focus Rings

WCAG 2.2 AA compliant. Two variants:

- `focus-light`: `0 0 0 3px #0284c766` (info-600 at 40% opacity)
- `focus-dark`: `0 0 0 3px #38bdf880` (info-400 at 50% opacity)

**Do:**
- Always use `focus-ring` class on interactive elements
- Maintain ≥ 3:1 contrast between focus ring and adjacent colors

**Don't:**
- Remove focus indicators (`outline-none`) without an equally visible replacement
- Use custom box-shadow for focus — use the `focus-ring` token

## Shapes

| Token | Value | Usage |
|-------|-------|-------|
| `none` | 0 | Sharp corners (rare) |
| `sm` | 2px | Subtle rounding |
| `md` | 6px | Buttons, inputs, badges |
| `lg` | 8px | Cards, containers |
| `xl` | 12px | Large containers |
| `full` / `pill` | 9999px | Circular avatars, pill badges |

## Components

### Button

Primary interactive control. Radix Slot polymorphic pattern for links styled as buttons.

- **Variants:** `primary`, `secondary`, `ghost`, `danger`, `link`
- **Sizes:** `xs` (28px), `sm` (32px), `md` (40px), `lg` (48px), `icon` (40×40px)
- **States:** default, hover, active, disabled (50% opacity), loading (spinner replaces content)
- **Accessibility:** Native `<button>` semantics, Space/Enter activation, `aria-busy` when loading
- **Tenant-aware:** `secondary`, `ghost`, and `link` variants apply vertical accent text color when tenant has a vertical

### Input

Labeled single-line text field with helper text and error state.

- **States:** default, error (`aria-invalid` + `aria-describedby`), required indicator
- **Accessibility:** Label associated via `id`, error message linked via `aria-describedby`

### Card

Content container with header/content/footer/media slots.

- **Variants:** `default` (border), `outlined` (2px border), `elevated` (shadow), `interactive` (hover elevation + focus ring)
- **Media aspects:** `auto`, `square`, `video` (16:9), `wide` (21:9), `portrait` (3:4)
- **Tenant-aware:** Interactive variant applies vertical accent border when tenant has a vertical

### Badge

Small status/metadata label.

- **Variants:** `default` (primary bg), `secondary` (neutral), `outline`, `destructive`, `vertical` (tenant accent), `liturgical-season` (gold)
- **Sizes:** `sm`, `md`, `lg`

### Select

Trigger for dropdown menus. Uses Radix Select under the hood.

### Textarea

Multi-line text input with label, helper text, and error state.

### Separator

Visual divider using `border` token.

### Skeleton

Loading placeholder with animation.

### Spinner

Loading indicator. Sizes: `xs`, `sm`, `md`, `lg`.

### Avatar

User/entity avatar with fallback initials.

## Do's and Don'ts

### Do

- Use Tailwind utility classes derived from tokens — they are the design system API
- Use `themeColorExtension(ref)` for theme switching — config-only, no component changes
- Use `localeAccentExtension(ref)` for national color overlays via CSS custom properties
- Reference tokens by semantic name (`primary`, `surface`, `text`) not raw scale values
- Test color pairings with `pnpm verify:contrast` before committing
- Use `focus-ring` class on all interactive elements
- Use `motion-reduce:` prefix for transition animations

### Don't

- **Never hard-code hex values** outside `packages/ui/src/tokens/` (enforced by hex-leak lint)
- **Never use denomination names** in component code — use theme refs (DS-THEME-01)
- **Never remove focus indicators** without an equally visible replacement
- **Never place gold (`accent`) behind white text** — fails WCAG contrast
- **Never use `vertical-*` names** as denomination proxies — they encode structural type, not faith tradition
- **Never mix serif and sans** within the same text block
- **Never fetch webfonts at build time** — CI is offline; use system stacks

## Responsive Behavior

- Mobile-first breakpoint strategy
- Container queries preferred over viewport breakpoints for component-level responsiveness
- Fluid typography via `clamp()` is available but not yet standardized — mark `needs-design-decision`
- All transitions respect `prefers-reduced-motion` via `motion-reduce:` prefix

## Known Gaps

- **Webfont vendoring:** Inter and Source Serif 4 are declared in stacks but not vendored. When CDN is unavailable, fallback fonts render. Track: `needs-design-decision` on when to vendor.
- **Fluid typography:** No standardized `clamp()` scale yet. Track: `needs-design-decision`.
- **Component Storybook coverage:** Not all primitives have Storybook stories. Track: add stories incrementally.
- **Dark mode liturgical material scales:** `altar`, `candle`, `incense`, `stone`, `wood` do not have dark-mode-specific adjustments. May need tuning for contrast on dark surfaces.
- **Locale accent coverage:** Only `lt` (Lithuania) is registered. Other EU locales need registration as tenants onboard.
