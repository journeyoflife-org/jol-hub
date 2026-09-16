# Reusable CI Workflows — Publishing Guide

> **Decision:** Task 2.7 (2026-09-11). Five reusable workflows authored as
> `workflow_call` consumers. Spoke repos call them via org `.github`.

## Architecture

```
journeyoflife-org/.github/.github/workflows/
├── frontend-build.yml          # Build + type-check + lint
├── frontend-test.yml           # Unit + a11y + security tests
├── security-scan.yml           # Gitleaks + SCA + drift check
├── payment-boundary-guard.yml  # INV-3 PSP boundary (ADR-009)
└── compliance-check.yml        # INV-7 theme literals + perf budgets

Each spoke's .github/workflows/ci.yml (~15 lines):
┌──────────────────────────────────────────────────────────┐
│  build:       uses: .../frontend-build.yml@main          │
│  test:        uses: .../frontend-test.yml@main           │
│  security:    uses: .../security-scan.yml@main           │
│  payment:     uses: .../payment-boundary-guard.yml@main  │
│  compliance:  uses: .../compliance-check.yml@main        │
│  drift-check: (local sops-validate.py)                   │
└──────────────────────────────────────────────────────────┘
```

## INV-6 Enforcement

A spoke **cannot silently skip a gate**. The meta-check script
(`scripts/check-workflow-completeness.sh`) verifies all 5 required workflow
calls are present in the spoke's `ci.yml`. This runs as part of the
satellite kit drift check.

## Staging Location

Workflows are staged at `docs/templates/reusable-workflows/` within jol-hub.
They are **not** directly deployed — they must be published to the org
`.github` repo.

## Publishing

### Prerequisites

```bash
# Clone the org .github repo (one-time)
git clone git@github.com:journeyoflife-org/.github.git /opt/jol/repos/.github
```

### Publish Command

```bash
cd /opt/jol/repos/jol-hub
bash docs/templates/reusable-workflows/publish.sh
```

This copies all 5 workflows to `/opt/jol/repos/.github/.github/workflows/`,
commits with GPG signature, and reports the push command.

### Push

```bash
cd /opt/jol/repos/.github
git push origin main
```

## Workflow Inputs

All workflows accept optional inputs:

| Input | Default | Description |
|---|---|---|
| `node-version` | `'20'` | Node.js version |
| `pnpm-version` | `'10.30.3'` | pnpm version |

Security scan additionally accepts:

| Input | Default | Description |
|---|---|---|
| `hub-repo` | `'journeyoflife-org/jol-hub'` | Hub repo for drift check |
| `hub-branch` | `'main'` | Branch to compare against |

## Secrets

All workflows accept `NPM_TOKEN` (optional) for GitHub Packages authentication
when installing `@journeyoflife-org/*` packages.

## Updating Workflows

1. Edit the staged copies in `docs/templates/reusable-workflows/`
2. Run `publish.sh` to sync to org `.github`
3. Push the org `.github` repo
4. All 10 spokes pick up the changes on next CI run (they reference `@main`)

## Spoke CI File

The template provides a pre-built `ci.yml` at:
`docs/templates/jol-frontend-repo-template/.github/workflows/ci.yml`

This is embedded in every spoke via the template instantiation.
