# JOL Design System Specification — v1

Status: RATIFIED SPEC (Phase 2.1, docs-only) · Date: 2026-08-28 · Governing: MASTER-PROMPT §6 Phase 2.1 · ADR-001 (tenants-are-data, schema-per-tenant) · Fits the as-built renderer: `frontend/apps/template-renderer` (6 template families: base/church/cleaning/deanery/diocese/funeral; `page-config.ts`/`page-defaults.ts` config surface) and `packages/ui` (already structured as `tokens/ styles/ components/ providers/`).

Every accessibility requirement in this document is written as a **runnable assertion** executable by the offline compensating gates (axe-core scans + contrast computation in `packages/a11y`); no requirement relies on network/browser-only tooling.

---

## 1. Token architecture — one set, denomination themes by config

### 1.1 Three layers

| Layer | Scope | Example | Mutability |
|---|---|---|---|
| Primitives | global, never themed | `--ds-blue-600`, `--ds-space-4` (4px scale: 4/8/12/16/24/32/48/64) | Versioned only via §7 |
| Semantic aliases | the only layer components consume | `--ds-color-bg`, `--ds-color-text`, `--ds-color-primary`, `--ds-color-focus`, `--ds-type-body`, `--ds-elev-2`, `--ds-motion-fast` | Resolve to primitives or theme overrides |
| Theme overrides | denomination + liturgical (config-only) | `--ds-color-primary: var(--theme-primary)` | Per-tenant, zero code |

Categories: **color** (bg/text/primary/secondary/accent/muted/border/focus + 50–900 scales matching the as-built Tailwind scales in `parish-template/tailwind.config.ts` — the migration target for those hardcoded values), **type** (4 sizes × line-heights, weight set 400/600/700), **spacing** (8pt grid), **elevation** (3 levels: flat/raised/overlay), **motion** (fast 120ms / base 200ms / slow 400ms, ease-standard).

### 1.2 Denomination theme profiles — config only, never code forks

Four profiles ship in `packages/ui/tokens/themes/`: **catholic**, **protestant**, **orthodox**, **other** (default = neutral `other`). Each profile is a JSON override map of semantic aliases (primary/secondary/accent palettes + optional serif/sans family preference + iconography set reference). No component, template, or route may branch on denomination — enforcement assertion **DS-THEME-01** (grep gate): zero occurrences of denomination string literals in `packages/ui/src/components/` and `template-renderer/src/components/`.

> **DS-THEME-01 SCOPE NOTE (2026-08-28, O-022 remediation — clarification, not relaxation):** the assertion governs COMPONENT source (`*.ts`/`*.tsx` in the two components trees) — where branching/rendering logic lives. Vertical controlled-vocabulary references belong to the DATA/resolution layer of the ADR-001 chain and are legitimate outside that scope: `template-renderer/src/lib/` (layout-families.ts, template-registry.ts), `packages/seed-data` (the `Vertical` vocabulary itself), and `packages/ui/src/tokens/themes/` (profile ids). Documentation is outside the assertion. Canonical runnable form: `scripts/check-theme-literals.sh` (bidirectionally falsified at O-022 closure: clean tree exit 0, planted literal exit 1). The wording itself needed no amendment — the evidence showed the violations were a true component-layer literal (privacy-page vocabulary, remediated to structural terms) and a denomination-named layout family (renamed to the structural 'eastern', tables relocated to lib/), not a scope defect.

### 1.3 Theme selection (tenants-are-data, ADR-001)

Resolution follows the ratified chain: **subdomain → tenant → schema → locale → template → content**, extended with `→ theme`:
1. Tenant record (seed data, per ADR-001) gains one field: `theme_ref` (`catholic | protestant | orthodox | other`) + optional `theme_overrides` (JSON, validated against the token schema).
2. `tenant-resolver` emits the theme ref alongside the template choice.
3. Renderer applies the profile as CSS custom properties on the tenant root element at build/render time (static generation preserved — themes are data, not runtime fetches).
Migration of existing hardcoded Tailwind palettes: parish-template's primary/secondary/accent scales become the `catholic` profile baseline (visual identity preserved, source of truth moved).

