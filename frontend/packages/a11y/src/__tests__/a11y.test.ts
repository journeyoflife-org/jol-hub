/**
 * @jol-hub/a11y tests — STEP 12.
 *
 * Structural checkers (headings, alt, focus order, form labels, ARIA/link
 * text), WCAG contrast math and the criteria register. Run via
 * `pnpm --filter @jol-hub/a11y test` (tsx --test).
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';

import { checkHeadingHierarchy } from '../checkers/heading-hierarchy';
import { checkAltText } from '../checkers/alt-text';
import { checkFocusOrder } from '../checkers/focus-order';
import { checkFormLabels } from '../checkers/form-labels';
import { checkAriaUsage } from '../checkers/aria-usage';
import { contrastRatio, meetsWcagAA, relativeLuminance } from '../checkers/color-contrast';
import { WCAG_22_AA, criteriaByStatus } from '../constants';

function doc(body: string): Document {
  return new JSDOM(`<!DOCTYPE html><html lang="lt"><body>${body}</body></html>`).window.document;
}

// =============================================================================
// HEADING HIERARCHY (1.3.1 / 2.4.6)
// =============================================================================

test('valid heading hierarchy passes', () => {
  const findings = checkHeadingHierarchy('<h1>Title</h1><h2>Section</h2><h3>Sub</h3><h2>Next</h2>');
  assert.equal(findings.length, 0);
});

test('missing h1 fails', () => {
  const findings = checkHeadingHierarchy('<h2>Only section</h2>');
  assert.ok(findings.some((f) => f.message.includes('no <h1>')));
});

test('multiple h1 elements fail', () => {
  const findings = checkHeadingHierarchy('<h1>One</h1><h1>Two</h1>');
  assert.ok(findings.some((f) => f.message.includes('2 <h1>')));
});

test('skipped level on descent fails, ascent is fine', () => {
  const findings = checkHeadingHierarchy('<h1>A</h1><h3>Skipped</h3><h2>Back up ok</h2>');
  assert.equal(findings.length, 1);
  assert.ok(findings[0]?.message.includes('<h1> → <h3>'));
});

test('empty heading text fails', () => {
  const findings = checkHeadingHierarchy('<h1>Title</h1><h2>   </h2>');
  assert.ok(findings.some((f) => f.message.includes('Empty <h2>')));
});

// =============================================================================
// ALT TEXT (1.1.1)
// =============================================================================

test('images without alt fail; alt="" and alt text pass', () => {
  const findings = checkAltText('<img src="a.jpg"><img src="b.jpg" alt=""><img src="c.jpg" alt="Church">');
  assert.equal(findings.length, 1);
});

test('role="img" without aria-label fails', () => {
  const findings = checkAltText('<div role="img"></div><div role="img" aria-label="Map"></div>');
  assert.equal(findings.length, 1);
});

// =============================================================================
// FOCUS ORDER (2.4.3)
// =============================================================================

test('positive tabindex fails; 0 and -1 pass', () => {
  assert.equal(checkFocusOrder('<div tabindex="3">x</div>').length, 1);
  assert.equal(checkFocusOrder('<div tabindex="0">x</div><div tabindex="-1">y</div>').length, 0);
});

// =============================================================================
// FORM LABELS (3.3.2)
// =============================================================================

test('unlabeled input fails; label-for, wrapping label and aria-label pass', () => {
  const document = doc(`
    <input type="text" name="orphan">
    <label for="name">Name</label><input id="name" type="text">
    <label>City <input type="text"></label>
    <input type="email" aria-label="Email">
  `);
  const findings = checkFormLabels(document);
  assert.equal(findings.filter((f) => f.severity === 'fail').length, 1);
  assert.ok(findings[0]?.message.includes('orphan'));
});

test('honeypot fields are exempt', () => {
  const document = doc('<input type="text" name="website" tabindex="-1" aria-hidden="true" autocomplete="off">');
  assert.equal(checkFormLabels(document).length, 0);
});

// =============================================================================
// ARIA USAGE + LINK TEXT (4.1.2 / 2.4.4)
// =============================================================================

test('icon-only button without accessible name fails; aria-label passes', () => {
  const failing = doc('<button><svg></svg></button>');
  assert.ok(checkAriaUsage(failing).some((f) => f.severity === 'fail'));

  const ok = doc('<button aria-label="Close"><svg></svg></button>');
  assert.equal(checkAriaUsage(ok).filter((f) => f.severity === 'fail').length, 0);
});

test('focusable element inside aria-hidden fails', () => {
  const document = doc('<div aria-hidden="true"><a href="/x">hidden link</a></div>');
  assert.ok(checkAriaUsage(document).some((f) => f.severity === 'fail'));
});

test('honeypot input (tabindex=-1) inside aria-hidden is exempt', () => {
  const document = doc('<div aria-hidden="true"><input type="text" name="website" tabindex="-1"></div>');
  assert.equal(checkAriaUsage(document).filter((f) => f.severity === 'fail').length, 0);
});

test('banned link text fails in all pilot languages', () => {
  for (const text of ['Click here', 'read more', 'skaityti daugiau', 'читать далее']) {
    const document = doc(`<a href="/x">${text}</a>`);
    assert.ok(
      checkAriaUsage(document).some((f) => f.rule === 'link-text'),
      `expected "${text}" to be flagged`,
    );
  }
});

test('role=button on div warns (prefer native)', () => {
  const document = doc('<div role="button" tabindex="0">Go</div>');
  assert.ok(checkAriaUsage(document).some((f) => f.severity === 'warn'));
});

// =============================================================================
// CONTRAST MATH (1.4.3 / 1.4.11 / 2.4.7)
// =============================================================================

test('luminance of black is 0 and white is 1', () => {
  assert.equal(relativeLuminance('#000000'), 0);
  assert.ok(Math.abs(relativeLuminance('#ffffff') - 1) < 1e-9);
});

test('black on white is 21:1', () => {
  assert.ok(Math.abs(contrastRatio('#000000', '#ffffff') - 21) < 1e-9);
});

test('AA thresholds apply per usage', () => {
  const ratio = contrastRatio('#767676', '#ffffff'); // ≈ 4.54 — classic AA boundary
  assert.ok(meetsWcagAA(ratio));
  assert.ok(meetsWcagAA(3.5, { largeText: true }));
  assert.ok(!meetsWcagAA(3.5)); // normal text needs 4.5
  assert.ok(meetsWcagAA(3.0, { nonText: true }));
});

// =============================================================================
// CRITERIA REGISTER
// =============================================================================

test('register covers the WCAG 2.2 A+AA set with statuses', () => {
  assert.ok(WCAG_22_AA.length >= 45); // 47 A+AA criteria in WCAG 2.2
  for (const criterion of WCAG_22_AA) {
    assert.match(criterion.sc, /^\d\.\d\.\d+$/);
    assert.ok(criterion.level === 'A' || criterion.level === 'AA');
    assert.ok(criterion.note.length > 0);
  }
  const counts = criteriaByStatus();
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  assert.equal(total, WCAG_22_AA.length);
});
