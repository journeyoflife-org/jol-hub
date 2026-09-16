# Onboarding Runbook — ≤ 1 Working Day per Site

> **Version:** 1.0
> **Date:** 2026-09-11
> **Target:** ≤ 1 working day from entity data receipt to noindex deployment
> **Prerequisites:** Owner has provided entity data, GitHub org access, Proxmox access

## Pre-Onboarding Checklist (owner actions, before day starts)

- [ ] Entity data received (name, address, phone, email, vertical, jurisdiction)
- [ ] GitHub repo created at `journeyoflife-org/jol-site-{vertical}` (empty)
- [ ] DNS wildcard entry for `{tenant}.gyvenimo-kelias.lt` → pilot ingress IP
- [ ] TLS wildcard cert provisioned via ACME
- [ ] Tenant schema created in PostgreSQL (`CREATE SCHEMA IF NOT EXISTS {tenant_slug}`)

## Onboarding Steps

### Step 1: Scaffold (15 min)

```bash
# 1. Copy template
cp -a /opt/jol/repos/jol-hub/docs/templates/jol-frontend-repo-template/ \
  /opt/jol/repos/jol-site-{vertical}/

# 2. Instantiate
cd /opt/jol/repos/jol-site-{vertical}
bash scripts/instantiate.sh {vertical} "{Display Name}"

# 3. Verify zero placeholders
grep -rn '__VERTICAL__\|__VERTICAL_NAME__' . --include='*.ts' --include='*.tsx'
# Expected: no matches
```

### Step 2: Fixture (30 min)

```bash
# 1. Create fixture in jol-hub
# Copy closest existing fixture, edit with entity data
cp frontend/packages/seed-data/src/fixtures/tenants/{closest}.json \
   frontend/packages/seed-data/src/fixtures/tenants/{new-slug}.json

# 2. Add ru keys to all localized text objects
# Use /tmp/add-ru-keys.py pattern (script in session history)

# 3. Validate
cd frontend
pnpm --filter @journeyoflife-org/seed-data build
node -e "
const {TenantFixtureSchema} = require('./packages/seed-data/dist/index.js');
const d = require('./packages/seed-data/src/fixtures/tenants/{new-slug}.json');
console.log(TenantFixtureSchema.safeParse(d).success ? 'VALID' : 'INVALID');
"

# 4. Commit + push jol-hub
git add frontend/packages/seed-data/src/fixtures/tenants/{new-slug}.json
git commit -S -m "feat(seed-data): add {new-slug} fixture with 3-locale parity"
git push origin feat/pages-step6
```

### Step 3: Spoke Implementation (30 min)

```bash
# 1. Copy fixture to spoke
cp /opt/jol/repos/jol-hub/frontend/packages/seed-data/src/fixtures/tenants/{new-slug}.json \
   /opt/jol/repos/jol-site-{vertical}/src/fixtures/tenant.json

# 2. Copy lib files from basilica (identical across all spokes)
cp /opt/jol/repos/jol-site-basilica/src/lib/resolve-locale.ts \
   /opt/jol/repos/jol-site-{vertical}/src/lib/
cp /opt/jol/repos/jol-site-basilica/src/lib/json-ld.ts \
   /opt/jol/repos/jol-site-{vertical}/src/lib/
cp /opt/jol/repos/jol-site-basilica/src/lib/analytics.ts \
   /opt/jol/repos/jol-site-{vertical}/src/lib/

# 3. Create page.tsx from page spec template
# Use the Python template generator pattern from Task 4.1

# 4. Run gates
bash scripts/check-payment-boundary.sh   # INV-3
bash scripts/check-theme-literals.sh     # INV-7
bash scripts/check-secrets.sh
bash scripts/check-workflow-completeness.sh
python3 scripts/sops-validate.py --branch feat/pages-step6

# 5. Commit spoke
git add -A
git commit -m "feat(frontend): implement page package {NN} — {vertical} landing"
```

### Step 4: Prove (15 min)

```bash
# 1. Verify 3-locale parity
python3 -c "
import json
with open('src/fixtures/tenant.json') as f:
    fixture = json.load(f)
# ... locale check script
"

# 2. Verify TODO markers
grep -c 'TODO: verify with parish' src/fixtures/tenant.json

# 3. Verify a11y
grep -c '<h1' src/app/page.tsx
grep -c 'aria-label' src/app/page.tsx
```

### Step 5: Deploy (30 min, requires Proxmox access)

```bash
# 1. Configure remote
git remote add origin git@github.com:journeyoflife-org/jol-site-{vertical}.git

# 2. Push
git push -u origin main

# 3. Build Docker image
docker build -t ghcr.io/journeyoflife-org/jol-site-{vertical}:$(git rev-parse --short HEAD) .
docker push ghcr.io/journeyoflife-org/jol-site-{vertical}:$(git rev-parse --short HEAD)

# 4. Deploy to Proxmox (Kubernetes)
kubectl apply -f infra/kubernetes/networking/vertical-router.yaml
# Update deployment image tag

# 5. Smoke test
curl -I https://{tenant}.gyvenimo-kelias.lt/
# Expected: 200, X-Robots-Tag: noindex

# 6. Record rollback image tag
echo "Rollback tag: ghcr.io/journeyoflife-org/jol-site-{vertical}:{previous-sha}"
```

## Timing Summary

| Step | Time |
|---|---|
| Pre-onboarding (owner) | Before day starts |
| Step 1: Scaffold | 15 min |
| Step 2: Fixture | 30 min |
| Step 3: Implementation | 30 min |
| Step 4: Prove | 15 min |
| Step 5: Deploy | 30 min |
| **Total** | **~2 hours** |

## Rollback

Each spoke is independently reversible:
- **Code error:** `git revert <sha>` (never force-push)
- **Deploy error:** redeploy previous immutable image tag (seconds)
- **Content error:** `git revert` — forward-only correction

## Post-Onboarding

- [ ] Add to ISO A.5.9 asset register
- [ ] Add per-vertical ROPA record
- [ ] Configure Search Console property for `{tenant}.gyvenimo-kelias.lt`
- [ ] Set up IndexNow API key in spoke secrets
- [ ] Verify Lighthouse ≥ 90 mobile
- [ ] Verify breakpoints 360/768/1024/1440