## 2. WCAG 2.2 AA / EN 301 549 — component acceptance tests

Each component in `packages/ui` carries a co-located `.a11y.test.tsx`; all run offline (axe-core + computed-style assertions in jsdom; contrast via relative-luminance math, no rendering service required).

| ID | Assertion (runnable) | Standard |
|---|---|---|
| DS-A11Y-01 | Every semantic text/background token pair: contrast ≥ **4.5:1** (normal) and ≥ **3:1** (≥18.66px bold / ≥24px); every UI-component boundary/indicator ≥ **3:1** — computed from token values, fails on any theme profile | WCAG 1.4.3 / 1.4.11 |
| DS-A11Y-02 | Non-text content has text alternative or `role="presentation"`; images require alt policy (empty alt only when decorative-flagged in CMS) | 1.1.1 |
| DS-A11Y-03 | Every interactive element is Tab-reachable; DOM order == visual order (no positive tabindex — grep assertion `tabIndex={positive}` = 0 hits) | 2.1.1 / 2.4.3 |
| DS-A11Y-04 | Focus indicator: ≥2px thickness, contrast ≥3:1 against adjacent colors, non-obscured (**2.4.11 focus-not-obscured**, new in 2.2); `:focus-visible` present on every interactive primitive | 2.4.7 / 2.4.11 |
| DS-A11Y-05 | Modal: focus moves in on open, returns to trigger on close, focus trapped, Esc closes; no keyboard trap in any component (axe rule `no-autofocus` + scripted Tab-cycle) | 2.1.2 / 2.4.3 |
| DS-A11Y-06 | Dragging alternatives: every drag interaction exposes a single-pointer alternative (buttons/select) | 2.5.7 (2.2) |
| DS-A11Y-07 | Target size ≥ 24×24 CSS px (exceptions only where spacing guarantees no overlap) | 2.5.8 (2.2) |
| DS-A11Y-08 | `prefers-reduced-motion: reduce`: every `--ds-motion-*` consumer collapses to opacity-only or none; no transform/parallax/auto-advance (assertion scans computed animation declarations under the media query) | 2.3.3 |
| DS-A11Y-09 | Landmarks: exactly one `main`, banners/contentinfo per page shell; heading levels never skip (h1→h2→h3 chain assertion per template) | 1.3.1 / 2.4.6 |
| DS-A11Y-10 | Forms: every input programmatically labeled; error messages linked via `aria-describedby` and announced (`role="alert"` or aria-live polite); labels visible (no placeholder-only labels) | 3.3.1 / 3.3.2 / 1.3.1 |
| DS-A11Y-11 | Language: `lang` per page + per-locale segment; i18n strings never mix directionality | 3.1.1 / 3.1.2 |
| DS-A11Y-12 | axe-core full-page scan per template family: **0 critical, 0 serious** in offline jsdom mode | aggregate gate |

Component **keyboard maps** (documented per component, tested by DS-A11Y-03/05): navigation menu (Arrow keys within, Esc closes submenus), collection grid (roving tabindex), dialogs (as DS-A11Y-05), carousels (arrows + pause control, auto-advance off under reduced motion).

## 3. Non-technical-admin ergonomics (parish admins)

**Editing model** (through the existing `editor` surface): editable = logo, hero image, welcome text, contact details, service times, news/blog posts, **theme selection from preset palettes only**, liturgical-season opt-in. NOT editable: typography scale, spacing, layout structure, arbitrary hex colors.

Guardrails against breaking a11y/contrast:
- **No free-form color entry.** Admins pick among pre-validated palette presets; every preset passes DS-A11Y-01 in CI before it is ever offered (assertion **DS-ADMIN-01**).
- Logo/hero uploads: automatic contrast hint when an image sits behind text (overlay scrim enforced by the component, not by the admin).
- Text fields enforce max lengths per §5 budgets; overflow preview shows truncation behavior.

