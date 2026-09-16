# ADR-011: Ten Vertical Front-Ends — Hub-and-Spoke Topology

---

## Status
Accepted — ratified by platform owner 2026-09-11 (DECISION-LOG D-062).

**Supersedes** ADR-002 (frontend extraction deferred) and DECISION-LOG
D-003 (extraction deferred until Wave 0 exit), D-004 (one renderer
confirmed). Those decisions remain on the log as historical record with
supersession annotations; they are never deleted (SOC 2 CC3.1, ISO 27001:2022
A.8.32).

**Amends** MASTER-PROMPT §9 (per-entity apps) — the scored matrix now
covers ten independently deployable spokes consuming shared packages, not
a single monorepo renderer. **Amends** MASTER-PROMPT §12 (no parallel
codebase) — satisfied by INV-1 (single source of truth) and INV-2
(versioned packages), not violated: all spoke code derives from the hub's
package source.

## Context

1. **The monorepo renderer is proven.** `frontend/apps/template-renderer`
   serves 32 pilot tenants across 11 verticals with lazy-loaded templates,
   config-driven tenant resolution, and tier-gated feature flags. The
   architecture works.

2. **The product requires independent deployability.** Ten separately-
   deployed vertical front-ends are the product: each vertical is a
   reusable professional template for all subsequent sites of that type,
   extensible from the LT pilot to LV, EE, and 27 EU countries.

3. **Packages are not yet publishable.** Zero of twelve `@journeyoflife-org/*`
   packages have a build step, `dist/` output, or `files` allowlist;
   eleven carry `"private": true`; all export raw `./src/*.ts`. This is
   the critical path (BF-3).

4. **No front-end repository template exists.** `jol-repo-template` is a
   Python scaffold. Scaffolding Next.js spokes from it produces the same
   category error already documented in Via-Vitae's CHANGELOG
   (`main.py` in a non-Python repository).

5. **The architecture document that caused this is stale.**
   `docs/architecture/system-overview.md` (March 2026) describes
   `frontend/react` SPAs, Vite, Redux, Kubernetes, CDN/Edge, S3, GitLab
   CI, OAuth 2.0, RPO < 15 min — none of which exist. Its "Future
   Considerations: microservices migration path" is the sentence that
   makes ten repositories look natural.

6. **Two Tier-1 trees, one brand tree.**
   - `/opt/jol` — Church Platform (jol-hub + satellites); EUPL-1.2
   - `/opt/jol-m` — Marketplace Tier-1 tree (sole PSP integrator); proprietary ARR
   - `/opt/viavitae/repos` — Via-Vitae brand/marketing tree (20 repos;
     proprietary ARR licence, Lithuanian law, Vilnius jurisdiction;
     Next 15/React 19; trunk-based + DCO; CODEOWNERS `@Via-Vitae/architects`;
     scope includes `jolarca.com`; WCAG 2.2 AA). Segregation rule
     analogous to MASTER-PROMPT §2.2: Via-Vitae never contains tenant
     data or Church Platform code.

## Decision

### Topology: hub-and-spoke

`jol-hub` remains the Tier-0 platform source, governance root, and
integration test-bed. Twelve `@journeyoflife-org/*` packages become published,
versioned artifacts consumed by ten spoke repositories under
`journeyoflife-org`. Each spoke contains **only** vertical composition
code — no shared logic, no duplicated packages.

### The ten spokes

| # | Repository | Canonical Vertical | Layout family |
|---|---|---|---|
| 1 | `jol-site-basilica` | `basilica` | sacred |
| 2 | `jol-site-cathedral` | `cathedral` | sacred |
| 3 | `jol-site-diocese` | `diocese` | administrative |
| 4 | `jol-site-deanery` | `deanery` | administrative |
| 5 | `jol-site-parish` | `church` | sacred |
| 6 | `jol-site-funeral` | `funeral` | memorial |
| 7 | `jol-site-cemetery-care` | `cemetery-cleaning` | memorial |
| 8 | `jol-site-protestant` | `protestant` | eastern |
| 9 | `jol-site-orthodox` | `orthodox` | eastern |
| 10 | `jol-site-other-church` | `other-church` | eastern |

**Diaconate descoped.** The canonical `Vertical` type includes `diaconate`
(11 values), but no diaconate tenants, ROPA records, or page packages
exist. MASTER-PROMPT §5 lists ten verticals including Diaconate but not
Deanery; the owner's ten include Deanery but not Diaconate. The owner's
list prevails. Diaconate remains in the canonical taxonomy as a dormant
vertical; adding a spoke for it later is a single-repo addition, not a
topology change.

### Eleven invariants

Each is enforced as a CI test (not review discipline), falsifiable in
both directions.

