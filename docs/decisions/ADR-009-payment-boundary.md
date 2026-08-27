# ADR-009: Payment Boundary — CLOSED Pilot, PCI Scope Exclusion (Model A)

---

## Status
Accepted — **this ADR ratifies existing, already-enforced practice; it does
not introduce new behavior.** Ratified by platform owner 2026-08-27
(DECISION-LOG D-014). The boundary rules below have been enforced in code and
CI since before this document existed; this record gives them the ratifying
decision they previously lacked.

## Lineage & numbering (verified, not assumed)
The payment boundary stood on prose and code comments alone. Verified
2026-08-27 lineage:

1. QODER.md cited "ADR-005 / ADR-007" — no payment ADR exists under either
   number in jol-hub; `jol-infrastructure/docs/adr/ADR-005` is **GitOps
   Workflow** (unrelated); ADR-007 exists in no repo.
2. `scripts/check-payment-boundary.sh` and `docs/compliance/evidence/
   STEP19_EXECUTED.md` cite **"ADR-0005 Model A, guards E1/E2"** — an
   "ADR-0005" document exists nowhere on disk; its content survives only in
   the guard's header comments.
3. The guard's record copy originates from `jol-m-infrastructure` (the
   marketplace tree), with hub CI pinning a copy.

**ADR-009 therefore supersedes and absorbs all of the above**: it is the
first committed payment-boundary decision, and the "ADR-0005 Model A"
content is restated here as the ratified text. No numbering collision with
`jol-infrastructure` ADR-005 (different repo, different decision — O-016).

## Context
- The pilot surfaces a donation flow adjacent to **GDPR Art. 9**
  special-category data (donation × religious affiliation): live payment
  plumbing before the handling is verified would compound two risk classes.
- **PSD2 / SCA** applies to any donation/payment collection; strong customer
  authentication design is specified (Phase 1/2 donation specs) but not yet
  proven against a live PSP.
- **PCI-DSS scope minimization**: any repo that touches card data or PSP SDKs
  directly enters assessment scope; at ~400k-tenant ambition, scope creep in
  the hub monorepo would be disproportionately expensive.
- Enforcement already exists: `scripts/check-payment-boundary.sh` (executable,
  5.3 KB) runs as a pre-commit/CI gate, and `data/tests/test_dependency_guard.py`
  is its CI twin (guards E1/E2 respectively).

## Decision
1. **The pilot payment boundary is CLOSED.** Test mode only; no live
   transactions anywhere in the estate until the sole opening condition (4)
   is met.
2. **Model A — PCI scope exclusion.** `jol-hub` stays OUT of PCI scope: the
   marketplace `payments_app` is the sole PSP integrator; the hub consumes an
   internal payment API only. No server-side PSP SDKs, no PSP keys or
   endpoints, anywhere in the hub tree — frontend and config included.
3. **Forbidden-literal guard scope.** The two Stripe secret-key setting
   literals named in the guard's pattern lists (SERVER_SCOPE and FULL_TREE in
   `scripts/check-payment-boundary.sh`) are forbidden **even in comments and
   examples**; the guard scans the whole tree. (This ADR deliberately does
   not reproduce the literals — reproducing them would trip the very guard it
   ratifies.)
4. **Sole opening condition: PCI-DSS SAQ A verification.** Opening the
   boundary requires SAQ A verification plus a change-controlled opening plan
   (issue, snapshot, rollback per SOC 2 CC8.1). Nothing else opens it.
5. **Named-exemption policy** (from the guard; exhaustive as of ratification):
   - dependency trees (`venv`/`.venv`/`node_modules`): pinned third-party
     noise; guard E2 governs which packages may be installed;
   - guard/test fixture files whose CONTENT is the test fixture
     (`test_dependency_guard.py`, `test_compliance.py`, the guard script
     itself);
   - ledger-vocabulary files where the string 'stripe' is an accounting/CRM
     source LABEL (business vocabulary, not integration) — quoted-label
     occurrences only; Layer 1/2/3 markers still apply inside them.
   **Adding any further exemption requires an ADR, not a code change.**
6. **Enforcement mechanism.** `scripts/check-payment-boundary.sh` must pass
   before commits (record copy from `jol-m-infrastructure`; hub pins a copy;
   drift between copies is itself a change-controlled issue).

## Consequences
- **Positive**: PCI scope stays confined to the marketplace payments_app;
  PSD2/SCA design work proceeds without live exposure; the boundary is
  mechanically enforced, not discipline-enforced; audit trail now complete
  (prose → ADR).
- **Negative / accepted**: the donation flow remains **design + dry-run**
  until SAQ A; pilot tenants cannot take live donations in the interim —
  accepted trade-off against Art. 9 + PSD2 risk.
- **Residuals recorded**: `docs/payment-api-contract.md` is referenced by the
  guard's header but does not exist on disk — tracked as O-017; the guard's
  `jol-m-infrastructure` record copy needs a drift-check convention (same
  O-017).

## Alternatives considered
1. Hub-direct PSP integration — rejected: pulls the monorepo into PCI scope
   for all 27-country tenants' sake of pilot convenience.
2. Early boundary opening for pilot donations — rejected: SAQ A unverified;
   PSD2 SCA unproven; Art. 9 adjacency unassessed for live flows.
3. Per-tenant PSP accounts — deferred to industrialization; does not change
   the hub's CLOSED posture.

## Compliance
- **PCI-DSS**: SAQ A scope minimization (Model A); scope confined to
  marketplace payments_app.
- **PSD2**: SCA-ready design target; live collection gated on verification.
- **GDPR Art. 9**: no live donation × affiliation processing before the
  donation-flow spec's consent/retention controls are verified.
- **SOC 2 CC8.1 / ISO 27001:2022 A.8.32**: boundary opening is
  change-controlled; exemptions are ADR-gated; this record closes the
  audit-trail gap.

## Rollback
This ADR documents enforced practice; reverting it changes no runtime
behavior (the guard keeps running). Re-opening the payment boundary is never
a revert — always the §4 opening condition plus change control.