**Preview semantics**: staged preview renders the tenant's locale + theme + the draft content in an isolated preview route (never indexed — robots noindex asserted, SEO hard rule 4 posture); WCAG annotations (failing contrast flagged inline) surface in preview only, never blocking save of compliant content; publish runs the DS-A11Y gate suite; a failing publish is blocked with human-readable reason, never silent.

## 4. Liturgical-calendar theming hooks — config-driven

`packages/ui/tokens/seasons.json`: season → semantic alias overrides:

| Season | Overridden tokens | Windows |
|---|---|---|
| Advent | primary→violet family, accent→rose (Gaudete) | computed: 4 Sundays before Christmas |
| Christmas | primary→white/gold | Dec 25 – Baptism of the Lord |
| Lent | primary→violet, muted accents | Ash Wednesday (computed) – Holy Thursday |
| Eastertide | primary→white/gold | Easter (computed) – Pentecost |
| Ordinary | profile defaults | remainder |

Rules: movable feasts computed by an audited Easter-algorithm utility with a golden-value test table (assertion **DS-LIT-01**); per-tenant `season_theme_enabled: bool` (default true for catholic profile, false for others); seasons may override **color tokens only** — never spacing/type/motion (a11y surface immutable); Orthodox profile may register its own season table via config extension (same schema). Assertion **DS-LIT-02**: every season table passes DS-A11Y-01 for all its pairs.

## 5. i18n implications

- **String-expansion budgets** (component layout must absorb): RU **+30%** over EN baseline, LT **+15%**, LV **+15%**, EE **+10%**. Assertions **DS-I18N-01**: no fixed-width text containers in `packages/ui` (grep for `w-\[` px-fixed on text nodes = 0 hits); DS-I18N-02: truncation only via line-clamp with full-text disclosure (tooltip/expansion), never silent clipping.
- **Font/fallback stack** (diacritics mandatory, no tofu): Latin + **Latin Extended** (LT: ą č ę ė į š ų ū ž; LV: ā č ē ģ ī ķ ļ ņ š ū ž; EE: ä ö õ ü š ž) + **Cyrillic** (RU) subsets; stack: primary webfont (subset-loaded, font-display: swap, self-hosted — no third-party CDN, GDPR) → system fallback `system-ui, 'Segoe UI', sans-serif`. Assertion **DS-I18N-03**: glyph-coverage test over the pilot character lists (fonttools cmap check offline).
- **RTL-readiness posture: FUTURE-ONLY.** All components use logical properties (`margin-inline`, `text-align: start`) where trivially free today; no RTL locale is scoped for the 27-country EU program; RTL support is explicitly out of v1 and requires its own spec if ever needed.

## 6. Component inventory × 25-page inventory

Canonical page list: `docs/seo/international-seo-strategy.md` 25-page table (ASSUME-SEO-005). Consumption map (existing ✓ / build ✗):

