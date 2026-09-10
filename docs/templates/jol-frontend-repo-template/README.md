# JOL __VERTICAL_NAME__ Front-End

> Vertical front-end for the Journey of Life platform, consuming `@jol-hub/*` shared packages.

## Overview

This repository is one of ten vertical front-ends in the JOL hub-and-spoke topology (ADR-011). It consumes shared platform packages from `@jol-hub/*` and renders tenant-specific content via the `[...slug]` catch-all route.

**Vertical:** `__VERTICAL__`
**Layout family:** `__LAYOUT_FAMILY__`
**Template:** `__TEMPLATE__`

## Quick Start

```bash
pnpm install
pnpm dev
```

## Gates

All artifacts must pass the full gate battery:

```bash
pnpm verify
```

This runs:
- `type-check` — TypeScript strict compilation
- `test` — Vitest unit tests
- `check-payment-boundary` — zero PSP SDK imports
- `check-theme-literals` — zero denomination literals in component code
- `check-secrets` — zero plaintext secrets

## Architecture

- **Framework:** Next.js 14 App Router
- **Language:** TypeScript strict
- **Styling:** Tailwind CSS + design tokens from `@jol-hub/ui`
- **i18n:** `@jol-hub/i18n` (lt, en, ru)
- **Tenant resolution:** `@jol-hub/tenant-resolver` (X-Tenant header or subdomain)
- **SEO:** `@jol-hub/seo` (JSON-LD, hreflang, sitemaps)
- **A11y:** `@jol-hub/a11y` (WCAG 2.2 AA)

## Satellite Kit

This repo includes the satellite kit (byte-identical across all spokes):
- `.sops.yaml` — SOPS/age encryption config
- `scripts/sops-validate.py` — secret validation
- `secrets/` — encrypted secrets structure

Drift check: CI compares `.sops.yaml` SHA-256 against `jol-hub@main`.

## Governance

- **License:** EUPL-1.2
- **Commits:** Conventional Commits with closed scope list
- **GPG:** Signed commits mandatory
- **Branch protection:** `main` requires 2 approvals

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## Security

See [SECURITY.md](./SECURITY.md).

## Deployment

Deploys to Proxmox VE 9.2 via immutable image tags. Rollback: redeploy previous tag.

---

**Part of the Journey of Life platform.** Ten verticals, one shared core, EU-wide reach.
