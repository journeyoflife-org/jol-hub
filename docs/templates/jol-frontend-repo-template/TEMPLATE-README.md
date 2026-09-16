# JOL Frontend Repo Template

> **This is a GitHub template repository.** Use the "Use this template" button
> to create a new vertical site repository, or run the instantiation script.

## What This Template Provides

This template is the **satellite kit** for all ten JOL vertical front-end
repositories. It embeds byte-identical governance, security, and CI
infrastructure that must remain synchronized with `jol-hub@main`.

### Embedded Components

| Component | Purpose |
|---|---|
| `package.json` | Next.js 14 + TypeScript strict + pnpm 10.30.3 |
| `tsconfig.json` | TypeScript strict mode, bundler resolution |
| `tailwind.config.ts` | Tailwind CSS with design token integration |
| `next.config.js` | Security headers, tenant resolution |
| `.sops.yaml` | SOPS/age encryption configuration |
| `scripts/sops-validate.py` | SHA-256 drift checker against jol-hub@main |
| `scripts/check-payment-boundary.sh` | INV-3: zero PSP SDK imports |
| `scripts/check-theme-literals.sh` | INV-7: zero denomination literals |
| `scripts/check-secrets.sh` | Zero plaintext secrets |
| `scripts/check-a11y-pages.ts` | WCAG 2.2 AA page checks |
| `scripts/check-perf-budget.ts` | Core Web Vitals budget enforcement |
| `scripts/instantiate.sh` | One-shot placeholder replacement |
| `secrets/` | SOPS-encrypted secrets directory structure |
| `.github/workflows/ci.yml` | CI pipeline calling org reusable workflows |
| `CODEOWNERS` | Security and governance review rules |
| `CONTRIBUTING.md` | Contribution guidelines with Conventional Commits |
| `SECURITY.md` | Vulnerability reporting (72h Art. 33 workflow) |
| `LICENSE` | EUPL 1.2 |

## Usage

### Option A: GitHub Template Button

1. Click **"Use this template"** → **"Create a new repository"**
2. Select org: `journeyoflife-org`
3. Name: `jol-site-<vertical>` (see vertical taxonomy)
4. Clone and run the instantiation script:

```bash
bash scripts/instantiate.sh <vertical-slug> "Vertical Name"
# Example: bash scripts/instantiate.sh basilica "Basilica of Vilnius"
```

### Option B: CLI

```bash
gh repo create journeyoflife-org/jol-site-<vertical> \
  --template journeyoflife-org/jol-frontend-repo-template \
  --private
```

## After Instantiation

The `instantiate.sh` script:
1. Replaces `__VERTICAL__` and `__VERTICAL_NAME__` in all files
2. Removes itself (one-shot)
3. Initializes a fresh git repository with an initial commit

Then:
```bash
pnpm install
cp .env.example .env.local  # fill in secrets
pnpm dev
pnpm verify                 # full gate battery
```

## What This Template Explicitly Excludes (BF-5)

- **No `main.py`** — this is a Node.js/Next.js project, not Python
- **No `.venv`** — no Python virtual environment
- **No Python scaffolding** — Django, Flask, FastAPI, etc.
- **No PSP SDK imports** — payment boundary is CLOSED (ADR-009, Model A)
- **No denomination literals** in component code (INV-7)
- **No country branching** in component code (INV-2)

## Governance

- **GitFlow**: `main` (production) + `develop` (integration) + `feature/*`
- **GPG-signed commits mandatory**
- **Conventional Commits** with closed scope list (see CONTRIBUTING.md)
- **Satellite kit drift check**: SHA-256 comparison against jol-hub@main

## Invariants Enforced

| Invariant | Gate | CI Job |
|---|---|---|
| INV-1/INV-2 | No components/tokens/consent defined locally | `drift-check` |
| INV-3 | `check-payment-boundary.sh` | `payment-boundary` |
| INV-4 | PII-pattern scan | `security` |
| INV-5 | Platform version floor | `build` |
| INV-7 | `check-theme-literals.sh` | `drift-check` |