| # | Invariant | Enforcement |
|---|---|---|
| INV-1 | **Single source of truth.** All shared code lives in `jol-hub` packages; spokes contain only vertical composition | CI: no `@journeyoflife-org/*` source in spoke `src/` |
| INV-2 | **Versioned packages.** All 12 `@journeyoflife-org/*` packages published with semver, CHANGELOG, build artifacts | CI: `pnpm publish --dry-run` exit 0 per package |
| INV-3 | **Payment boundary CLOSED.** No PSP SDK imports in any spoke or package (ADR-009) | `scripts/check-payment-boundary.sh` layer 4 |
| INV-4 | **Schema-per-tenant.** Spokes never construct or reference tenant schemas directly (ADR-001) | CI: grep for `t_` schema literals in spoke source |
| INV-5 | **Theme vertical.** No denomination literals in component code (DS-THEME-01, O-022/D-059) | `scripts/check-theme-literals.sh` |
| INV-6 | **Governance.** GPG-signed commits, Conventional Commits with closed Appendix A scope list | CI: `git verify-commit` + commitlint |
| INV-7 | **Uniform stack.** Next.js 14, React 18, TypeScript strict, pnpm 10.30.3 only, Tailwind + design tokens | CI: `package.json` engine/dependency assertions |
| INV-8 | **Identical CI.** All spokes use the same reusable workflow from org `.github` | CI: workflow sha256 pin match |
| INV-9 | **GDPR Art. 9.** Every spoke has a ROPA record and DPIA before go-live | CI: ROPA dir existence check per spoke |
| INV-10 | **Accessibility.** WCAG 2.1 AA; axe-core exit 0 on every build | CI: `axe-core` in build pipeline |
| INV-11 | **Reversibility.** The topology collapses back to Variant A (monorepo) only while INV-1 through INV-4 hold | CI: package resolution test (spoke can resolve all `@journeyoflife-org/*` from hub workspace) |

### Accepted risk

**INV-7 residue: denomination literals in repository names.** The spoke
repository names `jol-site-protestant`, `jol-site-orthodox`, and
`jol-site-other-church` contain denomination/affiliation terms. These
are ungatable by `check-theme-literals.sh` (which scans component source
code, not repository names). O-022/D-059 established the precedent:
the gate covers component code, not infrastructure identifiers. Accepted
as a naming-convention limitation, not a technical violation.

### Reversibility condition

The topology collapses back to Variant A (single monorepo renderer)
**only while INV-1 through INV-4 hold.** If any spoke diverges its
package consumption (forks a package, vendors shared code, or bypasses
the registry), the spoke becomes an independent codebase and the
collapse is no longer mechanical. INV-11 is the early-warning test.

## Consequences

- **Positive:** Each vertical is independently deployable, versionable,
  and ownable. Package reuse is mechanical (registry install, not path
  dependency). CI blast radius is confined to one spoke per change.
- **Positive:** The monorepo renderer continues as the integration
  test-bed; Variant A remains achievable by collapsing the spokes.
- **Negative:** ~15–20 working days of platformisation work before the
  first spoke can be scaffolded (BF-3 package publishability is the
  critical path).
- **Negative:** Ten repositories multiply the governance surface
  (ten CHANGELOGs, ten ROPA records, ten DPIAs, ten satellite kits).
- **Negative:** Package versioning introduces a release coordination
  cost that the monorepo does not have.

## Alternatives Considered

1. **Variant A — one codebase, ten build targets.** Rejected per owner
   instruction. Delivers the same user-visible outcome in ~4–6 days
   but without independent deployability.
2. **Never extract — stay monorepo.** Rejected: violates the owner's
   product requirement for independently deployable vertical sites.
3. **Per-vertical monorepo apps (no separate repos).** Rejected: same
   objection as #2 — the owner requires separate repositories.

## Compliance

- **GDPR Art. 5(1)(b) / Art. 9**: each spoke processes data only for
  its vertical's specified purposes; ROPA records per spoke (INV-9).
- **SOC 2 CC3.1 / CC8.1**: topology change is change-controlled; ADR
  precedes implementation; superseded decisions annotated, not deleted.
- **ISO 27001:2022 A.8.32**: change management for repo reorganization;
  eleven invariants as fitness functions.
- **PCI-DSS SAQ A**: payment boundary stays CLOSED (INV-3); no spoke
  touches PSP surface.

## Annexes

### Annex A — Security
- Spokes inherit the hub's SOPS/age tiered recipient model.
- No spoke may contain secrets that the hub's scanner would flag.
- Gitleaks over full history at spoke creation (satellite kit precedent).

### Annex B — Compliance
- Each spoke requires its own ROPA record (Art. 30) before go-live.
- Each spoke requires its own DPIA (Art. 35) before go-live.
- The hub's DPIA covers the shared packages; spokes cover vertical-
  specific processing.

### Annex C — Cross-repo dependencies
- Spokes depend on `@journeyoflife-org/*` packages via the registry (not git
  submodules, not path dependencies).
- Package breaking changes require a semver major bump; spokes pin
  to major versions.
- The hub's `workspace:*` dependencies are rewritten to version ranges
  at publish time (standard pnpm behaviour).

### Annex D — Rollback
- Reverting this ADR means deleting the spoke repos and returning to
  the monorepo renderer. This is mechanical only while INV-1 through
  INV-4 hold (reversibility condition above).
- No spoke may contain data that does not also exist in the hub's
  tenant fixtures — this ensures rollback loses no information.
- The hub's template-renderer continues to serve as the fallback
  renderer throughout the spoke lifecycle.
