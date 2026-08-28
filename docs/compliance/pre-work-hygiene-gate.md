# Pre-Work Hygiene Gate — jol-hub Repository Baseline

> Compliance: SOC 2 CC6.1/CC7.2 · ISO 27001:2022 A.8.24/A.8.32 · GDPR Art. 32
> Blocking gate for MASTER-PROMPT-LT-PILOT-FRONTEND. No feature work before PASS.
> Rule: never pass credentials as CLI arguments; scanners read config/env only.

## Step 0 — Read-only baseline
- [ ] `cd /opt/jol/repos/jol-hub && git status --porcelain > /tmp/jolhub-baseline.txt`
- [ ] Record branch, HEAD SHA, and working-tree state in the change-control issue.

## Step 1 — Tracked-file secret inventory
- [ ] `git ls-files | grep -E '\.env(\.|$)|\.pem$|\.key$'` → list every match.
- [ ] Known candidates (verified present in working tree, tracking status  UNVERIFIED):
  `backend/.env`, `backend/django/.env`, `frontend/.env.example`,
  `frontend/apps/parish-template/.env.local`, `frontend/apps/parish-template/.env.example`.
- [ ] For each: confirm git-tracked or not (`git ls-files --error-unmatch <file>`);
  if tracked AND contains real values → P0: rotate the credential in
  Vaultwarden FIRST, then purge from history (git-filter-repo/BFG),
  then invalidate GitHub caches. Never edit before rotating.

## Step 2 — History scan
- [ ] `trufflehog git file:///opt/jol/repos/jol-hub --only-verified` → 0 verified findings.
- [ ] `git secrets --scan` at HEAD (register patterns first: AWS, Stripe `sk_live_`,
  Bitrix24 tokens, JWT secrets).
- [ ] Any verified finding → incident playbook (`jol-security`), not a silent fix.

## Step 3 — Stray-artifact cleanup (back up, then remove)
- [ ] Move to evidence dir or delete with change record:
  `backend/django/counter_*.db`, `backend/django/histogram_*.db` (8 files).
- [ ] Remove zero-byte junk: `frontend/jol-hub@1.0.0`, `frontend/tsc`, `frontend/turbo`.
- [ ] Relocate `STEP18_EXECUTED.md`, `STEP19_EXECUTED.md` →
  `docs/compliance/evidence/` or fold into CHANGELOG.md.

## Step 4 — Hygiene hardening
- [ ] `.gitignore` covers: `.env`, `.env.local`, `*.db` artifacts, `node_modules/`,
  `tsconfig.tsbuildinfo`, `venv/`, `__pycache__/`.
- [ ] Add `.env.example` templates only (no values).
- [ ] README reconciliation: SQLAlchemy/Alembic→Django, npm→pnpm
  (drift vs actual `backend/django/manage.py` + `pnpm-workspace.yaml`).

## Step 5 — Exit criteria (evidence required in the change-control issue)
| # | Gate | Expected |
|---|---|---|
| 1 | trufflehog verified findings | 0 |
| 2 | git-secrets scan at HEAD | 0 |
| 3 | Tracked `.env`/key files with real values | 0 |
| 4 | Stray SQLite/junk files | removed + recorded |
| 5 | `.gitignore` hardened | committed |
| 6 | AIDE-equivalent repo seal | HEAD SHA recorded, CHANGELOG entry |

Rollback: all changes are doc/metadata-only; revert commit restores prior state.

If Step 1/2 finds live secrets: STOP — credential rotation precedes all other steps.
