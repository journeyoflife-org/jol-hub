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

## Protection arming (N1) — executed AFTER this merge

Chicken-and-egg resolution: arming the two new contexts BEFORE this PR
merged would block this PR forever (the jobs don't exist on main yet).
Sequence executed: merge PR #77 → PUT required_status_checks → negative
test. Applied contexts (evidence filled in the follow-up commit):

```text
contexts: ["Payment Boundary Guard (E1, ADR-0005)", "Dependency Guard (E2, ADR-0005)"]
```

Rationale for NOT including pre-existing hub jobs (e.g. `Backend - Unit &
Integration Tests`) in the required set: they are red on main since
2026-07-26 for unrelated pre-existing reasons (broken `Django==6.0.3`
pin in CI, frontend lint debt — OBS-18-3); requiring them would block
ALL merges including their own fixes. Guard contexts are green and
deterministic. Broadening the required set is follow-up work once hub CI
baseline is repaired.

## Negative + positive tests

- **Positive:** THIS PR — guard jobs run and pass on a clean tree (see
  check runs on PR #77).
- **Negative:** after arming, branch `negative-test-step19` introduces
  `import stripe` in a python file; its PR's required guard check FAILS
  and the PR CANNOT merge. Evidence (run URL + blocked mergeStateStatus)
  recorded in the follow-up evidence commit; test PR then closed +
  branch deleted.

## Acceptance checklist

- [x] Vendored guard byte-identical to record copy (sha256 pinned)
- [x] Both guard jobs defined, required-check names finalized
- [x] Local positive run green (guard exit 0, 3/3 pytest)
- [ ] Protection armed with the two contexts (post-merge; follow-up commit)
- [ ] Negative test blocked (post-arm; follow-up commit)

## Rollback

Revert the PR (removes workflow + vendored guard) and PUT the previous
(required) contexts value. The STEP 18 sentry tests remain as a fallback.