| Components | Consumed by pages (#) | Status |
|---|---|---|
| PageShell + landmarks, Header/Nav, Footer | all 25 | ✓ as-built (collection-chrome, base-template) |
| EntityHero, EntityCard, CollectionGrid | 3,4,5,6,7,8,9,10 | ✓ (collection view) |
| BreadcrumbBar, PaginationBar | 6,18,19 + all collections | ✓/partial |
| ServiceList / ServiceDetail | 11,12 | ✓ (funeral/cleaning templates) |
| StorefrontGrid, ProductCard, PriceDisplay (VAT-incl) | 13,14 | ✗ build (commerce components exist in renderer; design-system versions needed) |
| VendorDashboardShell (noindex authenticated) | 15 | ✗ build (authenticated surface, SEO posture implemented) |
| DonationForm, DonateActionBanner, ImpactList | 16,17 | ✗ build (DPIA-gated; no donor data in JSON-LD per SEO table) |
| NewsList/NewsArticle | 18 | ✓ |
| EventCalendar, EventCard | 19 | ✓ (events pages) |
| CRMRedirectShell (noindex, never CMS) | 20 | ✓ posture |
| ChatbotEntry (FAQPage public shell only) | 21 | ✓ shell (sprint 2) — hidden-by-default until O-010 + AI gate |
| CemeteryMapCanvas (plot data never indexed) | 22 | ✓ (sprint 2, static SVG, noindex surfaces only) |
| LegalPage, FAQAccordion | 23 | ✓ (SharedCompliancePage) |
| CourseList / OnboardingSteps | 24 | ✓ both (CourseList sprint 1, OnboardingSteps sprint 2) |
| ContactBlock, SupportForm | 25 | ✓ |

**Component-build backlog** (gap → owner phase): ~~StorefrontGrid/ProductCard~~/PriceDisplay, ~~VendorDashboardShell~~, ~~DonationForm/DonateActionBanner/ImpactList~~, ~~ChatbotEntry shell~~, ~~CemeteryMapCanvas~~, ~~CourseList~~. Each backlog item inherits the full §2 assertion set as its acceptance gate.

> **SPRINT 1 DELIVERED (feat(ui) component backlog sprint 1):** EntityFactCard (packages 03/04/07/09), MapBlock static ePrivacy-safe variant (03/04/07/12), EventList + ServiceList wrappers per the 03/06 reference structures, CourseList (24) — all with externalized LT/EN/RU strings, README traceability, and Showcase axe coverage. Donation components remain struck through: DEFERRED by the payment-track freeze (DECISION-LOG D-053) — untouched this sprint.

> **SPRINT 2 DELIVERED (feat(ui) component backlog sprint 2):** ProductCard + StorefrontGrid + VendorDashboardShell — DISPLAY-ONLY per the CLOSED payment boundary (hub renders, marketplace transacts): transaction CTAs are INERT PLACEHOLDERS (disabled + "available at launch"), zero transaction wiring, zero marketplace API contact while the freeze stands (D-052). ChatbotEntry shell — AI-GATED, hidden-by-default (renders nothing without `enabled`; O-010 safety.yml remains the absolute launch blocker). CemeteryMapCanvas (22, static SVG, plot data noindex-only) and OnboardingSteps (24). Backlog remainder: PriceDisplay only (needs the pricing data model; disclosed). Donation components remain struck through: DEFERRED by the freeze (D-053).

> **DEFERRED 2026-08-28 (DECISION-LOG D-053):** all donation components (DonationForm/DonateActionBanner/ImpactList and the full 2.3 component set) are EXCLUDED from every build plan until the owner explicitly unfreezes the payment track (D-052). The store/marketplace trio above is commerce UI, not payment-track work, and remains eligible under its own gates — but any component that touches the payment handoff stays deferred with the donation set.

## 7. Token versioning & change control

- `packages/ui/tokens` carries `tokens.version.json` (SemVer). **Token change = cross-tenant event** — it renders into every tenant site simultaneously.
- **PATCH**: bug-fix values that improve or preserve all DS-A11Y assertions (auto-deployable).
- **MINOR**: new tokens/themes/seasons (additive; opt-in per tenant where behavioral).
- **MAJOR**: any semantic-alias rename/removal or value change that alters a DS-A11Y assertion outcome → requires: DECISION-LOG entry, N+1 deprecation window (two releases of overlap, mirroring ADR-009 §4 deprecation discipline), tenant-facing changelog note, and the full offline gate suite green on BOTH old and new values.
- CI gate **DS-VER-01**: token diff in a PR without a `tokens.version.json` bump fails; **DS-VER-02**: any MAJOR diff without a DECISION-LOG reference fails.

## 8. Ownership & assertion index

Assertions: DS-THEME-01 (no denomination literals in components) · DS-A11Y-01…12 (component acceptance) · DS-ADMIN-01 (preset validation) · DS-LIT-01/02 (season algorithm + season contrast) · DS-I18N-01…03 (expansion, truncation, glyph coverage) · DS-VER-01/02 (versioning). All runnable offline; network/browser-only checks excluded by design.

Open inputs: ASSUME-SEO-005 (formal Phase 0 page-inventory confirmation of the 25-page list) · parish-template Tailwind migration task (separate implementation phase, not this spec).
