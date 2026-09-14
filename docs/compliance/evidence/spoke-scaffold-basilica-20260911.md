# Spoke Scaffold Evidence — jol-site-basilica

> **Date:** 2026-09-11
> **Template:** `jol-frontend-repo-template` (Task 2.6)
> **Vertical:** `basilica` — Basilica of Vilnius Cathedral
> **Repository:** `journeyoflife-org/jol-site-basilica`
> **Initial commit:** `94ee21e` (30 files, 1245 insertions)

## Step 1: Template Instantiation

- Copied `jol-frontend-repo-template` to `/opt/jol/repos/jol-site-basilica`
- Ran `bash scripts/instantiate.sh basilica "Basilica of Vilnius Cathedral"`
- 6 files updated with placeholder replacements:
  - `README.md`, `package.json`, `.env.example`, `CONTRIBUTING.md`
  - `src/app/page.tsx`, `src/app/layout.tsx`
- `instantiate.sh` and `TEMPLATE-README.md` removed (one-shot)

## Step 2: BF-5 Exclusion Verified

- Old empty shell contained Python scaffolding (`main.py`, `.venv/`, `.idea/`)
- All removed before template copy — no BF-5 leakage

## Step 3: Satellite Kit Drift Check

```
Satellite kit drift check against journeyoflife-org/jol-hub@feat/pages-step6

  OK:      .sops.yaml
  OK:      scripts/sops-validate.py
  OK:      secrets/README.md

PASS: satellite kit is byte-identical to hub.
EXIT=0
```

**Note:** Drift checker was updated to:
1. Map spoke-local paths to `docs/templates/jol-frontend-repo-template/` remote paths
2. Use GitHub API (`api.github.com/repos/.../contents/`) instead of `raw.githubusercontent.com`
   (raw CDN caches stale content for hours after push)

## Step 4: Gate Battery

| Gate | Invariant | Result |
|---|---|---|
| Workflow completeness (INV-6) | All 5 reusable workflows present | PASS |
| Payment boundary (INV-3) | No PSP SDK imports | PASS |
| Theme literals (INV-7) | No denomination/country literals | PASS |
| Secrets scan | No plaintext secrets | PASS |
| Drift check | Satellite kit byte-identical | PASS |

## Step 5: Placeholder Audit

```
grep -rn '__VERTICAL__\|__VERTICAL_NAME__' → EXIT=1 (no matches)
```

All placeholders replaced. Zero residual.

## Files in Spoke Repository

```
.editorconfig
.env.example
.github/workflows/ci.yml
.gitignore
.sops.yaml
CHANGELOG.md
CODEOWNERS
CONTRIBUTING.md
LICENSE
README.md
SECURITY.md
next.config.js
package.json
postcss.config.js
scripts/check-a11y-pages.ts
scripts/check-payment-boundary.sh
scripts/check-perf-budget.ts
scripts/check-secrets.sh
scripts/check-theme-literals.sh
scripts/check-workflow-completeness.sh
scripts/sops-validate.py
secrets/README.md
secrets/encrypted/common/.gitkeep
secrets/encrypted/critical/.gitkeep
secrets/encrypted/production/.gitkeep
src/app/globals.css
src/app/layout.tsx
src/app/page.tsx
tailwind.config.ts
tsconfig.json
```

## Pending (requires owner action)

- **GitHub repo creation:** `journeyoflife-org/jol-site-basilica` must be created via GitHub UI
- **Remote configuration:** `git remote add origin git@github.com:journeyoflife-org/jol-site-basilica.git`
- **Initial push:** `git push -u origin main`
- **Branch protection:** `main` 2 approvals, `develop` 1 approval (per CONTRIBUTING §4)
- **Drift check default branch:** Change `--branch` default from `feat/pages-step6` to `main` after template merge
