#!/usr/bin/env npx tsx
/**
 * Generate standard pages for all tenant fixtures.
 *
 * For each fixture in the registry, runs `generateTenantPages()` and
 * replaces the fixture's `pages` array with the generated output.
 * Writes updated JSON back to the fixture files.
 *
 * Usage: npx tsx scripts/generate-pages.ts
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { tenantFixtures } from '../src/registry';
import { generateTenantPages } from '../src/page-archetypes';
import { TenantFixtureSchema } from '../src/schema';

const FIXTURES_DIR = path.resolve(__dirname, '../src/fixtures/tenants');

/** Map fixture slugs back to their source JSON files. */
function buildSlugToFileMap(): Map<string, string> {
  const map = new Map<string, string>();
  const files = fs.readdirSync(FIXTURES_DIR).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const filePath = path.join(FIXTURES_DIR, file);
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (Array.isArray(raw)) {
      for (const fixture of raw) {
        if (fixture.slug) map.set(fixture.slug, file);
      }
    } else if (raw.slug) {
      map.set(raw.slug, file);
    }
  }
  return map;
}

function main() {
  const slugToFile = buildSlugToFileMap();

  // Group fixtures by source file.
  const fileGroups = new Map<string, (typeof tenantFixtures)[number][]>();
  for (const fixture of tenantFixtures) {
    const file = slugToFile.get(fixture.slug);
    if (!file) {
      console.error(`  WARNING: no source file found for slug "${fixture.slug}"`);
      continue;
    }
    const group = fileGroups.get(file) ?? [];
    group.push(fixture);
    fileGroups.set(file, group);
  }

  let totalPages = 0;
  let totalFixtures = 0;

  for (const [file, fixtures] of fileGroups) {
    const filePath = path.join(FIXTURES_DIR, file);
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    if (Array.isArray(raw)) {
      for (const fixture of fixtures) {
        const pages = generateTenantPages(fixture);
        const idx = raw.findIndex((r: { slug: string }) => r.slug === fixture.slug);
        if (idx >= 0) {
          raw[idx].pages = pages;
          totalPages += pages.length;
          totalFixtures++;
        }
      }
      fs.writeFileSync(filePath, JSON.stringify(raw, null, 2) + '\n', 'utf-8');
    } else {
      const fixture = fixtures[0];
      const pages = generateTenantPages(fixture);
      raw.pages = pages;
      totalPages += pages.length;
      totalFixtures++;
      fs.writeFileSync(filePath, JSON.stringify(raw, null, 2) + '\n', 'utf-8');
    }

    console.log(`  ✓ ${file} (${fixtures.length} fixture(s))`);
  }

  // Re-validate all fixtures after generation.
  console.log('\nRe-validating all fixtures...');
  for (const fixture of tenantFixtures) {
    const result = TenantFixtureSchema.safeParse(fixture);
    if (!result.success) {
      console.error(`  FAIL: ${fixture.slug} — ${result.error.message}`);
      process.exit(1);
    }
  }

  console.log(`\nDone: ${totalFixtures} fixtures, ${totalPages} pages generated.`);
}

main();
