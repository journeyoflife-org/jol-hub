# Package Publish Runbook

> **Registry:** GitHub Packages (`https://npm.pkg.github.com`)
> **Scope:** 12 `@jol-hub/*` packages in `frontend/packages/`
> **Decision:** D-065 (2026-09-11). GitHub Packages chosen over Verdaccio
> for pilot speed; Verdaccio remains the fallback if EU-jurisdiction
> becomes a hard requirement.

## Prerequisites

1. **GitHub PAT** with `read:packages` + `write:packages` scopes.
2. **NPM_TOKEN** secret configured in the `journeyoflife-org` org.
3. **pnpm 10.30.3** (enforced by `packageManager` field).
4. **Node.js 20+** (tsup requires it for DTS generation).

## Automated Publish (Preferred)

The `Release` workflow (`.github/workflows/release.yml`) handles publishing:

1. Developer creates a changeset: `pnpm changeset`
2. Changeset file committed to PR.
3. PR merged → workflow creates "Version Packages" PR.
4. "Version Packages" PR merged → workflow builds + publishes.

**No manual steps required.** The workflow:
- Builds all packages in topological order (`pnpm build:packages`)
- Runs `changeset publish` (bumps versions, updates CHANGELOGs, publishes)
- Creates git tags for each published version

## Manual Publish (Fallback)

If the GitHub Action is unavailable:

```bash
# 1. Authenticate
export NPM_TOKEN=<your-pat>
echo "//npm.pkg.github.com/:_authToken=$NPM_TOKEN" > ~/.npmrc

# 2. Build all packages
cd /opt/jol/repos/jol-hub/frontend
pnpm build:packages

# 3. Publish in topological order
pnpm release
```

## Publish Order (Topological)

Packages must be published in dependency order:

**Wave 0 (leaves — no internal deps):**
1. `@jol-hub/a11y`
2. `@jol-hub/auth`
3. `@jol-hub/bitrix-sdk`
4. `@jol-hub/commerce`
5. `@jol-hub/i18n`
6. `@jol-hub/observability`
7. `@jol-hub/perf`
8. `@jol-hub/seed-data`
9. `@jol-hub/seo`

**Wave 1 (depend on Wave 0):**
10. `@jol-hub/tenant-resolver` (depends on `seed-data`)
11. `@jol-hub/ui` (depends on `i18n`)

**Wave 2 (depend on Wave 0 + Wave 1):**
12. `@jol-hub/testing` (depends on `i18n`, `tenant-resolver`, `ui`)

Changesets handles this automatically via `updateInternalDependencies: patch`.

## Verify a Publish

After publishing, verify from a clean external consumer:

```bash
# In a throwaway directory outside the workspace
mkdir /tmp/test-consumer && cd /tmp/test-consumer
pnpm init
echo "//npm.pkg.github.com/:_authToken=$NPM_TOKEN" > .npmrc
echo '@jol-hub:registry=https://npm.pkg.github.com' >> .npmrc

# Install each package
pnpm add @jol-hub/a11y @jol-hub/seo @jol-hub/ui

# Test imports
node -e "import('@jol-hub/a11y').then(m => console.log('a11y OK:', Object.keys(m)))"
node -e "import('@jol-hub/seo').then(m => console.log('seo OK:', Object.keys(m)))"
```

## Rollback

**Unpublishing is forbidden.** If a defect is found:

1. Fix the defect in the source.
2. Create a changeset with `patch` bump.
3. Publish the new version.
4. Spokes update to the new version.

The registry is append-only. Old versions remain available.

## Troubleshooting

### "402 Payment Required"

GitHub billing not restored. Wait for billing cycle or contact GitHub support.

### "401 Unauthorized"

NPM_TOKEN expired or lacks `write:packages` scope. Regenerate PAT.

### "Cannot publish over previously published version"

Version already exists. Bump the version number (changeset handles this).

### "EPERM: operation not permitted" on Windows

Use WSL2 or Linux. pnpm + tsup + symlinks require POSIX filesystem.

## Migration to Verdaccio (Future)

If EU-jurisdiction becomes mandatory:

1. Provision Proxmox LXC container.
2. Deploy `verdaccio/verdaccio` Docker image.
3. Configure storage on PBS-backed dataset.
4. Set up HA pair + allowlisted upstream proxy.
5. Update `.npmrc` to point to Verdaccio URL.
6. Republish all packages to Verdaccio.
7. Update spoke repositories to consume from Verdaccio.

**Rollback:** Revert `.npmrc` to GitHub Packages. Both registries can coexist during migration.
