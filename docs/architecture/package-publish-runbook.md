# Package Publish Runbook

> **Registry:** GitHub Packages (`https://npm.pkg.github.com`)
> **Scope:** 12 `@journeyoflife-org/*` packages in `frontend/packages/`
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
1. `@journeyoflife-org/a11y`
2. `@journeyoflife-org/auth`
3. `@journeyoflife-org/bitrix-sdk`
4. `@journeyoflife-org/commerce`
5. `@journeyoflife-org/i18n`
6. `@journeyoflife-org/observability`
7. `@journeyoflife-org/perf`
8. `@journeyoflife-org/seed-data`
9. `@journeyoflife-org/seo`

**Wave 1 (depend on Wave 0):**
10. `@journeyoflife-org/tenant-resolver` (depends on `seed-data`)
11. `@journeyoflife-org/ui` (depends on `i18n`)

**Wave 2 (depend on Wave 0 + Wave 1):**
12. `@journeyoflife-org/testing` (depends on `i18n`, `tenant-resolver`, `ui`)

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
pnpm add @journeyoflife-org/a11y @journeyoflife-org/seo @journeyoflife-org/ui

# Test imports
node -e "import('@journeyoflife-org/a11y').then(m => console.log('a11y OK:', Object.keys(m)))"
node -e "import('@journeyoflife-org/seo').then(m => console.log('seo OK:', Object.keys(m)))"
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
