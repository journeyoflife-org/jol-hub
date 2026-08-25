/**
 * WCAG 2.2 AA criteria register — STEP 12.
 *
 * Every Level A + AA success criterion of WCAG 2.2 with HOW it is satisfied
 * in the JOL template renderer. `status` drives the verification story:
 *
 *   automated   — enforced by axe-core / structural checkers in CI
 *   token       — enforced at the design-token level (check-contrast.ts)
 *   component   — guaranteed by the ui component implementation (review)
 *   manual      — covered by the manual audit (frontend/docs/a11y-audit.md)
 *   process     — editorial/operational rule (content authors, backend)
 *
 * Legal driver: EU Accessibility Act (EAA) 2025. Target level: AA across
 * all criteria (AAA targets are noted where we exceed AA, e.g. 44px touch).
 */

export type A11yVerification = 'automated' | 'token' | 'component' | 'manual' | 'process';

export interface WcagCriterion {
  /** Success criterion number, e.g. '1.3.1'. */
  sc: string;
  name: string;
  level: 'A' | 'AA';
  status: A11yVerification;
  /** Where/how it is satisfied (one line). */
  note: string;
}

export const WCAG_22_AA: readonly WcagCriterion[] = [
  // -- 1. Perceivable ------------------------------------------------------
  { sc: '1.1.1', name: 'Non-text Content', level: 'A', status: 'automated', note: 'alt-text checker + axe image-alt; decorative images alt=""' },
  { sc: '1.2.1', name: 'Audio-only and Video-only (Prerecorded)', level: 'A', status: 'process', note: 'tenant content rule: transcripts required; no such content in pilot' },
  { sc: '1.2.2', name: 'Captions (Prerecorded)', level: 'A', status: 'process', note: 'YouTube embeds must enable captions (MapEmbed/video policy)' },
  { sc: '1.2.3', name: 'Audio Description or Media Alternative', level: 'A', status: 'process', note: 'transcript alternative for video content' },
  { sc: '1.2.4', name: 'Captions (Live)', level: 'AA', status: 'process', note: 'no live streams in pilot; policy documented' },
  { sc: '1.2.5', name: 'Audio Description (Prerecorded)', level: 'AA', status: 'process', note: 'editorial rule for tenant media' },
  { sc: '1.3.1', name: 'Info and Relationships', level: 'A', status: 'automated', note: 'heading-hierarchy checker, semantic landmarks, form labels' },
  { sc: '1.3.2', name: 'Meaningful Sequence', level: 'A', status: 'automated', note: 'DOM order = visual order (no CSS reorder of content)' },
  { sc: '1.3.3', name: 'Sensory Characteristics', level: 'A', status: 'manual', note: 'copy review: no shape/position-only instructions' },
  { sc: '1.3.4', name: 'Orientation', level: 'AA', status: 'manual', note: 'responsive layout has no orientation lock' },
  { sc: '1.3.5', name: 'Identify Input Purpose', level: 'AA', status: 'automated', note: 'autocomplete attributes on contact/booking forms (axe)' },
  { sc: '1.4.1', name: 'Use of Color', level: 'A', status: 'manual', note: 'status badges pair color with text/icon' },
  { sc: '1.4.2', name: 'Audio Control', level: 'A', status: 'component', note: 'no auto-playing audio; rule enforced in media policy' },
  { sc: '1.4.3', name: 'Contrast (Minimum)', level: 'AA', status: 'token', note: 'check-contrast.ts gate on every documented pair (4.5:1 / 3:1)' },
  { sc: '1.4.4', name: 'Resize Text', level: 'AA', status: 'manual', note: '200% zoom audit: no horizontal scroll (a11y-audit.md)' },
  { sc: '1.4.5', name: 'Images of Text', level: 'AA', status: 'process', note: 'text is HTML, not images (OG images excluded — decorative share art)' },
  { sc: '1.4.10', name: 'Reflow', level: 'AA', status: 'manual', note: '320px CSS width reflow check in audit' },
  { sc: '1.4.11', name: 'Non-text Contrast', level: 'AA', status: 'token', note: 'UI component pairs verified at 3:1 in check-contrast.ts' },
  { sc: '1.4.12', name: 'Text Spacing', level: 'AA', status: 'manual', note: 'no clipping with relaxed spacing overrides (audit)' },
  { sc: '1.4.13', name: 'Content on Hover or Focus', level: 'AA', status: 'component', note: 'tooltips dismissible/hoverable; none on critical paths in pilot' },

  // -- 2. Operable ---------------------------------------------------------
  { sc: '2.1.1', name: 'Keyboard', level: 'A', status: 'automated', note: 'native interactive elements; axe + manual keyboard pass' },
  { sc: '2.1.2', name: 'No Keyboard Trap', level: 'A', status: 'component', note: 'FocusTrap components always expose Escape/close' },
  { sc: '2.1.4', name: 'Character Key Shortcuts', level: 'A', status: 'automated', note: 'no single-character shortcuts exist (axe rule)' },
  { sc: '2.2.1', name: 'Timing Adjustable', level: 'A', status: 'component', note: 'no time limits; no auto-refresh (no meta refresh)' },
  { sc: '2.2.2', name: 'Pause, Stop, Hide', level: 'A', status: 'component', note: 'no auto-playing motion; carousels require controls' },
  { sc: '2.3.1', name: 'Three Flashes or Below Threshold', level: 'A', status: 'process', note: 'no flashing content policy; nothing flashes in pilot' },
  { sc: '2.4.1', name: 'Bypass Blocks', level: 'A', status: 'component', note: 'SkipLink is the FIRST focusable element in the tenant shell' },
  { sc: '2.4.2', name: 'Page Titled', level: 'A', status: 'automated', note: 'metadata titles on every route (axe document-title)' },
  { sc: '2.4.3', name: 'Focus Order', level: 'A', status: 'automated', note: 'focus-order checker: positive tabindex forbidden' },
  { sc: '2.4.4', name: 'Link Purpose (In Context)', level: 'A', status: 'automated', note: 'no "click here"/"read more" — link text checker + review' },
  { sc: '2.4.5', name: 'Multiple Ways', level: 'AA', status: 'component', note: 'nav + sitemap + related links per tenant' },
  { sc: '2.4.6', name: 'Headings and Labels', level: 'AA', status: 'automated', note: 'one h1 per page; descriptive headings (checker + review)' },
  { sc: '2.4.7', name: 'Focus Visible', level: 'AA', status: 'token', note: 'global :focus-visible outline (2px, offset 2) in globals.css' },
  { sc: '2.5.7', name: 'Dragging Movements', level: 'AA', status: 'component', note: 'no drag interactions in pilot; alternative click paths rule' },
  { sc: '2.5.8', name: 'Target Size (Minimum)', level: 'AA', status: 'component', note: 'interactive controls ≥ 24px, buttons 40px (aim 44px)' },

  // -- 3. Understandable ---------------------------------------------------
  { sc: '3.1.1', name: 'Language of Page', level: 'A', status: 'automated', note: '<html lang> set from resolved locale (axe html-has-lang)' },
  { sc: '3.1.2', name: 'Language of Parts', level: 'AA', status: 'manual', note: 'locale switcher renders matching lang; foreign quotes review' },
  { sc: '3.2.1', name: 'On Focus', level: 'A', status: 'automated', note: 'focus never triggers navigation/context change' },
  { sc: '3.2.2', name: 'On Input', level: 'A', status: 'automated', note: 'form submission only via explicit submit action' },
  { sc: '3.2.3', name: 'Consistent Navigation', level: 'AA', status: 'component', note: 'shared Header/Footer across all tenant pages' },
  { sc: '3.2.4', name: 'Consistent Identification', level: 'AA', status: 'component', note: 'identical components carry identical labels' },
  { sc: '3.2.6', name: 'Consistent Help', level: 'A', status: 'component', note: 'help/contact mechanisms in the same order across pages' },
  { sc: '3.3.1', name: 'Error Identification', level: 'A', status: 'component', note: 'form errors named in text + aria-describedby' },
  { sc: '3.3.2', name: 'Labels or Instructions', level: 'A', status: 'automated', note: 'form-labels checker + axe label rules' },
  { sc: '3.3.3', name: 'Error Suggestion', level: 'AA', status: 'component', note: 'validation messages suggest the correction' },
  { sc: '3.3.4', name: 'Error Prevention (Legal/Financial)', level: 'AA', status: 'component', note: 'booking/donation review step before submit (STEP 8)' },
  { sc: '3.3.7', name: 'Redundant Entry', level: 'A', status: 'component', note: 'multi-step flows reuse entered data; autofill allowed' },
  { sc: '3.3.8', name: 'Accessible Authentication', level: 'AA', status: 'component', note: 'no cognitive-function test in login (OIDC via jol-auth); no CAPTCHA — honeypot instead' },

  // -- 4. Robust -----------------------------------------------------------
  { sc: '4.1.1', name: 'Parsing', level: 'A', status: 'automated', note: 'React-serialized markup; axe parses clean' },
  { sc: '4.1.2', name: 'Name, Role, Value', level: 'A', status: 'automated', note: 'aria-usage checker: native elements, labeled icon buttons' },
  { sc: '4.1.3', name: 'Status Messages', level: 'AA', status: 'component', note: 'AnnouncerProvider/LiveRegion for dynamic updates' },
];

/** Counts by verification channel (reporting helper). */
export function criteriaByStatus(): Record<A11yVerification, number> {
  const counts = { automated: 0, token: 0, component: 0, manual: 0, process: 0 };
  for (const criterion of WCAG_22_AA) counts[criterion.status] += 1;
  return counts;
}
