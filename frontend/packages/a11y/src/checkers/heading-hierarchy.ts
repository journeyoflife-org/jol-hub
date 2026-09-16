/**
 * Heading hierarchy checker — STEP 12 (WCAG 1.3.1, 2.4.6).
 *
 * Rules:
 *   - exactly ONE `<h1>` per page (the page title);
 *   - no skipped levels on the way DOWN (h1 → h3 is a violation; h3 → h2
 *     back up is fine — section boundaries legitimately close).
 *
 * Pure string scan (no DOM dependency) — headings are extracted in document
 * order, which matches what screen readers traverse.
 */
import type { A11yFinding } from '../types';

const HEADING_RE = /<h([1-6])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi;

/** Strip nested tags and collapse whitespace for readable messages. */
function textOf(inner: string): string {
  return inner.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function checkHeadingHierarchy(html: string): A11yFinding[] {
  const findings: A11yFinding[] = [];
  const levels: Array<{ level: number; text: string }> = [];

  for (const match of html.matchAll(HEADING_RE)) {
    levels.push({ level: Number(match[1]), text: textOf(match[3] ?? '') });
  }

  const h1Count = levels.filter((heading) => heading.level === 1).length;
  if (h1Count === 0) {
    findings.push({
      rule: 'heading-hierarchy',
      wcag: '2.4.6',
      severity: 'fail',
      message: 'Page has no <h1> — every page needs exactly one (the page title).',
    });
  } else if (h1Count > 1) {
    findings.push({
      rule: 'heading-hierarchy',
      wcag: '1.3.1',
      severity: 'fail',
      message: `Page has ${h1Count} <h1> elements — keep exactly one.`,
    });
  }

  for (let i = 1; i < levels.length; i += 1) {
    const prev = levels[i - 1];
    const current = levels[i];
    // A descent may go at most one level deeper.
    if (current && prev && current.level > prev.level + 1) {
      findings.push({
        rule: 'heading-hierarchy',
        wcag: '1.3.1',
        severity: 'fail',
        message: `Heading level skipped: <h${prev.level}> → <h${current.level}> ("${current.text.slice(0, 60)}").`,
      });
    }
  }

  // Descriptive headings: flag empty heading text (styling-only headings).
  for (const heading of levels) {
    if (heading.text.length === 0) {
      findings.push({
        rule: 'heading-hierarchy',
        wcag: '2.4.6',
        severity: 'fail',
        message: `Empty <h${heading.level}> — headings must describe content, not style.`,
      });
    }
  }

  return findings;
}
