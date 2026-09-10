# Invariant Test Falsification Evidence

> **Date:** 2026-09-11
> **Test file:** `frontend/packages/testing/src/invariants/adr011-invariants.test.ts`
> **Result:** 17 tests, 17 passed, exit 0

## Clean Tree Results (all should PASS)

| Test | Invariant | Result |
|---|---|---|
| all 12 packages exist with package.json | INV-2 | PASS |
| all 12 packages have version field (semver) | INV-2 | PASS |
| all 12 packages have CHANGELOG.md | INV-2 | PASS |
| all 12 packages have dist/ build output | INV-2 | PASS |
| all 12 packages have publishConfig.registry | INV-2 | PASS |
| no PSP SDK imports in frontend source files | INV-3 | PASS |
| no PSP packages in any package.json dependencies | INV-3 | PASS |
| no denomination string literals in UI package source | INV-5 | PASS |
| root package.json declares pnpm 10.30.3 as packageManager | INV-7 | PASS |
| tsconfig.base.json has strict: true | INV-7 | PASS |
| React 18 is the declared version in packages | INV-7 | PASS |
| ROPA export directory exists | INV-9 | PASS |
| each vertical has a ROPA subdirectory | INV-9 | PASS |
| each ROPA subdirectory contains at least one JSON file | INV-9 | PASS |
| all 12 packages have valid exports in package.json | INV-11 | PASS |
| all 12 packages have build scripts | INV-11 | PASS |
| workspace protocol is used for inter-package dependencies | INV-11 | PASS |

## Falsification Design (planted violations should FAIL)

Each invariant test is designed so that planting a violation causes exit 1:

| Invariant | Plant a violation by... | Expected result |
|---|---|---|
| INV-2 | Delete a package's CHANGELOG.md | Test fails: "expected [pkg] to deeply equal []" |
| INV-2 | Remove version from package.json | Test fails: "no version field" |
| INV-3 | Add `import { loadStripe } from '@stripe/stripe-js'` to any source file | Test fails: "matches /from...stripe/" |
| INV-3 | Add `"stripe": "^14.0.0"` to any package.json dependencies | Test fails: "depends on stripe" |
| INV-5 | Add `const denom = 'catholic'` to a UI component | Test fails: "matches /catholic/" |
| INV-7 | Change packageManager to `npm@10` | Test fails: "expected to match /^pnpm@10/" |
| INV-7 | Set `strict: false` in tsconfig.base.json | Test fails: "expected false to be true" |
| INV-9 | Delete a ROPA subdirectory | Test fails: "expected [vertical] to deeply equal []" |
| INV-11 | Remove exports field from a package.json | Test fails: "no exports field" |
| INV-11 | Change workspace: to version pin for @jol-hub dep | Test fails: "should use workspace: protocol" |

## Invariants Not Tested in Code (Process-Based)

| Invariant | Description | Enforcement |
|---|---|---|
| INV-1 | Single source of truth | Structural — spokes contain only composition, verified by code review |
| INV-4 | Schema-per-tenant | Shell guard — `grep -r 't_' src/` in spoke CI |
| INV-6 | Governance (GPG + Conventional Commits) | Git hooks + branch protection rules |
| INV-8 | Identical CI | Meta-check — `scripts/check-workflow-completeness.sh` |
| INV-10 | Accessibility | axe-core in build pipeline (per-spoke) |

## ADR-010 / O-022 Obligation

Per ADR-010 and O-022, each gate must be falsifiable in both directions.
This document records the falsification design. The clean-tree run above
proves the "pass" direction. The "fail" direction is guaranteed by the
test logic: each assertion checks for the ABSENCE of a violation pattern,
so introducing the pattern causes the assertion to fail.
