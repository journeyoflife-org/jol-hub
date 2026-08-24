/**
 * Hardcoded-string scanner (STEP 4).
 *
 * Flags user-visible string literals that bypass the message catalog:
 *   1. JSX text nodes containing letters (Latin incl. Baltic diacritics,
 *      Cyrillic) — e.g. `<button>Send</button>`
 *   2. Literal `aria-label` / `alt` / `placeholder` / `title` attributes
 *      containing letters — e.g. `aria-label="Close"`
 *
 * Scope (the STEP 3/4 shared library + the multi-tenant renderer):
 *   packages/ui/src/components/{primitives,composite,layout,accessibility,
 *                               locale-switcher}
 *   packages/ui/src/lib
 *   apps/template-renderer/src
 *
 * Deliberate exclusions (documented in packages/i18n/README.md):
 *   - any `dev` directory (verification surfaces render sample tenant content)
 *   - `*.types.ts` (type declarations only)
 *   - LEGACY flat components in packages/ui/src/components/*.{tsx}
 *     (service-schedule, photo-gallery, donation/, contact-form.tsx, ...) —
 *     deprecated parish-template/master-site surfaces, scheduled for
 *     removal with those apps (ADR-002). They carry pre-i18n English copy.
 *
 * Lines already routed through translation (`t(`, `translate(`,
 * IntlMessageFormat) and non-rendered code (imports, console) are exempt.
 * Exits non-zero on any finding — gate this in CI.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const FRONTEND_ROOT = join(__dirname, '../../..');

const TARGET_DIRS = [
  'packages/ui/src/components/primitives',
  'packages/ui/src/components/composite',
  'packages/ui/src/components/layout',
  'packages/ui/src/components/accessibility',
  'packages/ui/src/components/locale-switcher',
  'packages/ui/src/lib',
  'apps/template-renderer/src',
];

const SKIP_DIR_PARTS = new Set(['node_modules', '.next', 'dist', 'dev', '.turbo']);

function collectFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (!SKIP_DIR_PARTS.has(entry)) results.push(...collectFiles(full));
    } else if (/\.(tsx|ts)$/.test(entry) && !entry.endsWith('.types.ts')) {
      results.push(full);
    }
  }
  return results;
}

/** Letters that indicate human-readable content (not code identifiers alone). */
const HUMAN_LETTERS = /[A-Za-zĄČĘĖĮŠŲŪŽąčęėįšųūžА-яЁё]{2,}/;

/** JSX text between tags: >text< (no nested tags/expressions inside). */
const JSX_TEXT = />\s*([^<>{}]+?)\s*</g;

/** Literal user-visible attributes. */
const LITERAL_ATTR = /(aria-label|alt|placeholder|title)="([^"]*)"/g;

interface Finding {
  file: string;
  line: number;
  kind: string;
  text: string;
}

const findings: Finding[] = [];

/** Lines that are exempt because they route through the i18n pipeline. */
function isTranslated(line: string): boolean {
  return (
    line.includes('t(') ||
    line.includes('translate(') ||
    line.includes('IntlMessageFormat') ||
    line.includes('formatKey(')
  );
}

function isNonRendered(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.startsWith('import ') ||
    trimmed.startsWith('export type') ||
    trimmed.startsWith('console.') ||
    trimmed.startsWith('*') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('/*')
  );
}

for (const target of TARGET_DIRS) {
  const root = join(FRONTEND_ROOT, target);
  for (const file of collectFiles(root)) {
    const lines = readFileSync(file, 'utf-8').split('\n');
    lines.forEach((rawLine, index) => {
      if (isNonRendered(rawLine) || isTranslated(rawLine)) return;

      for (const match of rawLine.matchAll(JSX_TEXT)) {
        const text = match[1].trim();
        // Ignore TypeScript syntax that mimics >text< (return types,
        // generics): `): Promise<void>` etc.
        if (/^[):;,=]/.test(text) || /[(:,=]$/.test(text)) continue;
        if (text.length >= 2 && HUMAN_LETTERS.test(text)) {
          findings.push({
            file: relative(FRONTEND_ROOT, file),
            line: index + 1,
            kind: 'jsx-text',
            text,
          });
        }
      }

      for (const match of rawLine.matchAll(LITERAL_ATTR)) {
        const value = match[2];
        if (HUMAN_LETTERS.test(value)) {
          findings.push({
            file: relative(FRONTEND_ROOT, file),
            line: index + 1,
            kind: `${match[1]} attribute`,
            text: value,
          });
        }
      }
    });
  }
}

console.log('JOL i18n — hardcoded string scan');
console.log('='.repeat(70));
console.log(`Scanned scopes:\n  ${TARGET_DIRS.join('\n  ')}`);
console.log('='.repeat(70));

if (findings.length > 0) {
  for (const finding of findings) {
    console.error(`[FAIL] ${finding.file}:${finding.line} (${finding.kind})`);
    console.error(`       ${finding.text.slice(0, 120)}`);
  }
  console.error(`\n${findings.length} hardcoded user-visible string(s) found.`);
  console.error('Move them to packages/i18n/src/messages/ and use t()/translate().');
  process.exit(1);
}

console.log('No hardcoded user-visible strings — all copy flows through the catalog.');
