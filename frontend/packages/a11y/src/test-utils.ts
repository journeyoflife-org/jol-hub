/**
 * Audit runner — STEP 12.
 *
 * Boots jsdom on a full HTML document, injects axe-core (same approach as
 * jest-axe), runs the WCAG 2.2 AA rule set, and layers the structural
 * checkers (headings, alt text, focus order, form labels, ARIA/link text)
 * on top. Returns ONE {@link A11yReport} per surface so gates can fail the
 * build on any `fail` finding.
 *
 * PERFORMANCE NOTE (spec): full-page audits are limited to CRITICAL pages —
 * each jsdom+axe run costs a few seconds; component coverage comes from the
 * ui showcase gate which audits every component in one document.
 */
import { JSDOM } from 'jsdom';
import axeCore from 'axe-core';

import { buildAxeOptions } from './axe-config';
import { checkAltText } from './checkers/alt-text';
import { checkAriaUsage } from './checkers/aria-usage';
import { checkFocusOrder } from './checkers/focus-order';
import { checkFormLabels } from './checkers/form-labels';
import { checkHeadingHierarchy } from './checkers/heading-hierarchy';
import { hasFailures, type A11yFinding, type A11yReport } from './types';

interface AxeViolation {
  id: string;
  impact?: string;
  description: string;
  helpUrl: string;
  tags: string[];
  nodes: Array<{ html: string; target: string[] }>;
}

interface AxeResults {
  violations: AxeViolation[];
  passes: unknown[];
  incomplete: Array<{ id: string; description: string }>;
}

/** Map an axe rule id to its primary WCAG tag (best-effort display). */
function wcagFromTags(tags: string[]): string {
  const sc = tags.find((tag) => /^wcag\d+aa?$/.test(tag));
  return sc ? sc.replace('wcag', 'WCAG ').toUpperCase() : 'best-practice';
}

export interface AuditOptions {
  /** Label/URL shown in the report. */
  target?: string;
  /** Skip the DOM checkers (axe only). */
  axeOnly?: boolean;
}

/**
 * Audit one HTML document. `html` must be a FULL document (`<!DOCTYPE html>…`)
 * or a body fragment (wrapped automatically).
 */
export async function auditHtml(html: string, options: AuditOptions = {}): Promise<A11yReport> {
  const target = options.target ?? 'inline-document';
  const documentHtml = /<html[\s>]/i.test(html)
    ? html
    : `<!DOCTYPE html><html lang="lt"><head><meta charset="utf-8"/><title>${target}</title></head><body>${html}</body></html>`;

  const dom = new JSDOM(documentHtml, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'http://localhost/',
  });
  dom.window.eval(axeCore.source);

  const axeOptions = buildAxeOptions();
  const axeResults = (await dom.window.eval(
    `window.axe.run(document, ${JSON.stringify(axeOptions)})`,
  )) as AxeResults;

  const violations: A11yFinding[] = [];
  for (const violation of axeResults.violations) {
    violations.push({
      rule: violation.id,
      wcag: wcagFromTags(violation.tags),
      severity: 'fail',
      message: `${violation.description} (${violation.impact ?? 'unknown impact'}) — ${violation.helpUrl} [${violation.nodes.length} node(s)]`,
      snippet: violation.nodes[0]?.html.slice(0, 140),
    });
  }

  const warnings: A11yFinding[] = [];
  if (!options.axeOnly) {
    const checkerFindings = [
      ...checkHeadingHierarchy(documentHtml),
      ...checkAltText(documentHtml),
      ...checkFocusOrder(documentHtml),
      ...checkFormLabels(dom.window.document),
      ...checkAriaUsage(dom.window.document),
    ];
    for (const finding of checkerFindings) {
      (finding.severity === 'fail' ? violations : warnings).push(finding);
    }
  }

  dom.window.close();

  return {
    target,
    violations,
    warnings,
    axePasses: axeResults.passes.length,
    axeIncomplete: axeResults.incomplete.length,
  };
}

/** Human-readable one-page report. */
export function formatReport(report: A11yReport): string {
  const lines: string[] = [];
  lines.push(`a11y audit: ${report.target}`);
  lines.push('-'.repeat(72));
  lines.push(`axe rules passed: ${report.axePasses}   needs review: ${report.axeIncomplete}`);
  lines.push(`violations: ${report.violations.length}   warnings: ${report.warnings.length}`);
  for (const finding of report.violations) {
    lines.push(`  [FAIL] (${finding.wcag}) ${finding.rule}: ${finding.message}`);
    if (finding.snippet) lines.push(`         ${finding.snippet}`);
  }
  for (const finding of report.warnings) {
    lines.push(`  [warn] (${finding.wcag}) ${finding.rule}: ${finding.message}`);
  }
  return lines.join('\n');
}

/** Throw when the report carries any FAIL finding (CI gate helper). */
export function assertCleanAudit(report: A11yReport): void {
  if (hasFailures(report)) {
    throw new Error(
      `WCAG 2.2 AA audit failed for ${report.target} — ${report.violations.length} violation(s):\n${formatReport(report)}`,
    );
  }
}
