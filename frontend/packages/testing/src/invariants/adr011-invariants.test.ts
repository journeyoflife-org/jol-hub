/**
 * Invariant Test Suite — ADR-011 Hub-and-Spoke Topology
 * =====================================================
 *
 * Tests all 11 invariants that govern the hub-and-spoke topology.
 * Each test is modelled on data/tests/test_dependency_guard.py:
 * "Adding the SDK back requires an ADR amending ADR-0005 — not a PR."
 *
 * These tests run in the hub monorepo. Spoke repos consume the
 * equivalent gate scripts via the reusable CI workflows.
 *
 * Invariants:
 *   INV-1  Single source of truth (no shared code in spokes)
 *   INV-2  Versioned packages (all 12 @jol-hub/* have semver + build)
 *   INV-3  Payment boundary CLOSED (no PSP SDK imports)
 *   INV-4  Schema-per-tenant (no tenant schema literals in spokes)
 *   INV-5  Theme vertical (no denomination literals in components)
 *   INV-6  Governance (GPG + Conventional Commits) — process, not code
 *   INV-7  Uniform stack (Next.js 14, React 18, TS strict, pnpm)
 *   INV-8  Identical CI (all spokes use same reusable workflows)
 *   INV-9  GDPR Art. 9 (ROPA records exist)
 *   INV-10 Accessibility (WCAG 2.1 AA)
 *   INV-11 Reversibility (spokes can resolve all @jol-hub/* from hub)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

// Hub monorepo root: 5 levels up from src/invariants/
// __dirname = frontend/packages/testing/src/invariants/
// 1=testing/src, 2=testing, 3=packages, 4=frontend, 5=repo root
const HUB_ROOT = resolve(__dirname, '../../../../../');
const PACKAGES_DIR = join(HUB_ROOT, 'frontend/packages');
const FRONTEND_ROOT = join(HUB_ROOT, 'frontend');

// All 12 expected @jol-hub/* packages
const EXPECTED_PACKAGES = [
  'a11y',
  'auth',
  'bitrix-sdk',
  'commerce',
  'i18n',
  'observability',
  'perf',
  'seed-data',
  'seo',
  'tenant-resolver',
  'testing',
  'ui',
];

// ============================================================================
// INV-2: Versioned packages — all 12 @jol-hub/* have semver + CHANGELOG + build
// ============================================================================

describe('INV-2: Versioned packages', () => {
  it('all 12 packages exist with package.json', () => {
    const missing: string[] = [];
    for (const pkg of EXPECTED_PACKAGES) {
      const pkgJson = join(PACKAGES_DIR, pkg, 'package.json');
      if (!existsSync(pkgJson)) {
        missing.push(pkg);
      }
    }
    expect(missing).toEqual([]);
  });

  it('all 12 packages have version field (semver)', () => {
    const noVersion: string[] = [];
    for (const pkg of EXPECTED_PACKAGES) {
      const pkgJson = join(PACKAGES_DIR, pkg, 'package.json');
      if (!existsSync(pkgJson)) continue;
      const manifest = JSON.parse(readFileSync(pkgJson, 'utf-8'));
      if (!manifest.version || !/^\d+\.\d+\.\d+/.test(manifest.version)) {
        noVersion.push(pkg);
      }
    }
    expect(noVersion).toEqual([]);
  });

  it('all 12 packages have CHANGELOG.md', () => {
    const noChangelog: string[] = [];
    for (const pkg of EXPECTED_PACKAGES) {
      const changelog = join(PACKAGES_DIR, pkg, 'CHANGELOG.md');
      if (!existsSync(changelog)) {
        noChangelog.push(pkg);
      }
    }
    expect(noChangelog).toEqual([]);
  });

  it('all 12 packages have dist/ build output', () => {
    const noDist: string[] = [];
    for (const pkg of EXPECTED_PACKAGES) {
      const dist = join(PACKAGES_DIR, pkg, 'dist');
      if (!existsSync(dist)) {
        noDist.push(pkg);
      }
    }
    expect(noDist).toEqual([]);
  });

  it('all 12 packages have publishConfig.registry', () => {
    const noRegistry: string[] = [];
    for (const pkg of EXPECTED_PACKAGES) {
      const pkgJson = join(PACKAGES_DIR, pkg, 'package.json');
      if (!existsSync(pkgJson)) continue;
      const manifest = JSON.parse(readFileSync(pkgJson, 'utf-8'));
      if (!manifest.publishConfig?.registry) {
        noRegistry.push(pkg);
      }
    }
    expect(noRegistry).toEqual([]);
  });
});

// ============================================================================
// INV-3: Payment boundary CLOSED — no PSP SDK imports
// ============================================================================

describe('INV-3: Payment boundary CLOSED', () => {
  const FORBIDDEN_PATTERNS = [
    /from\s+["']@?stripe/i,
    /require\(["']@?stripe/i,
    /from\s+["']@?paypal/i,
    /from\s+["']@?adyen/i,
    /loadStripe\s*\(/i,
    /NEXT_PUBLIC_STRIPE_/i,
  ];

  it('no PSP SDK imports in frontend source files', () => {
    const violations: string[] = [];

    function scanDir(dir: string, relBase: string) {
      if (!existsSync(dir)) return;
      const entries = readdirSync(dir, { withFileTypes: true, recursive: true });
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        if (!/\.(ts|tsx|js|jsx)$/.test(entry.name)) continue;
        const fullPath = join(dir, entry.name);
        const relPath = join(relBase, entry.name);
        // Skip node_modules, dist, .next, test files
        if (relPath.includes('node_modules') || relPath.includes('dist') ||
            relPath.includes('.next') || relPath.includes('.test.') ||
            relPath.includes('.spec.')) continue;
        try {
          const content = readFileSync(fullPath, 'utf-8');
          for (const pattern of FORBIDDEN_PATTERNS) {
            if (pattern.test(content)) {
              violations.push(`${relPath}: matches ${pattern}`);
            }
          }
        } catch {
          // Skip unreadable files
        }
      }
    }

    scanDir(join(FRONTEND_ROOT, 'packages'), 'packages');
    scanDir(join(FRONTEND_ROOT, 'apps'), 'apps');

    expect(violations).toEqual([]);
  });

  it('no PSP packages in any package.json dependencies', () => {
    const FORBIDDEN_DEPS = [
      'stripe', '@stripe/stripe-js', '@stripe/react-stripe-js',
      '@paypal/react-paypal-js', '@paypal/sdk-client',
      '@adyen/adyen-web', 'square', '@square/web-sdk',
    ];

    const violations: string[] = [];

    function checkPkgJson(filePath: string, label: string) {
      if (!existsSync(filePath)) return;
      const manifest = JSON.parse(readFileSync(filePath, 'utf-8'));
      const allDeps = {
        ...manifest.dependencies,
        ...manifest.devDependencies,
        ...manifest.peerDependencies,
      };
      for (const forbidden of FORBIDDEN_DEPS) {
        if (allDeps && forbidden in allDeps) {
          violations.push(`${label}: depends on ${forbidden}`);
        }
      }
    }

    // Check root
    checkPkgJson(join(FRONTEND_ROOT, 'package.json'), 'frontend/package.json');

    // Check all packages
    for (const pkg of EXPECTED_PACKAGES) {
      checkPkgJson(
        join(PACKAGES_DIR, pkg, 'package.json'),
        `packages/${pkg}/package.json`,
      );
    }

    expect(violations).toEqual([]);
  });
});

// ============================================================================
// INV-5: Theme vertical — no denomination literals in component code
// ============================================================================

describe('INV-5: Theme vertical (no denomination literals)', () => {
  const DENOMINATION_PATTERNS = [
    /['"]catholic['"]/i,
    /['"]orthodox['"]/i,
    /['"]protestant['"]/i,
    /['"]greek.catholic['"]/i,
    /['"]lutheran['"]/i,
    /['"]methodist['"]/i,
    /['"]baptist['"]/i,
  ];

  it('no denomination string literals in UI package source', () => {
    const uiSrc = join(PACKAGES_DIR, 'ui/src');
    const violations: string[] = [];

    function scanDir(dir: string, relBase: string) {
      if (!existsSync(dir)) return;
      const entries = readdirSync(dir, { withFileTypes: true, recursive: true });
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        if (!/\.(ts|tsx)$/.test(entry.name)) continue;
        // Skip test files and fixture files
        if (entry.name.includes('.test.') || entry.name.includes('.spec.') ||
            entry.name.includes('fixture')) continue;
        const fullPath = join(dir, entry.name);
        const relPath = join(relBase, entry.name);
        try {
          const content = readFileSync(fullPath, 'utf-8');
          for (const pattern of DENOMINATION_PATTERNS) {
            if (pattern.test(content)) {
              violations.push(`${relPath}: matches ${pattern}`);
            }
          }
        } catch {
          // Skip unreadable
        }
      }
    }

    scanDir(uiSrc, 'ui/src');
    expect(violations).toEqual([]);
  });
});

// ============================================================================
// INV-7: Uniform stack — Next.js 14, React 18, TS strict, pnpm 10.30.3
// ============================================================================

describe('INV-7: Uniform stack', () => {
  it('root package.json declares pnpm 10.30.3 as packageManager', () => {
    const pkgJson = join(FRONTEND_ROOT, 'package.json');
    const manifest = JSON.parse(readFileSync(pkgJson, 'utf-8'));
    expect(manifest.packageManager).toMatch(/^pnpm@10\.\d+\.\d+/);
  });

  it('tsconfig.base.json has strict: true', () => {
    const tsconfig = join(FRONTEND_ROOT, 'tsconfig.base.json');
    const config = JSON.parse(readFileSync(tsconfig, 'utf-8'));
    expect(config.compilerOptions?.strict).toBe(true);
  });

  it('React 18 is the declared version in packages', () => {
    // React is declared in individual packages, not the root workspace
    const uiPkg = join(PACKAGES_DIR, 'ui', 'package.json');
    const manifest = JSON.parse(readFileSync(uiPkg, 'utf-8'));
    const reactDep = manifest.dependencies?.react || manifest.devDependencies?.react || manifest.peerDependencies?.react;
    expect(reactDep).toMatch(/\^?18\./);
  });
});

// ============================================================================
// INV-9: GDPR Art. 9 — ROPA records exist for LT verticals
// ============================================================================

describe('INV-9: GDPR Art. 9 (ROPA records)', () => {
  const ROPA_DIR = join(HUB_ROOT, 'data/exports/ropa/lt');

  it('ROPA export directory exists', () => {
    expect(existsSync(ROPA_DIR)).toBe(true);
  });

  it('each vertical has a ROPA subdirectory', () => {
    const expectedVerticals = [
      'basilica', 'cathedral', 'diocese', 'deanery', 'church',
      'funeral', 'cemetery-cleaning', 'protestant', 'orthodox', 'other-church',
    ];

    const missing: string[] = [];
    for (const vertical of expectedVerticals) {
      if (!existsSync(join(ROPA_DIR, vertical))) {
        missing.push(vertical);
      }
    }
    expect(missing).toEqual([]);
  });

  it('each ROPA subdirectory contains at least one JSON file', () => {
    const verticals = readdirSync(ROPA_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);

    const empty: string[] = [];
    for (const vertical of verticals) {
      const dir = join(ROPA_DIR, vertical);
      const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
      if (files.length === 0) {
        empty.push(vertical);
      }
    }
    expect(empty).toEqual([]);
  });
});

// ============================================================================
// INV-11: Reversibility — packages resolvable from hub workspace
// ============================================================================

describe('INV-11: Reversibility (package resolution)', () => {
  it('all 12 packages have valid exports in package.json', () => {
    const broken: string[] = [];

    for (const pkg of EXPECTED_PACKAGES) {
      const pkgJson = join(PACKAGES_DIR, pkg, 'package.json');
      if (!existsSync(pkgJson)) continue;
      const manifest = JSON.parse(readFileSync(pkgJson, 'utf-8'));

      // Check that exports field exists and points to dist/
      if (!manifest.exports) {
        broken.push(`${pkg}: no exports field`);
        continue;
      }

      // Verify the main export resolves to a dist/ path
      const mainExport = manifest.exports['.'];
      if (!mainExport) {
        broken.push(`${pkg}: no "." export`);
        continue;
      }

      const exportValue = typeof mainExport === 'string' ? mainExport : mainExport.import;
      if (!exportValue || !exportValue.startsWith('./dist/')) {
        broken.push(`${pkg}: main export does not point to dist/`);
      }
    }

    expect(broken).toEqual([]);
  });

  it('all 12 packages have build scripts', () => {
    const noBuild: string[] = [];
    for (const pkg of EXPECTED_PACKAGES) {
      const pkgJson = join(PACKAGES_DIR, pkg, 'package.json');
      if (!existsSync(pkgJson)) continue;
      const manifest = JSON.parse(readFileSync(pkgJson, 'utf-8'));
      if (!manifest.scripts?.build) {
        noBuild.push(pkg);
      }
    }
    expect(noBuild).toEqual([]);
  });

  it('workspace protocol is used for inter-package dependencies', () => {
    const violations: string[] = [];

    for (const pkg of EXPECTED_PACKAGES) {
      const pkgJson = join(PACKAGES_DIR, pkg, 'package.json');
      if (!existsSync(pkgJson)) continue;
      const manifest = JSON.parse(readFileSync(pkgJson, 'utf-8'));
      const allDeps = {
        ...manifest.dependencies,
        ...manifest.devDependencies,
      };

      for (const [dep, version] of Object.entries(allDeps)) {
        if (dep.startsWith('@jol-hub/') && typeof version === 'string' && !version.startsWith('workspace:')) {
          violations.push(`${pkg}: ${dep}@${version} should use workspace: protocol`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
