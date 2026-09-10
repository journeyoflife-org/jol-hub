# Package Versioning Policy

> **Authoritative decision:** ADR-011 (2026-09-11), INV-5. This document
> locks the versioning baseline for all `@jol-hub/*` platform packages.

## Baseline

All 12 `@jol-hub/*` packages start at **`1.0.0`** as of 2026-09-11.

This is the **platform version floor** (INV-5). No package may be published
at a version below `1.0.0`. Spoke repositories consuming these packages
must pin to `^1.0.0` or higher — never `*`, never `workspace:*`.

## Versioning Scheme

All packages follow **Semantic Versioning 2.0.0**:

- **MAJOR** — breaking API change (export removed, signature changed,
  type narrowed). Requires a changeset with `major` bump.
- **MINOR** — backward-compatible feature addition (new export, new
  optional parameter). Requires a changeset with `minor` bump.
- **PATCH** — backward-compatible bug fix. Requires a changeset with
  `patch` bump.

## CHANGELOG Requirement

Every version bump **must** include a CHANGELOG entry in the same commit.
A version bump without a CHANGELOG update is a **review blocker** (PR
cannot be merged).

CHANGELOGs follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
format with sections: `Added`, `Changed`, `Deprecated`, `Removed`,
`Fixed`, `Security`.

## Changesets Workflow

Version management is handled by [Changesets](https://github.com/changesets/changesets).

### Developer workflow

1. Make a change to a package.
2. Run `pnpm changeset` and answer the prompts (which packages changed,
   what kind of bump, description of the change).
3. Commit the generated `.changeset/<random-name>.md` file.
4. Push and create a PR.

### Release workflow

1. The `Release` GitHub Action detects pending changesets.
2. It creates (or updates) a "Version Packages" PR that:
   - Bumps versions in all affected `package.json` files.
   - Updates CHANGELOGs.
   - Deletes the consumed changeset files.
3. When the PR is merged, the action:
   - Builds all packages (`pnpm build:packages`).
   - Publishes to the registry (`pnpm release`).

### Manual release (fallback)

If the GitHub Action is unavailable:

```bash
cd frontend
pnpm version          # bumps versions + updates CHANGELOGs
pnpm release          # builds + publishes
git add -A
git commit -m "chore: version packages"
git push
```

## Internal Dependencies

When package A depends on package B, and B is bumped, A's dependency
on B is updated automatically by Changesets (`updateInternalDependencies: patch`).

If A's public API exposes types from B, A receives a **patch** bump
even if A's own code did not change.

## Prohibited Actions

- **Unpublishing** a published version is **forbidden**. If a defect
  is found, publish a patched version. The registry is append-only.
- **Force-publishing** without a changeset is **forbidden**. Every
  version must have a traceable changeset file.
- **Skipping CHANGELOG** is **forbidden**. The CI workflow fails if
  a version bump lacks a CHANGELOG entry.

## Rollback

Reverting a version bump means publishing a new version that reverts
the change. **Never unpublish.** The registry is append-only (ADR-011
consequences §4).
