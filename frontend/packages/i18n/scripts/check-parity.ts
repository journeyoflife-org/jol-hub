/**
 * i18n key-parity check (STEP 4).
 *
 * Guarantees:
 *   1. lt / en / ru base catalogs have IDENTICAL key sets (missing or
 *      extra keys in any locale fail the build — no partial translations).
 *   2. Every vertical override (church/funeral/cleaning) contains the same
 *     locale set and identical keys per locale.
 *   3. Vertical override keys exist in the base catalog (overrides can
 *      only REPLACE existing strings, never invent new ones).
 *
 * Run: `pnpm i18n:check` (packages/i18n). Exits non-zero on mismatch.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const MESSAGES_DIR = join(__dirname, '../src/messages');
const VERTICALS_DIR = join(MESSAGES_DIR, 'verticals');

type Tree = { [key: string]: string | Tree };

function readJson(file: string): Tree {
  return JSON.parse(readFileSync(file, 'utf-8')) as Tree;
}

/** Flatten a nested object into sorted dot-paths (leaves only). */
function keyPaths(tree: Tree, prefix = ''): string[] {
  const paths: string[] = [];
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') paths.push(path);
    else if (value && typeof value === 'object') paths.push(...keyPaths(value, path));
  }
  return paths.sort();
}

function diff(reference: string[], candidate: string[]): { missing: string[]; extra: string[] } {
  const ref = new Set(reference);
  const cand = new Set(candidate);
  return {
    missing: reference.filter((key) => !cand.has(key)),
    extra: candidate.filter((key) => !ref.has(key)),
  };
}

let failures = 0;
const fail = (message: string): void => {
  failures += 1;
  console.error(`[FAIL] ${message}`);
};

console.log('JOL i18n — message key parity check');
console.log('='.repeat(70));

/* ------------------------------------------------------------------ */
/* 1. Base catalogs: lt is the reference                               */
/* ------------------------------------------------------------------ */

const baseLocales = readdirSync(MESSAGES_DIR)
  .filter((file) => file.endsWith('.json'))
  .map((file) => file.replace('.json', ''))
  .sort();

const baseKeys: Record<string, string[]> = {};
for (const locale of baseLocales) {
  baseKeys[locale] = keyPaths(readJson(join(MESSAGES_DIR, `${locale}.json`)));
  console.log(`base ${locale}: ${baseKeys[locale].length} keys`);
}

const referenceLocale = 'lt';
const referenceKeys = baseKeys[referenceLocale];
if (!referenceKeys) {
  fail(`Reference locale '${referenceLocale}' not found.`);
}

for (const locale of baseLocales) {
  if (locale === referenceLocale) continue;
  const { missing, extra } = diff(referenceKeys, baseKeys[locale]);
  for (const key of missing) fail(`${locale}.json missing key: ${key}`);
  for (const key of extra) fail(`${locale}.json has extra key: ${key}`);
}

/* ------------------------------------------------------------------ */
/* 2 + 3. Vertical overrides                                           */
/* ------------------------------------------------------------------ */

const verticalFiles = readdirSync(VERTICALS_DIR).filter((file) => file.endsWith('.json'));
if (verticalFiles.length === 0) {
  fail('No vertical override files found in messages/verticals/.');
}

for (const file of verticalFiles) {
  const vertical = file.replace('.json', '');
  const tree = readJson(join(VERTICALS_DIR, file));
  const locales = Object.keys(tree).sort();

  const localeDiff = diff(baseLocales, locales);
  for (const missing of localeDiff.missing) fail(`verticals/${file} missing locale: ${missing}`);
  for (const extra of localeDiff.extra) fail(`verticals/${file} has unknown locale: ${extra}`);

  const perLocaleKeys: Record<string, string[]> = {};
  for (const locale of locales) {
    perLocaleKeys[locale] = keyPaths(tree[locale] as Tree);
  }

  // Identical keys across locales within the vertical.
  for (const locale of locales) {
    if (locale === baseLocales[0]) continue;
    const { missing, extra } = diff(perLocaleKeys[baseLocales[0]], perLocaleKeys[locale]);
    for (const key of missing) fail(`verticals/${file} [${locale}] missing key: ${key}`);
    for (const key of extra) fail(`verticals/${file} [${locale}] has extra key: ${key}`);
  }

  // Every override key must exist in the base catalog (replace-only).
  for (const key of perLocaleKeys[locales[0]] ?? []) {
    if (!referenceKeys.includes(key)) {
      fail(`verticals/${file} overrides unknown key: ${key}`);
    }
  }

  console.log(`vertical ${vertical}: ${locales.length} locales, ${perLocaleKeys[locales[0]]?.length ?? 0} override keys`);
}

console.log('='.repeat(70));
if (failures > 0) {
  console.error(`${failures} parity problem(s) found.`);
  process.exit(1);
}
console.log('Key parity OK — all locales and verticals are consistent.');
