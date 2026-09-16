# ADR-010: Payment Guard — Named Rule-Document Exemption Ledger (RULEDOC)

---

## Status
Accepted — implements the owner-approved decision D-016 (O-017(3)),
ratified 2026-08-27. Coordinated change across both Tier-1 trees (record copy
in jol-m-infrastructure `98eeb33`; hub vendored copy + pin in the companion
hub commit).

## Context
- The payment guard (`scripts/check-payment-boundary.sh`, ADR-009 §6
  enforcement) forbids the two secret-key setting literals **even in comments
  and examples**, scanning the whole tree.
- QODER.md L109 states that rule by NAMING those literals — a rule must name
  what it forbids. Result: the guard exited 1 on its own rule text since
  `89dd9cf5`, and the sha256-pinned CI job
  (`.github/workflows/payment-boundary-guard.yml`) has likely been red on
  every push since — invisible while the host is offline.
- ADR-009 §5: exemption additions require an ADR; the guard is a pinned
  vendored copy whose record copy lives in `jol-m-infrastructure` (Model A).
- Owner decision D-016 approved a named exemption, explicitly **scoped to the
  existing ledger mechanism — no blanket documentation exemption**.

## Decision
1. Add a **RULEDOC** named-exemption ledger to the guard, sibling to VOCAB,
   holding exact file paths. Initial (and ratified) content: `QODER.md` only.
   **Additions require an ADR.**
2. Semantics: RULEDOC files are exempt from **layer-3** (full-tree) literal
   hits only; layers 1 (server scope) and 2 (manifests) are unchanged. VOCAB
   semantics are untouched — the two ledgers are checked by one
   `ledger_excluded()` function.
3. Interpretation note: "scoped to the existing VOCAB ledger" is implemented
   as *the existing named-ledger mechanism*, not as membership in VOCAB
   itself — VOCAB's documented semantics (business label vocabulary; markers
   still apply inside) do not fit rule documents, and repurposing the array
   would falsify its comment contract.
4. Application workflow (Model A, followed here): edit the **record copy**
   (jol-m-infrastructure) first → re-vendor the hub copy → update the hub
   workflow pin — one coordinated change, both trees committed.

## Falsification requirement (verified at implementation)
The exemption must be provably narrow:
- **Positive**: guard on the hub tree → exit 0 (`PAYMENT BOUNDARY OK`).
- **Canary**: a non-exempt file containing a forbidden literal MUST still
  fail — verified exit 1 with `/tmp/canary-tree/not-a-rule-doc.txt`.
- **Scope proof**: the same QODER.md content placed in a tree where it is not
  on the ledger also failed (canary tree exit 1 included its QODER.md copy) —
  exemption is path-scoped, not content-scoped.

## Guard provenance (record)
| Moment | Command | Result |
|---|---|---|
| Before | `bash scripts/check-payment-boundary.sh` | exit 1, exactly 2 violations (QODER.md L109 pair) |
| After | `bash <new guard> /opt/jol/repos/jol-hub` | exit 0 |
| Canary | `bash <new guard> /tmp/canary-tree` | exit 1 |
| Hashes | before `8fa2dd12…ed47a5` → after `add835e7…c249` | hub vendored copy == record copy (sha256 verified) |

## Consequences
- **Positive**: guard and CI pin restored to green without weakening
  enforcement; rule text can name what it forbids; exemption surface is
  one file, ADR-gated, path-exact.
- **Negative / accepted**: RULEDOC files can hold the literals — bounded by
  path-exact ledger + ADR gate + code review; QODER.md is a behavioral-rules
  document with no runtime role, so blast radius is nil.
- Cross-tree coordination cost is real but already institutionalized
  (record-copy + pin model).

## Alternatives considered
1. Re-word QODER.md to avoid naming the literals — rejected: rules that
   cannot name what they forbid are unauditable; the canary would just move.
2. Blanket `*.md` / docs exemption — rejected by owner scope (D-016); would
   shelter future leaks in any document.
3. Add QODER.md to VOCAB — rejected: wrong semantics class (business label
   vocabulary vs. rule text); falsifies VOCAB's documented markers discipline.

## Compliance
- SOC 2 CC8.1: change-controlled exception (D-016 + this ADR + two-tree
  coordinated commits).
- ADR-009 §5 honored: named exemption, ADR-gated additions, record-copy-first.
- Enforcement intact: falsification canary proves non-exempt content still
  fails (exit 1).

## Rollback
Both trees, in reverse order:
1. hub: `git revert <hub-sha>` (restores pin `8fa2dd12…`, old vendored copy,
   removes this ADR + log entries).
2. jol-m-infrastructure: `git revert 98eeb33`.
Guard returns to exit-1-on-QODER.md state; no runtime system is affected in
either direction.
