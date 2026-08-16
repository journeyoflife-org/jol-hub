# STEP 19 — EXECUTED: E1/E2 guards wired as required checks (B2 + N1)

- **Date:** 2026-08-17 · **Repo:** jol-hub · **Branch:** `step-19-boundary-guards` → PR #77
- **Risk class:** Med (CI/governance) · **Depends on:** STEP 18 merged (`89c4812d`)
- **NOT a verdict.** Independent re-audit (Step 22b) judges PROVEN/NOT-PROVEN.

## What landed

1. **Vendored E1 guard**: `scripts/check-payment-boundary.sh` — exact copy
   of the jol-m-infrastructure record copy, sha256-pinned in the workflow:
   `8fa2dd12f12320dff268ee19d5b00422a1f5987203e34755c342e56068ed47a5`.
   Drift contract: guard updates land in BOTH repos in one change window;
   the pin is the tamper seal (record-copy contract,
   jol-m-infrastructure/docs/payment-boundary-enforcement.md).
2. **New workflow** `.github/workflows/payment-boundary-guard.yml`
   (deliberately NO path filter — residue can land anywhere):
   - job `Payment Boundary Guard (E1, ADR-0005)`: pin check + guard run
   - job `Dependency Guard (E2, ADR-0005)`: `pytest data/tests/test_dependency_guard.py`
   Chosen as a separate workflow because ci.yml's path filters
   (`backend/**`, `frontend/**`, …) would skip guard runs for residue
   landing elsewhere.

## Local evidence (reproduced pre-push)

```text
sha256sum -c → scripts/check-payment-boundary.sh: OK
bash scripts/check-payment-boundary.sh $PWD → PAYMENT BOUNDARY OK (exit 0)
pytest data/tests/test_dependency_guard.py → 3 passed
workflow YAML parse → OK
```

## Protection arming (N1) — EXECUTED, with one incident closed

Chicken-and-egg resolution: arming the two new contexts BEFORE this PR
merged would block this PR forever (the jobs don't exist on main yet).
Sequence executed: merge PR #77 → arm required checks → harden admin
bypass → negative test.

**Armed configuration (verified via API after application):**

```text
required_status_checks.contexts:
  - "Payment Boundary Guard (E1, ADR-0005)"
  - "Dependency Guard (E2, ADR-0005)"
strict: true
required_approving_review_count: 0   (solo-era; marketplace precedent)
enforce_admins: true                 (POST .../protection/enforce_admins)
```

API notes (evidence of method): PUT on required_status_checks returns
404 with this token — PATCH applies contexts; enforce_admins toggles via
POST on its sub-resource.

**Incident OBS-19-1 (opened and closed within this step):** with
enforce_admins still false, the first negative probe (PR #78) was
ACCIDENTALLY MERGED by an `--admin` merge attempt used to test the
block; the violation file reached main. Immediate remediation: revert
PR #79 (merged, `ba2f7c63`), then enforce_admins=true + review count 0
applied, then the probe re-run as PR #80. Root cause: admin bypass
permitted under enforce_admins=false. Current state re-verified:
bypass closed (see negative test below).

Rationale for NOT including pre-existing hub jobs (e.g. `Backend - Unit &
Integration Tests`) in the required set: they are red on main since
2026-07-26 for unrelated pre-existing reasons (broken `Django==6.0.3`
pin in CI, frontend lint debt — OBS-18-3); requiring them would block
ALL merges including their own fixes. Guard contexts are green and
deterministic. Broadening the required set is follow-up work once hub CI
baseline is repaired.

## Negative + positive tests — EXECUTED

- **Positive:** PR #77 — guard jobs ran green in CI before merge
  (`Payment Boundary Guard` SUCCESS, `Dependency Guard` SUCCESS), and
  revert PR #79 merged THROUGH the armed gate (checks green, normal
  path).
- **Negative (definitive, PR #80, post-hardening):** probe file with
  `import stripe` → E1 check **FAILURE**; normal merge attempt →
  REFUSED ("base branch policy prohibits the merge"); `--admin` merge
  attempt → **REFUSED**: `GraphQL: Repository rule violations found —
  Required status check "Payment Boundary Guard (E1, ADR-0005)" is
  failing`. PR #80 remained OPEN (unmergeable), then closed + branch
  deleted without merge. The violation never reached main a second time.
- Earlier partial negative evidence (PR #78, pre-hardening): E1 check
  FAILURE on the same probe — the guard itself behaved correctly from
  the first run; only the admin-bypass governance hole allowed the
  accidental merge, and that hole is now closed and re-tested.

## Acceptance checklist

- [x] Vendored guard byte-identical to record copy (sha256 pinned)
- [x] Both guard jobs defined, required-check names finalized
- [x] Local positive run green (guard exit 0, 3/3 pytest)
- [x] Protection armed with the two contexts (API-verified above)
- [x] Admin bypass closed (enforce_admins=true) — OBS-19-1 remediated
- [x] Negative test blocked on BOTH normal and admin paths (PR #80)

## Rollback

Revert the guard PR (#77), DELETE the two required contexts via API, and
POST-disable enforce_admins if the bypass closure must unwind. The
STEP 18 sentry tests remain as a fallback.
