# @jol-hub/ui — Accessibility Guidelines (WCAG 2.2 AA)

Every component in this library ships accessible by default and is gated by
`pnpm check-a11y` (axe-core, WCAG 2.0–2.2 A+AA tags) plus
`pnpm check-contrast` (token pairs). Legal driver: EAA 2025.

## Hard rules for new components

1. **Native elements first.** `<button>`, `<a>`, `<input>` — never
   `<div role="button">`. ARIA only where native semantics are insufficient.
2. **Every interactive element has an accessible name** — visible text or
   `aria-label` (icon-only buttons ALWAYS carry `aria-label`).
3. **Focus is always visible.** Do not set `outline: none` without applying
   the `.focus-ring` class (box-shadow indicator). Never rely on hover-only
   interactions.
4. **Touch targets ≥ 24×24px** (WCAG 2.5.8 AA); aim for 40–44px — use the
   standard sizes (`h-10`, `icon`).
5. **No positive tabindex.** Order follows the DOM. `tabindex="0"` to add,
   `-1"` for programmatic focus only.
6. **Link text describes the destination.** Never "click here"/"read more".
7. **Color is never the only signal.** Pair status colors with text/icons.
8. **Images:** meaningful images get descriptive `alt`; decorative ones get
   `alt=""` (+ `aria-hidden` when the wrapper is purely ornamental).

## Provided accessibility primitives (`components/accessibility/`)

| Component | Purpose | Usage rule |
| --- | --- | --- |
| `SkipLink` | Bypass repeated blocks (WCAG 2.4.1) | MUST be the first focusable element of the app shell |
| `FocusTrap` | Confine focus in dialogs/drawers (2.1.2, 2.4.3) | Always pair with Escape-to-close + focus restoration |
| `AnnouncerProvider` / `useAnnounce` | Polite/assertive screen-reader announcements (4.1.3) | Status updates: polite; errors: assertive |
| `LiveRegion` | Declarative `aria-live` container (4.1.3) | Set `aria-atomic`/`aria-relevant` per update shape |

## Dialogs, drawers & modals

- `role="dialog"` + `aria-modal="true"`; a labelled title (`aria-labelledby`).
- Focus moves INTO the dialog on open, is trapped, and RETURNS to the
  trigger on close (see `MobileNav` as the reference implementation).
- Escape closes. Backdrop click may close, but keyboard users must never
  depend on it.

## Forms

- Every control: associated `<label for>` (or wrapping label), never
  placeholder-only labeling.
- Required fields indicated in the label text (not just color/asterisk).
- Errors: visible text, `aria-describedby` linking control → message,
  announced via the announcer on submit.
- Anti-spam: honeypot field (`aria-hidden="true"` + `tabindex="-1"` +
  `autocomplete="off"`) — NEVER a visual CAPTCHA (WCAG 3.3.8).

## Landmarks & headings (app-level contract)

- One `<main>` per page; `header`/`nav`/`footer` landmarks from the shell.
- Exactly one `<h1>` (the page title); sections descend one level at a time.

## Motion

- Respect `prefers-reduced-motion` (global baseline in `globals.css`;
  component transitions use `motion-reduce:transition-none`).
- Nothing auto-plays > 3 seconds without pause/stop controls (WCAG 2.2.2).

## Verification workflow

1. Add/modify component → update the `Showcase` page (all major variants).
2. `pnpm --filter @jol-hub/ui verify` (type-check + contrast + axe).
3. App-level: re-run `pnpm --filter template-renderer check-a11y`.
4. Record manual findings in `frontend/docs/a11y-audit.md`.

axe false positives: never disable a rule globally. Document the exception
with justification in the audit doc and scope it as narrowly as possible.
