/**
 * Exports integrity test — every package.json export must resolve to an
 * existing file. Catches dangling exports (e.g. deleted component trees
 * whose package.json entry was not cleaned up).
 *
 * Precedent: data/tests/test_dependency_guard.py (policy-as-code guard).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const PKG_ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..', '..');
const pkg = JSON.parse(readFileSync(resolve(PKG_ROOT, 'package.json'), 'utf8'));

test('package.json exports: every ./src/ target must exist on disk', () => {
  const exports = pkg.exports ?? {};
  const dangling: string[] = [];

  for (const [key, value] of Object.entries(exports)) {
    const targets = Array.isArray(value) ? value : [value];
    for (const target of targets) {
      if (typeof target !== 'string') continue;
      if (!target.startsWith('./src/')) continue;
      // Skip wildcard exports — they are pattern matches, not literal paths
      if (target.includes('*')) continue;
      const absolute = resolve(PKG_ROOT, target);
      if (!existsSync(absolute)) {
        dangling.push(`${key} → ${target}`);
      }
    }
  }

  assert.deepEqual(
    dangling,
    [],
    `Dangling exports found (target files do not exist): ${dangling.join(', ')}. ` +
      'Remove the export entry or restore the file.'
  );
});
