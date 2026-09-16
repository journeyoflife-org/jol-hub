# Marketplace WIP Triage — Disposition Input for 197 Uncommitted Entries

Date: 2026-08-27 · Tree: `/opt/jol-m/repos/jol-m-marketplace` @ `4faef0a` (origin/main) · Mode: **READ-ONLY** (no writes to the marketplace tree) · Requested by platform owner; classification only, disposition is the owner's change-controlled decision (their tree, their conventions).

## 1. Method & provenance

- Census: `git status --porcelain` in the marketplace tree → **197 entries** (matches prior session count; unchanged since 2026-08-27 baseline).
- Classification by path semantics; class-(c) tracked-file deltas described from `git diff HEAD` keyword lines only; untracked class-(c) files were **pattern-probed, not content-reviewed** here.
- Secret probe (pattern-only; counts only, content never reproduced): regex over live-key families (`ghp_*`, `xox*-`, `AKIA*`, private-key headers, `sk_live_*`, `pk_live_*`, `whsec_*`) across **all 197 files → 0 matches** (class a: 0, b: 0, c: 0). Pattern absence is evidence, not proof.
- File mtimes 2026-08-17…22 (pre-lineage; verified earlier session) — none of these entries originate from hub-side sessions.

## 2. Classification summary

| Class | Count | Meaning |
|---|---|---|
| (a) safe-to-commit WIP | **179** | Feature code, migrations, tests, docs, messages — in-progress product work |
| (b) local-only artifacts | **7** | Env templates, build/coverage output, IDE-adjacent state |
| (c) RISK — payment/CI/secrets-adjacent | **11** | payments_app, CI workflow, deploy/compose/TLS surface, the secrets scanner itself |

## 3. Class (b) — local-only artifacts (7)

| Entry | Note |
|---|---|
| ` M .env.example` | TRACKED template, modified — review line-by-line before commit (template structure can disclose configuration shape); do not auto-commit |
| ` M frontend/tsconfig.tsbuildinfo` | Build artifact — .gitignore candidate (hub did the same in hygiene gate 2026-08-26) |
| `?? .env.prod.example` | New prod template — pattern-probe clean; review before commit |
| `?? .state/` | Runtime state directory — .gitignore candidate |
| `?? frontend/.dockerignore` | Harmless build config; fine to commit |
| `?? frontend/.env.example` | New frontend template — review before commit |
| `?? frontend/coverage/` | Test output — .gitignore candidate |

**Recommendation:** ignore 4 (`tsbuildinfo`, `.state/`, `coverage/`, review the `.dockerignore` question), inspect-then-commit the 3 env templates after line review.

## 4. Class (c) — RISK entries with behavior deltas (11)

Tracked (delta vs HEAD):

| Entry | One-line behavior delta |
|---|---|
| ` M .github/workflows/ci.yml` (+169/−8) | Major CI pipeline expansion — changes gate coverage for every future push; review before commit |
| ` M backend/apps/payments_app/models.py` (+1/−1) | Adds composite DB index `(product, status)` on PaymentRecord — query performance only, no payment semantics |
| ` M backend/apps/payments_app/services.py` (+20/−4) | **Highest-stakes diff in the tree**: PaymentIntent creation now returns the CLIENT SECRET (embedded Payment Element, SAQ-A posture) + new idempotent client-secret re-fetch helper — changes what checkout returns to the frontend; stays SAQ-A (client-side element) but must be reviewed before commit |
| ` M backend/pyproject.toml` (+8) | Tooling only — mypy override narrowing `django-manager-missing` to products_app models; no dependency change |
| ` M docker-compose.dev.yml` (+38/−6) | Wires `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` from root `.env` into the frontend dev service — dev wiring of the publishable key |
| ` M scripts/check_no_secrets.sh` (+3/−2) | Alters their secrets scanner itself — changes what is detected; review before commit |

Untracked (pattern-probed only; no line review performed):

| Entry | Risk note |
|---|---|
| `?? docker-compose.prod.yml` | Production compose — line review required before commit |
| `?? docker-compose.yml` | Root compose — line review required before commit |
| `?? scripts/deploy.sh` | Deployment entrypoint — line review required |
| `?? scripts/tls-bootstrap.sh` | TLS bootstrap — line review required |
| `?? scripts/tls-issue.sh` | TLS issuance — line review required |

**Note on the hub contract:** `payments_app/internal_forward.py` (the sender our `docs/payment-api-contract.md` v1.0.0 was derived from) is **not** in the dirty set — tracked and clean at HEAD; the contract evidence base is stable.

## 5. MS-01 cross-reference — jol-m-qoder-history growth

Not among the marketplace untracked set (separate repo), but the underlying risk it tracks is **actively growing**: 114 files total, **all 114 with mtimes in the last 30 days**, newest export directory dated 2026-08-26 (yesterday). MS-01 (HIGH) disposition remains the owner's pending decision.

## 6. Recommendations

- **(a) 179 → COMMIT**, under marketplace conventions (their hooks/CI), in a domain-grouped plan (~7 commits):
  1. backend schema: models + migrations (orders/products/sellers/users)
  2. backend public APIs: cart/search/seller-storefront/shipping/tax views+urls+serializers + admin registration
  3. backend settings/urls + compliance/retention + AI provider update
  4. backend tests (contract + integration)
  5. frontend scaffold: config, i18n, messages, base app, generated client, lib/
  6. frontend pages/tests + e2e + deploy/ops scripts excluding class (c)
  7. docs set (19 governance/spec files)
- **(b) 7 → IGNORE/INSPECT** per §3 (gitignore 4 candidates; line-review 3 templates).
- **(c) 11 → REVERT-INSPECT**: individual review each; **payments_app/services.py first** (client-secret return semantics), then check_no_secrets.sh (scanner integrity), then CI/compose/TLS. Nothing here should be bulk-committed.

## 7. Boundaries honored

Marketplace tree: zero writes (classification via `git status`/`git diff`/pattern probe only). Hub tree: this report is the only write. All counts measured, none estimated.
