---
kind: dependency_management
name: Multi-Ecosystem Dependency Management with Pinned Lockfiles, Changesets, and Dependabot
category: dependency_management
scope:
    - '**'
source_files:
    - backend/django/requirements.txt
    - backend/requirements.txt
    - data/requirements.txt
    - tools/requirements-mcp.txt
    - frontend/package.json
    - frontend/pnpm-workspace.yaml
    - frontend/.npmrc
    - frontend/packages/ui/package.json
    - .github/dependabot.yml
    - docs/architecture/package-versioning-policy.md
    - data/tests/test_dependency_guard.py
---

# Dependency Management in JOL-HUB Platform Monorepo

## Systems and Tools

The repository manages dependencies across four distinct ecosystems, each with its own manifest, lockfile, and update strategy:

- **Python (backend)**: `backend/django/requirements.txt` is the canonical pinned lockfile (92 fully pinned packages including Django 6.0.3, Celery 5.6.3, etc.). A loose `backend/requirements.txt` provides minimum version constraints (`django>=6.0,<7.0`, etc.) used only for Docker builds; the comment explicitly states the canonical pins live in `django/requirements.txt`. The data pipeline has its own `data/requirements.txt` (pandas, Airflow, dbt, Great Expectations) and `tools/requirements-mcp.txt` for MCP servers.
- **Node.js (frontend monorepo)**: Uses pnpm 10.30.3 declared via `packageManager` in `frontend/package.json`, a pnpm workspace (`pnpm-workspace.yaml`) covering `apps/*` and `packages/*`, a root `pnpm-lock.yaml`, and Turborepo for orchestration. Shared libraries live under `frontend/packages/` (a11y, auth, bitrix-sdk, commerce, i18n, observability, perf, seed-data, seo, tenant-resolver, testing, ui), all published as `@jol-hub/*` scoped packages.
- **Terraform**: Managed under `infra/terraform`; Dependabot watches this directory.
- **GitHub Actions**: Root-level actions are watched by Dependabot separately from application code.

## Key Files

| File | Role |
|---|---|
| `backend/django/requirements.txt` | Canonical pinned Python lockfile (single source of truth for backend runtime) |
| `backend/requirements.txt` | Loose constraint file for Docker base image builds |
| `data/requirements.txt` | Data pipeline / ETL dependency manifest |
| `tools/requirements-mcp.txt` | MCP server tooling dependencies |
| `frontend/package.json` | Root workspace manifest declaring pnpm engine, scripts, devDependencies |
| `frontend/pnpm-workspace.yaml` | Workspace membership (`apps/*`, `packages/*`) |
| `frontend/.npmrc` | Routes `@jol-hub/*` to GitHub Packages registry (`https://npm.pkg.github.com`) |
| `frontend/packages/*/package.json` | Individual package manifests with `publishConfig.registry` pointing at GitHub Packages |
| `.github/dependabot.yml` | Centralized automated update policy per ecosystem |
| `docs/architecture/package-versioning-policy.md` | Authoritative policy for `@jol-hub/*` package versioning, changesets, and CHANGELOGs |
| `data/tests/test_dependency_guard.py` | Enforced guard against importing Stripe SDK into hub codebase |

## Architecture and Conventions

### Python dependency pinning
Backend dependencies are fully pinned to exact versions in `backend/django/requirements.txt` (e.g., `Django==6.0.3`, `celery==5.6.3`, `cryptography==46.0.5`). This eliminates transitive drift between environments. The loose `backend/requirements.txt` intentionally uses `>=` ranges so Docker can build without the full lockfile, but the comment marks it as non-canonical — production installs should use the pinned file.

### Frontend monorepo layout
All shared UI/logic lives in `frontend/packages/` as `@jol-hub/*` npm packages. Internal cross-package references use pnpm's workspace protocol (`"@jol-hub/i18n": "workspace:*"` in `packages/ui/package.json`). External peer dependencies (react, react-dom, next) are declared in `peerDependencies` rather than regular `dependencies`, letting consuming apps resolve a single copy.

### Private registry
`frontend/.npmrc` maps the `@jol-hub` scope to GitHub Packages (`https://npm.pkg.github.com`). Each package's `publishConfig.registry` repeats this URL with `access: restricted`. Authentication is via an `NPM_TOKEN` PAT with `read:packages, write:packages` scopes.

### Versioning and release process
Per `docs/architecture/package-versioning-policy.md`:
- All `@jol-hub/*` packages start at `1.0.0` (platform floor). Spokes must pin `^1.0.0` or higher — never `*`, never `workspace:*` when consumed externally.
- Semantic Versioning 2.0.0 is enforced through Changesets: major/minor/patch bumps require corresponding `.changeset/*.md` files.
- Every version bump must include a CHANGELOG entry in the same commit; CI blocks merges that lack one.
- Internal dependency updates are auto-bumped by Changesets (`updateInternalDependencies: patch`).
- Publishing is append-only: unpublishing and force-publishing without a changeset are prohibited.

### Automated updates
`.github/dependabot.yml` configures weekly Monday-at-06:00 Europe/Vilnius scans for pip (backend), npm (frontend), terraform, github-actions, and docker images. Updates are grouped (e.g., `django`, `security`, `react`, `radix`, `tailwind`) and limited to minor/patch unless manually reviewed. Major version bumps for Django, DRF, Next.js, React, and React-DOM are ignored by default, requiring manual review.

### Enforcement beyond manifests
`data/tests/test_dependency_guard.py` enforces ADR-0005 (Model A payment boundary): it asserts that no `stripe` distribution is installed, no requirements manifest declares `stripe`, and `import stripe` raises `ImportError`. Adding the Stripe SDK back requires amending the ADR — not a PR — making this a hard architectural invariant checked in CI.

## Conventions and Constraints

- **Canonical Python lockfile**: `backend/django/requirements.txt` is the single source of truth for backend dependencies; `backend/requirements.txt` is a Docker-only loose constraint overlay.
- **Workspace-local internal deps**: Cross-package references inside `frontend/packages/` use `workspace:*`; external consumers pin `^1.0.0+` from the private registry.
- **Peer dependencies for framework libs**: Packages like `@jol-hub/ui` declare `react`, `react-dom`, and `next` as `peerDependencies` to avoid duplication across apps.
- **Private registry for scoped packages**: All `@jol-hub/*` packages resolve to GitHub Packages; local development relies on pnpm workspaces, publishing switches to the remote registry.
- **Dependabot groups and ignore rules**: Major version upgrades for core frameworks (Django, DRF, Next.js, React) are blocked from auto-PRs and require manual review.
- **Changesets required for every publish**: No version bump without a `.changeset` and CHANGELOG entry; CI enforces this.
- **Append-only registry**: Unpublishing is forbidden; rollbacks mean publishing a new patched version.
- **Payment boundary invariant**: The `stripe` Python SDK must never be present in the hub environment; enforced by both a pytest guard and a shell script (`scripts/check-payment-boundary.sh`).