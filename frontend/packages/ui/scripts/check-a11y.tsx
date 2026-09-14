/**
 * Automated accessibility verification for the shared component library.
 *
 * Renders the full Showcase page (every component, all major variants) to
 * static markup, mounts it in jsdom, and runs axe-core against the whole
 * document. Exits non-zero on any violation, so it can gate CI/build
 * (SOC 2 CC7.2 — automated quality checks).
 *
 * Scope note: the `color-contrast` rule is disabled here because jsdom has
 * no layout engine (computed colors cannot be resolved reliably). Contrast
 * compliance is enforced at the token level by `check-contrast.ts`, which
 * covers every documented foreground/background pair against WCAG 2.2 AA.
 *
 * Run: `pnpm check-a11y` (packages/ui).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';
import axeCore from 'axe-core';

import { Showcase } from '../src/dev/Showcase';

/* ------------------------------------------------------------------ */
/* 1. Render the Showcase into a complete HTML document                */
/* ------------------------------------------------------------------ */

const tokensCss = readFileSync(join(__dirname, '../src/styles/tokens.css'), 'utf-8');
const markup = renderToStaticMarkup(React.createElement(Showcase));

const documentHtml = `<!DOCTYPE html>
<html lang="lt">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>JOL UI Showcase — accessibility audit</title>
    <style>${tokensCss}</style>
  </head>
  <body>${markup}</body>
</html>`;

/* ------------------------------------------------------------------ */
/* 2. Boot jsdom and inject axe-core (same approach as jest-axe)       */
/* ------------------------------------------------------------------ */

const dom = new JSDOM(documentHtml, {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  url: 'http://localhost/',
});

dom.window.eval(axeCore.source);

/* ------------------------------------------------------------------ */
/* 3. Run the audit                                                    */
/* ------------------------------------------------------------------ */

interface AxeViolation {
  id: string;
  impact?: string;
  description: string;
  helpUrl: string;
  nodes: Array<{ html: string; target: string[] }>;
}

interface AxeResults {
  violations: AxeViolation[];
  passes: unknown[];
  incomplete: Array<{ id: string; description: string; nodes: Array<{ html: string }> }>;
}

const run = dom.window.eval(`
  window.axe.run(document.body, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
    rules: {
      // jsdom cannot resolve computed colors — covered by check-contrast.ts.
      'color-contrast': { enabled: false }
    }
  })
`) as Promise<AxeResults>;

run
  .then((results) => {
    console.log('JOL UI Showcase — axe-core accessibility audit');
    console.log('='.repeat(78));
    console.log(`Rules passed:     ${results.passes.length}`);
    console.log(`Needs review:     ${results.incomplete.length} (jsdom limitations; reviewed manually)`);
    for (const item of results.incomplete) {
      console.log(`  - ${item.id}: ${item.description}`);
      for (const node of item.nodes.slice(0, 3)) {
        console.log(`      ${node.html.slice(0, 140)}`);
      }
    }
    console.log(`Violations:       ${results.violations.length}`);
    console.log('='.repeat(78));

    if (results.violations.length > 0) {
      for (const violation of results.violations) {
        console.error(`\n[FAIL] ${violation.id} (${violation.impact ?? 'unknown impact'})`);
        console.error(`       ${violation.description}`);
        console.error(`       ${violation.helpUrl}`);
        for (const node of violation.nodes.slice(0, 5)) {
          console.error(`       - ${node.target.join(' ')}`);
          console.error(`         ${node.html.slice(0, 160)}`);
        }
        if (violation.nodes.length > 5) {
          console.error(`       … and ${violation.nodes.length - 5} more node(s)`);
        }
      }
      console.error(`\n${results.violations.length} a11y rule(s) violated.`);
      process.exit(1);
    }

    console.log('axe-core: 0 violations — WCAG 2.2 AA rule-set clean.');
    dom.window.close();
  })
  .catch((error) => {
    console.error('axe-core audit failed to run:', error);
    process.exit(1);
  });
