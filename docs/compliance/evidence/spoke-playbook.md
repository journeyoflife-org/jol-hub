# Spoke Playbook — Repeatable Recipe for 10 Vertical Sites

> **Version:** 1.0 (proven on `jol-site-basilica`)
> **Date:** 2026-09-11
> **Governing plan:** `docs/superpowers/plans/2026-09-11-ten-vertical-frontends.md`
> **Target:** Phase 4 — batch the remaining 9 spokes

## Prerequisites

- `jol-frontend-repo-template` exists at `docs/templates/jol-frontend-repo-template/` in jol-hub
- Reusable CI workflows published to `journeyoflife-org/.github`
- 12 `@jol-hub/*` packages built and publishable
- GitHub org `journeyoflife-org` with repo creation permissions
- GPG signing configured
- **Never** create repos in the `JourneyOfLife` personal account (Art. 9 data prohibition)

## Phase A — Scaffold (Task 3.1 pattern)

### A1. Delete the empty shell

```bash
# Each spoke has an empty local shell at /opt/jol/repos/jol-site-<vertical>
# Verify it has 0 commits, 0 remotes before deleting:
cd /opt/jol/repos/jol-site-<vertical>
git log --oneline 2>&1  # should say "does not have any commits yet"
git remote -v            # should be empty

# Remove all contents including .git:
rm -rf /opt/jol/repos/jol-site-<vertical>
```

### A2. Copy the template

```bash
cp -a /opt/jol/repos/jol-hub/docs/templates/jol-frontend-repo-template/. \
  /opt/jol/repos/jol-site-<vertical>/
```

### A3. Instantiate (one-shot placeholder replacement)

```bash
cd /opt/jol/repos/jol-site-<vertical>
bash scripts/instantiate.sh <vertical-slug> "<Vertical Display Name>"
# Example: bash scripts/instantiate.sh cathedral "Cathedral of Vilnius"
```

This replaces `__VERTICAL__` and `__VERTICAL_NAME__` in 6 files, removes itself, and creates the initial git commit.

### A4. Verify instantiation

```bash
# Zero remaining placeholders:
grep -rn '__VERTICAL__\|__VERTICAL_NAME__' . --include='*.ts' --include='*.tsx' --include='*.json' --include='*.md'
# Expected: no matches (exit 1)

# BF-5 exclusion — no Python scaffolding:
find . -name 'main.py' -o -name '.venv' -o -name '*.py' | grep -v scripts/
# Expected: no matches
```

### A5. Run satellite kit drift check

```bash
python3 scripts/sops-validate.py --branch <current-hub-branch>
# Expected: 3/3 OK, exit 0
```

### A6. Run all shell gates

```bash
bash scripts/check-workflow-completeness.sh  # INV-6: 5/5 workflows
bash scripts/check-payment-boundary.sh       # INV-3: no PSP imports
bash scripts/check-theme-literals.sh         # INV-7: no denomination literals
bash scripts/check-secrets.sh                # no plaintext secrets
# All expected: PASS, exit 0
```

### A7. Create GitHub repo and push

```bash
# 1. Create repo at journeyoflife-org/jol-site-<vertical> via GitHub UI
# 2. Configure remote:
git remote add origin git@github.com:journeyoflife-org/jol-site-<vertical>.git
# 3. Push:
git push -u origin main
# 4. Configure branch protection:
#    - main: 2 approvals required, GPG-signed commits mandatory
#    - develop: 1 approval required
```

## Phase B — Implement the vertical (Task 3.2 pattern)

### B1. Update the fixture in jol-hub

Edit `frontend/packages/seed-data/src/fixtures/tenants/<tenant-slug>.json`:
- Add `ru` keys to ALL existing localized text
- Add new block types from the page spec (massSchedule, sacramentList, clergyRoleList, gallery, visitingInfo, mapLocation)
- Mark unverified liturgical facts: `[TODO: verify with parish/diocese — do not publish unverified]`
- **Never** include clergy names (GDPR Art. 9 — from RLS API only)
- Mass schedule uses `startDate` (Event JSON-LD), NOT `openingHoursSpecification`

### B2. Validate the fixture

```bash
cd /opt/jol/repos/jol-hub/frontend
node -e "
const { TenantFixtureSchema } = require('./packages/seed-data/dist/index.js');
const fixture = require('./packages/seed-data/src/fixtures/tenants/<tenant-slug>.json');
const result = TenantFixtureSchema.safeParse(fixture);
console.log(result.success ? 'VALID' : 'INVALID: ' + JSON.stringify(result.error.issues));
"
# Expected: VALID
```

### B3. Rebuild seed-data

```bash
cd /opt/jol/repos/jol-hub/frontend
pnpm --filter @jol-hub/seed-data build
```

### B4. Create spoke page components

In the spoke repo, create:
- `src/fixtures/tenant.json` — copy of the jol-hub fixture
- `src/lib/resolve-locale.ts` — 3-locale resolution with anti-silent-fallback
- `src/lib/json-ld.ts` — Church entity + Event + BreadcrumbList builders
- `src/lib/analytics.ts` — consent-gated analytics events
- `src/app/page.tsx` — full wireframe from the page spec

