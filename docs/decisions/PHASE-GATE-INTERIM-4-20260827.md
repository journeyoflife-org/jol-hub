# INTERIM GATE #4 — 2026-08-27

Status: **AWAITING OWNER BINARY DECISIONS** (gate APPROVE/REJECT · push PUSH/HOLD) · Scope: post-Gate-3 window · Procedure: discovery-determined per MASTER-PROMPT §6.

## 1. Window inventory (discovered, not prescribed)

Anchor: Gate 3 `6317d995` (SIGNED, D-015). Commits landed since (hub, measured 15):

| Group | Commits |
|---|---|
| Contract + audit tail of prior window | `8e5cdbd6` O-009 correction · `e2f727bf` Phase 0 marketplace audit · `6acb71d1` payment contract v1.0.0 |
| Gate 3 sign-off + guard exemption | `d5c3563b` D-015…D-018 recorded · `2fb6bdd7` ADR-010 RULEDOC exemption |
| **M-2 arc** | `c0ce4c8c` receiver built (dormant, fallback-clause landing, ratified by D-019) · `7894ba53` WIP triage · `a5324427` DPIA · `675f9d25` D-019…D-021 (policy, exercise auth, verdict) · `a3e1f240` dry-run evidence (C2 closed) |
| **C-1** | `18cf943e` D-022…D-024 (C1/C3 decisions, C4 obligation → contract v1.1.0) |
| **0.13 disposition** | `4389569b` MS-04 finding (O-018) · `7b59db77` disposition record (O-019) + **13 marketplace commits** `9660d4f…2c5dedf` (their tree, their hooks) |
| **F-1 flag-on** | `04aed0b7` LT/TEST enablement, D-025, evidence `docs/compliance/evidence/lt-flagon-payment-events.md` |
| **0.14 scanner remediation** | `bf827694` hub record · marketplace `e280f82` scanner fix, falsified |
| 0.15 (transcript archives) | **NOT LANDED** — task halted on unfilled owner decisions; recorded honestly as pending, not skipped |

## 2. Gate checks (provenance)

| Check | Command | Result |
|---|---|---|
| Payment guard | `bash scripts/check-payment-boundary.sh` | **exit 0** — green since ADR-010; zero hits of any class today |
| Hub dirty tree | `git status --short \| wc -l` | 2 (standing `manage.py` + `.bak`, never committed) |
| Marketplace dirty | same | 5 = exactly the owner-held class-(c) exclusions (docker-compose×2, deploy/TLS×3) |
| Marketplace commits | `git log 4faef0a..HEAD \| wc -l` | 14 (13 disposition + `e280f82` scanner fix) |
| Unpushed hub | `git log origin…HEAD \| wc -l` | **27** |
| Backend suite (last run, F-1 window) | `pytest --ds=core.settings.test` | 58 passed, exit 0 (unchanged code since) |

## 3. Push assessment (recommendation; decision stays owner's)

**What the push argument now rests on:** 27 commits include CODE (`c0ce4c8c` receiver), not just docs. A single disk fault destroys the entire M-2 audit arc — evidence files, DPIA, sign-offs, and the code they govern — which is precisely the SOC 2 CC-family evidence this program has been building. The off-site-argument has strengthened with every delivery since D-017's HOLD.

**CI posture (verify-don't-assume, offline-limited):**
- Hub CI surface = **8 workflows**: `payment-boundary-guard` (proven green — exit 0 measured today, ADR-010 exemption in force), plus `ci.yml`, `cd.yml`, `compliance-check.yml`, `entity-apps.yml`, `entity-apps-deploy.yml`, `frontend-test.yml`, `security-scan.yml` — **none runnable offline; true state unknown until first push**.
- Marketplace CI was **expanded in `18f4725`** and has NEVER RUN (tree never pushed): it gates frontend typecheck (tsc), ESLint, Prettier, Vitest with an **80% coverage gate**, and backend/frontend contract lockstep. The 13 disposition commits passed only local hooks — the expanded CI is an unproven gate sitting on top of them.

**Recommendation: PUSH (hub).** Reasons: (1) audit-trail integrity now outweighs surface-only CI risk — the evidence set is the asset; (2) the only code commit is dormant and gate-proven (tests 58/58, guard 0, dry-run 6/6, flag-on smoke 6/6, rollback drilled); (3) the payment-boundary job — the only CI that touches the sensitive surface — is locally proven green; (4) first push converts 7 unknown hub-workflow states into known ones; any red job becomes a fix-forward item, not an audit loss. Caveats: expect possible red on unverified hub jobs; **marketplace trees are a separate push decision** (their CI never ran; recommend holding theirs until the owner reviews the 5 held files and accepts first-push CI risk).

## 4. MS-04 status

**SCANNER FIX LANDED** — marketplace `e280f82` (verdict keyed on output, not exit status; falsification: planted key → exit 1, real tree → exit 1). Recorded as RESOLVED-with-followups: rotation NEEDS-OWNER (old key still in three env files per fingerprint check) + env-posture decision pending (options a/b/c presented, recommendation (c) Vaultwarden-only). No longer an owed item; its tail is owner decisions.

## 5. Decision line (owner — fill both)

- Interim Gate #4 (window above, hub commits 8e5cdbd6…bf827694 + marketplace 9660d4f…e280f82): **[APPROVE / REJECT]**
- Push (measured count at gate time: **27**; recommendation: PUSH hub, HOLD marketplace): **[PUSH / HOLD]**

Gate is interim, not closure: Phase 0 Part 2 (O-009 clones), safety.yml (O-010), MASTER-PROMPT v2.0 (O-008), AI-facing DPIA, and the 0.15 transcript disposition all remain open.
