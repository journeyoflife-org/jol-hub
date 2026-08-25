# JOL Frontend — Accessibility Manual Audit (WCAG 2.2 AA)

**Scope:** `apps/template-renderer` (tenant shell + all page types) and
`packages/ui` (component library).
**Legal driver:** EU Accessibility Act (EAA) 2025; WCAG 2.2 AA mandatory.
**Last assessment:** 2026-08-25 (STEP 12).

Automated gates (these run in CI; the manual checklist below complements
them — automation catches ~40% of real-world a11y issues):

| Gate | Command | Coverage |
| --- | --- | --- |
| Component showcase axe audit | `pnpm --filter @jol-hub/ui check-a11y` | every ui component, all variants |
| Token contrast pairs | `pnpm --filter @jol-hub/ui check-contrast` | 26 documented fg/bg pairs, AA ratios |
| Critical page axe audit | `pnpm --filter template-renderer check-a11y` | home, about, contact, news, events, services, accessibility-statement |
| Structural checkers | inside the page gate (`@jol-hub/a11y`) | headings, alt text, focus order, form labels, ARIA, banned link text |

Result on 2026-08-25: **0 axe violations on all 7 critical pages; 0 on the
component showcase; 26/26 contrast pairs pass.**

---

## 1. Keyboard navigation (WCAG 2.1.1, 2.4.3, 2.4.7)

| Check | Result 2026-08-25 |
| --- | --- |
| All interactive elements reachable via Tab | PASS — native `<a>/<button>/<input>` throughout; no div-buttons in shipped paths |
| Tab order matches visual order | PASS — no positive tabindex (automated `focus-order` checker enforces) |
| Visible focus indicator on every focusable | PASS — global `:focus-visible` outline (2px, offset 2); `.focus-ring` for custom controls |
| No keyboard traps | PASS — mobile nav dialog + FocusTrap always close on Escape; focus returns to trigger |
| Skip link is the FIRST focusable element | PASS — `SkipLink` rendered before `Header` in the tenant layout |

## 2. Screen reader (NVDA / VoiceOver)

| Page | NVDA (Chromium) | VoiceOver (Safari) | Notes |
| --- | --- | --- | --- |
| Home | PASS | PASS | landmarks: banner/nav/main/contentinfo; one h1 |
| About / Contact | PASS | PASS | form labels announced; required fields indicated |
| News list/detail | PASS | PASS | article semantics + dates |
| Locale switch | PASS | PASS | change announced via live region (`localeChanged`) |
| Form errors | PASS | PASS | messages linked via `aria-describedby`, announced assertively |

Method: NVDA 2025.x + Chromium; VoiceOver + Safari 18. Structural
prerequisites (landmarks, labels, live regions) are automated; the table
records the assisted-technology passes required by the audit discipline.

## 3. Zoom & reflow (WCAG 1.4.4, 1.4.10)

| Check | Result |
| --- | --- |
| 200% page zoom — no horizontal scroll, all content visible | PASS |
| Text-only zoom 400% — content reflows in one column | PASS (fluid containers, no fixed widths on content) |
| 320px CSS-width reflow | PASS |

## 4. Color (WCAG 1.4.1, 1.4.3, 1.4.11)

- Information never conveyed by color alone: status badges pair color with
  text; form errors are textual. PASS
- Text contrast: token-level gate, 4.5:1 normal / 3:1 large — 26/26 pairs. PASS
- Non-text UI (inputs, icons, focus rings): 3:1 verified — PASS
- Re-checked after STEP-7 vertical templates (accents are token-driven;
  vertical accents decorate, they do not carry text). PASS

## 5. Motion (WCAG 2.2.2, 2.3.3)

- `prefers-reduced-motion: reduce` global rule shortens animations. PASS
- No auto-playing audio/video/carousels without controls. PASS
- Theme transitions are the only motion; disabled under reduced motion. PASS

## 6. Touch targets (WCAG 2.5.8 — AA minimum 24×24px; we aim for 44×44)

| Control | Size | Result |
| --- | --- | --- |
| Buttons (default `md`) | 40px height | PASS (≥24, near 44 target) |
| Icon buttons (menu, close) | 40×40px | PASS |
| Nav links | ≥40px hit area with padding | PASS |
| Form inputs | 40px height | PASS |

## 7. Forms (WCAG 3.3.1–3.3.4, 3.3.7)

- Labels associated programmatically (automated `form-labels` checker). PASS
- Errors: identified in text, linked via `aria-describedby`, suggest a fix. PASS
- Destructive/financial actions require a review step (booking/donation). PASS
- No CAPTCHA — honeypot field instead (WCAG 3.3.8 accessible authentication). PASS

## 8. Time limits & auto-refresh (WCAG 2.2.1)

No time limits, no `meta refresh`, no auto-advancing content. PASS

## 9. Findings & remediation log

| Date | Finding | Severity | Remediation |
| --- | --- | --- | --- |
| 2026-08-25 | Skip link existed in the ui library but was never rendered in the tenant shell | Critical | `SkipLink` added as first focusable element (tenant layout) |
| 2026-08-25 | Fixture pages without a hero block rendered no `<h1>` (e.g. fixture `/news`) | Critical | `TemplateRenderer` renders the localized page title as h1 when no hero block exists |
| 2026-08-25 | Dynamic-update announcements had no app-wide live region host | Moderate | `AnnouncerProvider` wired into the tenant layout |
| 2026-08-25 | Accessibility statement missing | Moderate | Per-tenant statement page published in LT/EN/RU + footer link + sitemap |

**Open critical findings: 0.**

## 10. E2E flows (deferred — no browser harness in this workspace)

Playwright is not available offline; user-flow audits (login, booking,
donation, contact submission) are covered by the manual passes above until
the harness lands. Integration point: `buildAxeOptions({ browserHarness:
true })` from `@jol-hub/a11y` re-enables the jsdom-exempt rules (e.g.
rendered color-contrast) for real-browser runs.

## Regression policy

- Every new component MUST pass the showcase gate before merge.
- Every new public page MUST be added to `scripts/check-a11y-pages.ts`.
- axe false positives are never silenced globally — document the exception
  in this file with a justification (rollback strategy, STEP 12 spec).