**Critical constraints:**
- `src/app/` and `src/components/` must NOT contain denomination literals (INV-7)
- Use `src/lib/` for JSON-LD builders (not scanned by gate)
- Use `src/fixtures/` for fixture data (not scanned by gate)
- All images must have `alt` text (WCAG 1.1.1)
- All sections must have `aria-label`
- Use Tailwind responsive classes for breakpoints (360/768/1024/1440)

### B5. Run gates again

```bash
bash scripts/check-payment-boundary.sh   # INV-3
bash scripts/check-theme-literals.sh     # INV-7
# Both expected: PASS
```

### B6. Commit spoke

```bash
cd /opt/jol/repos/jol-site-<vertical>
git add -A
git commit -m "feat(frontend): implement page package <NN> — <vertical> landing"
```

### B7. Commit jol-hub

```bash
cd /opt/jol/repos/jol-hub
git add frontend/packages/seed-data/src/fixtures/tenants/<tenant-slug>.json
git commit -S -m "feat(seed-data): add <tenant-slug> fixture with 3-locale parity"
git push origin feat/pages-step6
```

## Phase C — Prove the spoke (Task 3.3 pattern)

### C1. Run full gate battery

```bash
# Shell gates (all must exit 0):
bash scripts/check-payment-boundary.sh
bash scripts/check-theme-literals.sh
bash scripts/check-secrets.sh
bash scripts/check-workflow-completeness.sh
python3 scripts/sops-validate.py --branch <hub-branch>

# Hub invariants:
cd /opt/jol/repos/jol-hub/frontend/packages/testing
npx vitest run src/invariants/adr011-invariants.test.ts
# Expected: 17/17 PASS
```

### C2. Verify 3-locale parity

```bash
python3 -c "
import json
with open('src/fixtures/tenant.json') as f:
    fixture = json.load(f)
def find(obj, path='root'):
    r = []
    if isinstance(obj, dict):
        if 'lt' in obj and isinstance(obj.get('lt'), str):
            r.append((path, list(obj.keys())))
        else:
            for k, v in obj.items():
                r.extend(find(v, f'{path}.{k}'))
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            r.extend(find(v, f'{path}[{i}]'))
    return r
texts = find(fixture)
missing = [(p, k) for p, k in texts if 'ru' not in k or 'en' not in k]
print(f'Total: {len(texts)}, Missing locale: {len(missing)}')
print('PASS' if not missing else 'FAIL')
"
# Expected: 0 missing, PASS
```

### C3. Verify a11y acceptance

Check for: DS-A11Y-01 (html lang), DS-A11Y-03 (main landmark), DS-A11Y-07 (skip-nav), WCAG 1.1.1 (img alt), hreflang links, canonical link, JSON-LD scripts.

### C4. Verify TODO markers

```bash
grep -c 'TODO: verify with parish' src/fixtures/tenant.json
# Expected: > 0 for any fixture with unverified facts
```

### C5. Write evidence document

Create `docs/compliance/evidence/spoke-proof-<vertical>-<date>.md` in jol-hub with:
- Gate results table
- Locale parity count
- A11y checklist
- TODO marker count
- Deferred items (Lighthouse, breakpoints, deploy)

### C6. Deploy (when packages are published)

```bash
# 1. pnpm install in spoke
# 2. pnpm build
# 3. Lighthouse >= 90 mobile
# 4. Breakpoint check at 360/768/1024/1440
# 5. Deploy to Proxmox with noindex
# 6. Smoke test
# 7. Record rollback image tag
```

## Vertical Table (Phase 4 batch)

| Page pkg | Vertical slug | Display name | Layout family | Accent |
|---|---|---|---|---|
| 04 | cathedral | Cathedral | sacred | gold |
| 05 | diocese | Diocese | administrative | primary |
| 06 | deanery | Deanery | administrative | primary |
| 07 | church | Parish | sacred | gold |
| 11 | funeral | Funeral | memorial | gray-400 |
| 12 | cemetery-care | Cemetery Care | memorial | liturgical-green |
| 08 | protestant | Protestant | congregation | green |
| 09 | orthodox | Orthodox | eastern | purple |
| 10 | other-church | Other Church | sacred | gold |

## Rollback

Each spoke is independently reversible:
- **Code error:** `git revert <sha>` (never force-push)
- **Deploy error:** redeploy previous immutable image tag (seconds)
- **Content error:** `git revert` — forward-only correction

## Invariants Protected

| INV | What it prevents | Gate |
|---|---|---|
| INV-1 | Spoke defining shared components | Code review |
| INV-3 | PSP SDK imports in spoke | `check-payment-boundary.sh` |
| INV-6 | Spoke silently skipping a gate | `check-workflow-completeness.sh` |
| INV-7 | Denomination literals in components | `check-theme-literals.sh` |
| INV-9 | Missing ROPA records | Hub invariant tests |

## Timing Estimate

Per spoke: ~2-3 hours (scaffold 15 min, implement 1-1.5 hr, prove 30 min)
Phase 4 total (9 spokes): ~4-5 days with parallel execution
