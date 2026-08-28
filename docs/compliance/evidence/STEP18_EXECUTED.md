# STEP 18 — EXECUTED: Model-B residue purge + sentry inversion (B1)

- **Date:** 2026-08-17 · **Repo:** jol-hub · **Branch:** `step-18-stripe-residue-purge` → PR #76
- **Risk class:** High (PCI scope) · **Stripe mode:** N/A (nothing talks to Stripe here)
- **Sequence role:** first of 18 → 19 → 20 → 21; executed after preconditions verified.
- **NOT a verdict.** Independent re-audit (Step 22b) judges PROVEN/NOT-PROVEN.

## Preconditions (verified before any edit)

| Precondition | Command | Result |
|---|---|---|
| Zero LIVE Stripe consumers in hub app code | `grep -rIn --include='*.py' -E '^\s*(import stripe\|from stripe)' backend/` | 0 hits |
| Zero real-looking keys fleet-wide | entropy grep `sk_/rk_/whsec_` ≥20 chars across hub+marketplace+infra | 0 hits |

## Purge inventory (PB-01…PB-06 + one extra)

| Finding | Artifact removed/changed | Evidence |
|---|---|---|
| PB-01 dep declared | `stripe>=14.0` (backend/requirements.txt), `stripe==14.4.0` (django/requirements.txt) | diff; SDK also uninstalled from BOTH local venvs (`backend/venv`, `backend/django/venv`) |
| PB-02 key plumbing | `STRIPE_PUBLISHABLE/SECRET/WEBHOOK` settings (core/settings/base.py); `get_stripe_keys()` (apps/core/secrets.py); vault docstring | diff |
| PB-03 infra carries key | tf `stripe_*` variables + module args + `stripe_secret_arn` output + tfvars.example lines; k8s `secrets.yaml` `sk_live_CHANGE_ME` block; ExternalSecrets remoteRefs; helm template keys | diff |
| PB-04 providers config | `countries/lt/config/payment-providers.yml` DELETED (zero references on main) | `git diff --stat` |
| PB-05 inverted test | `data/tests/test_compliance.py`: `test_pci_secrets_isolation` is now a Model A SENTRY (fails on any Stripe footprint in settings/env/manifests/infra) + new `test_model_a_no_stripe_import_in_backend` | suite output below |
| PB-06 .env placeholders | `.env`/`.env.example` Stripe blocks removed | diff |
| EXTRA (new finding) | `StripeWebhookView` (AllowAny, unverified) + route + `process_stripe_webhook` task REMOVED from apps/integrations | diff |

Retained by documented decision (vocabulary, not integration): `'stripe'`
ledger labels in crm models/migration/serializer + bitrix24 deal-source
enum + entity-config method validator; browser-side `@stripe/stripe-js`
frontend packages (the sanctioned SAQ-A Elements include, ADR-0005).

## Added: E2 dependency guard

`data/tests/test_dependency_guard.py` — fails if the `stripe`
distribution is installed, declared in any manifest, or importable.

## Test evidence (reproduced locally)

```text
data/tests/test_dependency_guard.py::test_stripe_distribution_not_installed PASSED
data/tests/test_dependency_guard.py::test_stripe_not_declared_in_manifests PASSED
data/tests/test_dependency_guard.py::test_stripe_import_raises            PASSED   (3 passed)
data/tests/test_compliance.py::TestSecretsManagement  14 passed, 1 pre-existing failure
    (test_secrets_module_exists fails on origin/main too: modules/secrets
     directory was never created — dangling module reference, pre-existing,
     out of STEP 18 scope, tracked as observation OBS-18-1)
manage.py check: only pre-existing staticfiles.W004
E1 record-copy guard: green on purged tree; negative fixture exit 1
gitleaks: 0 hits in staged files (41 pre-existing hits confined to the
    tracked .secrets.baseline detect-secrets fingerprint file — OBS-18-2)
```

## N1 (branch protection) — status and sequencing decision

Hub protection currently requires ZERO checks. Arming required contexts is
executed at the END of STEP 19 (after the guard jobs exist and are green),
because arming earlier would block this very merge and the guard PRs under
`enforce_admins`. The required-context set is declared in
`jol-m-infrastructure/docs/payment-boundary-enforcement.md`. Operational
application (not Terraform): hub is mission custody — ADR-0004 R1/R3/R4
forbid the marketplace `github-org` module from managing it.

## Acceptance checklist

- [x] Zero live Stripe consumers verified pre-edit
- [x] PB-01…PB-06 removed (diff above), SDK uninstalled from local venvs
- [x] Sentry tests inverted (PB-05) + dependency-guard test added — green
- [x] gitleaks clean on the diff; no real keys anywhere
- [x] Committed + pushed (this file is part of the PR)
- [ ] Required checks armed — sequenced to STEP 19 close (declared above)

## Rollback

Revert PR #76. The purge is additive-safe: hub had zero live Stripe
consumers, so reverting restores dormant residue only.
