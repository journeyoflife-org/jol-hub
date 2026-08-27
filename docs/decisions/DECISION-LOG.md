# Decision Log & Open Questions — JOL Lithuania Pilot

> Companion to `MASTER-PROMPT-LT-PILOT-FRONTEND.md` §14 deliverable 31.
> Entries are append-only; superseded decisions are struck through in prose,
> never deleted (audit trail — SOC 2 CC3.1, ISO 27001:2022 A.8.32).

## Ratified decisions

| # | Date | Decision | Authority | Supersedes |
|---|---|---|---|---|
| D-001 | 2026-08-24 | JOL commission = **10%** of commercial transactions, uniform across all commercial verticals (Diaconate, Orthodox, Funeral Homes, Cemetery services) | MASTER-PROMPT §7 | All earlier 20% commission statements |
| D-002 | 2026-08-24 | Tenant data isolation = **PostgreSQL schema-per-tenant + RLS defense-in-depth** on shared cluster `jol-db-pilot-lt01` | `ADR-001-schema-per-tenant-isolation.md` | "Separate database per website" formulation |
| D-003 | 2026-08-24 | Frontend extraction into `jol-frontend-platform` **deferred** until Wave 0 exit criteria are met; build inside `jol-hub/frontend` meanwhile | `ADR-002-frontend-extraction-jol-frontend-platform.md` | Any earlier "extract immediately" proposals |
| D-004 | 2026-08-26 | Framework matrix outcome: **Next.js 14 (incumbent) confirmed** — the scored matrix of MASTER-PROMPT §9 is satisfied by the verified jol-hub investment (one template-renderer + tenant resolution + config-driven fixtures); the formal scored-matrix document itself remains new work (` UNVERIFIED — manual check required` until authored) | MASTER-PROMPT §9, ADR-002 Decision 1 | The Astro-based Wave-1 proposal (2026-08-26) — rejected: duplicates the proven renderer, doubles the compliance surface |
| D-005 | 2026-08-26 | Package prices are RATIFIED and immutable in code review: CHEAP €1,000 + €20/mo, NORMAL €2,000 + €20/mo, VIP €3,000 + €20/mo; page-count package definitions are banned | MASTER-PROMPT §6 | — |
| D-006 | 2026-08-27 | International SEO & domain strategy ratified: **ccTLD per country + tenant subdomains** (weighted matrix 4.55 vs 2.95/2.60) reconciled with ADR-001; **KEEP `jol-hub.com`** as brand/marketplace hub ONLY — hub never publishes tenant-competing local content; LV/EE = config-level additions; hreflang extension rule to 27 locales (`docs/seo/international-seo-strategy.md`, commit `6da34b18`) | MASTER-PROMPT §6 Phase 1.1 (degraded scope, owner-authorized) | — |
| D-007 | 2026-08-27 | Phase 0.1 Part 1 accepted under degraded scope; `JourneyOfLife/catholic-digital-ministry` and `JourneyOfLife/jol-master-website` classified **POLICY VIOLATIONS** (rests on ratified org policy); transfer/archive/merge mechanics deferred to Part 2; standing instruction: no new work in either repo, their secrets are rotation candidates (`docs/audits/phase0-repo-reconciliation.md`, commit `e56b1b43`) | Ratified repo-placement policy | — |
| D-008 | 2026-08-27 | AI Pastoral Assistant (clergy-facing) adopted: support-not-replace enforced as five-layer technical invariant; storage-free default with explicit logged consent as sole exception; on-prem inference only; LT golden-set launch gate (`docs/modules/ai-pastoral-assistant-spec.md`, commit `fc255391`) | MASTER-PROMPT §6 Phase 3.3 | — |
| D-009 | 2026-08-27 | Tenant-facing public FAQ chatbot adopted: absolute-zero storage (no consent path); constant-composed crisis/grief paths (model never invoked); `safety.yml` + DPIA as **formal launch blockers** (absence verified 2026-08-27) (`docs/modules/faq-chatbot-spec.md`, commit `da674567`) | MASTER-PROMPT §6 Phase 3.3b | — |
| D-010 | 2026-08-27 | **ADR-008 PROPOSED** (approval pending): extract the shared AI guardrail pipeline (classifier, refusal constants, disclosure constants, PII strip, outcome taxonomy) into `frontend/packages/ai-guardrails`; weakening of any consumer's harsher-defaults column = MAJOR release blocked without change-controlled exception; consumer profiles + contract tests enforce the da674567 §3 inheritance rule mechanically; docs-only — implementation is a later gated task (`docs/decisions/ADR-008-shared-ai-guardrail-pipeline.md`) | MASTER-PROMPT §6 Phase 3.5 | — |
| D-011 | 2026-08-27 | **SIGN-OFF (platform owner, verbatim): "Interim Gates #1+#2 (commits 6da34b18…7685f22c, 2da32b9d): APPROVED"** — the six governance deliverables of the 2026-08-27 window (`6da34b18`, `e56b1b43`, `fc255391`, `da674567`, `d3175786`, `7685f22c`, gate records `d3175786` + `2da32b9d`) are ratified as the accepted record. Audit fix for SOC 2 CC3.1/CC8.1: gates without recorded approval read as rubber-stamping | Platform owner | — |
| D-012 | 2026-08-27 | **SIGN-OFF (platform owner, verbatim): "ADR-008 shared AI guardrail pipeline: APPROVED"** — ADR-008 status flipped PROPOSED → ACCEPTED in the ADR file this commit; ASSUME-GUARD-003 docs-only spec-reference migration QUEUED as the next task, not executed here | Platform owner | — |
| D-013 | 2026-08-27 | **SIGN-OFF (platform owner, verbatim): "Push authorization: HOLD"** — no push executed; unpushed-commits count stated at record time (8 before this commit); next push requires fresh authorization | Platform owner | — |
| D-014 | 2026-08-27 | **ADR-009 payment boundary RATIFIED** (`docs/decisions/ADR-009-payment-boundary.md`): status ACCEPTED as ratification of existing enforced practice (boundary CLOSED, test-mode only, Model A PCI scope exclusion, forbidden-literal guard scope, named-exemption policy ADR-gated, SAQ A = sole opening condition); supersedes/absorbs the "ADR-0005 Model A" lineage and the unresolved QODER.md ADR-005/007 citations; QODER.md payment heading now cites local ADR-009 | MASTER-PROMPT §6 Phase 3 governance, O-016 remainder | Unresolved "ADR-005/007 payment" citations in QODER.md |
| D-015 | 2026-08-27 | **SIGN-OFF (platform owner, verbatim): "Interim Gate #3 (commits 11806613, 532f2d67, ba060853, e1ca13f4, 6317d995): APPROVED"** — the window's governance deliverables (O-016 disambiguation, sign-off record D-011..D-013, ADR-009 reconstitution, guard-discrepancy record, Interim Gate #3) are ratified as the accepted record. SOC 2 CC3.1/CC8.1 audit fix | Platform owner | — |
| D-016 | 2026-08-27 | **SIGN-OFF (platform owner, verbatim): "O-017(3) rule-document guard exemption: APPROVED — implement as ADR-gated named exemption scoped to the existing VOCAB ledger only"** — resolves the guard exit-1 discrepancy (pre-existing QODER.md L109) without opening a general docs exemption; implementation QUEUED as the next change-controlled task, NOT executed here (fix belongs to the guard's record copy per Model A / ADR-009 §5) | Platform owner | — |
| D-017 | 2026-08-27 | **SIGN-OFF (platform owner, verbatim): "Push: HOLD"** — no push executed; unpushed count at record time: 15 before this commit; next push requires fresh authorization | Platform owner | — |
| D-018 | 2026-08-27 | **SIGN-OFF (platform owner, verbatim): "O-016 secrets-mechanism reconciliation (SOPS/age vs Vaultwarden+ESO): DEFERRED"** — the jol-infrastructure ADR-003 (Vaultwarden + External Secrets Operator) vs QODER.md "SOPS/age patterns" wording drift remains open by explicit owner deferral; no action until re-opened | Platform owner | — |

## Open questions

| # | Question | Owner | Status |
|---|---|---|---|
| O-001 | **Polish (PL) language for the LT pilot** — include at launch or defer? Architecture already supports it via `packages/i18n` extension (lt/en/ru live today) | Platform owner | OPEN (MASTER-PROMPT §11) |
| O-002 | **Wave-1 site count reconciliation**: MASTER-PROMPT §4/§15 say "23 Wave-1 sites" (diocese + 5 × (deanery + church + funeral + cleaning) = 21 listed, counted 23 with the cathedral). The ratified Wave-1 hierarchy (2026-08-26) specifies 30 service sites + diocese = **31**, with each parish church also carrying its own funeral home and cleaning service. Implementation baseline as of 2026-08-26: **32 pilot tenants** = the full 31-site tree + the VIP cathedral reference. Delta closed 2026-08-26 with the 8 church-level service sites (`zagare-funeral`, `zagare-cleaning`, `kraziai-funeral`, `kraziai-cleaning`, `lygumai-funeral`, `lygumai-cleaning`, `baisogala-funeral`, `baisogala-cleaning`), all verified rendering | Platform architect | CLOSED 2026-08-26 — MASTER-PROMPT §4/§15 site-count wording to be amended in the next change-controlled doc revision |
| O-003 | Spec delta for `jol-infrastructure/docs/servers/jol-db-pilot-lt01.md` against ADR-001 (change-controlled issue in jol-infrastructure) | DevOps | OPEN ACTION (ADR-001) |
| O-004 | MASTER-PROMPT §3 estate table describes the pre-dismantlement frontend (12 `lt-*` demo apps). Reality since the demolition step: ONE template-renderer + seed fixtures; `master-site`/`parish-template` remain as legacy extraction candidates. Table is retained as ratified ground truth; this entry records the verified delta | Platform architect | RECORDED |
| O-005 | Hygiene-gate candidate list staleness: `frontend/apps/parish-template/.env.local` no longer exists (app directory removed post-ratification); `backend/.env` / `backend/django/.env` exist in the working tree but are **untracked** (verified 2026-08-26: `git ls-files` returns only `.env.example` templates) | Platform architect | RECORDED |
| O-006 | README reconciliation (SQLAlchemy/Alembic→Django, npm→pnpm) — MASTER-PROMPT §3 conflict item; not yet executed | Platform architect | OPEN |
| O-007 | **Correction to O-005**: verified 2026-08-26, `frontend/apps/parish-template/` still EXISTS and contains `.env.local` (mode `600 jol:jol`, 2026-04-06, untracked — no git secret exposure). O-005's "app directory removed post-ratification" phrasing is inaccurate; the hygiene conclusion (0 tracked secret files) is unaffected. Full correction in `AUDIT-CLOSURE-PROFESSIONAL-OPINION-20260826.md` §3 | Platform architect | RECORDED 2026-08-26 |
| O-008 | MASTER-PROMPT-V2.md commit parked — governance baseline incomplete; interim phase gate (2026-08-27) measured against the session-record draft pending commit | Platform owner | OPEN |
| O-009 | Clone `catholic-digital-ministry`, `jol-master-website` to `/opt/jol/repos/` → unblocks Phase 0.1 Part 2 for those repos · **CORRECTED 2026-08-27**: `jol-m-marketplace` was never missing — it lives at `/opt/jol-m/repos/jol-m-marketplace` in the separate Tier-1 marketplace tree (MASTER-PROMPT §2.2); prior gates searched `/opt/jol/repos/` only. Verified this session: real Django backend incl. `payments_app` Stripe integrator (Model A confirmed), internal hub webhook channel pre-wired (`INTERNAL_WEBHOOK_TARGETS["hub"]` → `/internal/v1/payment-events`, settings/base.py); **audit-before-action still applies — no modification of that repo before its own Phase 0** | Platform owner | OPEN (2 of 3 repos) |
| O-010 | Author `countries/{lt,lv,ee}/config/safety.yml` (crisis/safeguarding/bereavement contacts) — **launch blocker for both AI modules** (D-008, D-009) | Platform owner + clerical review | OPEN |
| O-011 | S-01 (audit `e56b1b43` §3.2): jol-qoder-history transcript archive — sanitize/purge decision (HIGH) | Security owner | OPEN |
| O-012 | S-02: obsidian vault security review + relocation decision | Security owner | OPEN |
| O-013 | DPIA for public-facing AI (MASTER-PROMPT §13 trigger) — launch-blocking | Platform owner | OPEN |
| O-014 | Assumption Register consolidated into this file (below); no further doc-local registers | Platform architect | RECORDED 2026-08-27 |
| O-016 | **Cross-repo ADR namespace collision** (refined 2026-08-27, Interim Gate #2): QODER.md's ADR-003 (SOPS) / ADR-005/007 (payment boundary) citations resolve ACROSS REPOS — `jol-infrastructure/docs/adr/` holds its own ADR-001..006 (verified: ADR-003-secrets-management, ADR-005-gitops-workflow), whose numbers collide with jol-hub's `docs/decisions/ADR-*` (same numbers, different decisions). ADR-007 exists nowhere on disk. Fix: qualify cross-repo refs (`jol-infrastructure ADR-003`) or unify the namespace; jol-hub numbering continues at ADR-008+ · **DISAMBIGUATION APPLIED 2026-08-27**: QODER.md SOPS citation now repo-prefixed (`jol-infrastructure ADR-003 (secrets management)`); payment citation marked *referenced, not found — reconstitution pending* because verified jol-infrastructure ADR-005 is GitOps workflow (NOT payment) and no payment ADR exists in either repo — prefixing it would be false attribution; boundary rules remain in force regardless. REMAINING: reconstitute payment-boundary ADR (owner decision) · **PAYMENT PART RESOLVED 2026-08-27 (D-014)**: ADR-009 committed; QODER.md payment heading now cites local ADR-009; jol-infrastructure ADR-005 GitOps attribution kept intact. STILL OPEN: secrets-mechanism drift — jol-infrastructure ADR-003 is titled "Vaultwarden + External Secrets Operator" while QODER.md speaks of "SOPS/age patterns"; reconciliation is a SEPARATE owner decision · **DEFERRED 2026-08-27 by owner (D-018)** — remains open until re-opened | Platform architect | OPEN ACTION (deferred) |
| O-017 | Payment-guard residuals (ADR-009 §6, all verified 2026-08-27): (1) `docs/payment-api-contract.md` referenced by `scripts/check-payment-boundary.sh` but absent from disk — **RESOLVED 2026-08-27**: contract v1.0.0 authored (sender facts derived from marketplace `internal_forward.py` at 4faef0a; Art. 9 minimization table as DPIA input); (2) the guard's record copy needs a drift-check convention against its `jol-m-infrastructure` origin (CI pins it by sha256 per `.github/workflows/payment-boundary-guard.yml`); (3) **GUARD DISCREPANCY FOUND**: `bash scripts/check-payment-boundary.sh` exits 1 on PRE-EXISTING QODER.md L109, which names the two forbidden literals inside the rule that forbids them (introduced `89dd9cf5`, NOT by ADR-009 work — ADR-009 deliberately reproduces no literals). Resolution requires an ADR-gated NAMED exemption for rule documents (guard is a pinned vendored copy; fix belongs to the record copy per Model A) — owner decision · **DECISION MADE 2026-08-27 (D-016): APPROVED, scoped to the existing VOCAB ledger only; implementation QUEUED as next change-controlled task (not executed)** | Platform architect | OPEN ACTION (implementation queued) |

## Hygiene-gate execution record (2026-08-26)

Executed against `docs/compliance/pre-work-hygiene-gate.md`:

| Step | Result |
|---|---|
| 0 baseline | branch `feat/pages-step6`; HEAD recorded in commit metadata below |
| 1 tracked-file inventory | 10 matches, all `.env.example` templates — **0 tracked files with real values** |
| 2 history scan | trufflehog / git-secrets unavailable on this offline host — compensating sweeps (payment-boundary guard + `check-secrets` pattern scan) run at every frontend build; recorded as compensating control, not equivalence |
| 3 stray artifacts | zero-byte junk removed (`frontend/jol-hub@1.0.0`, `frontend/tsc`, `frontend/turbo`); `STEP18_EXECUTED.md`, `STEP19_EXECUTED.md` relocated to `docs/compliance/evidence/`; `counter_*.db`/`histogram_*.db` already absent |
| 4 hardening | `.gitignore` already covers `.env`, `.env.local`, `*.db`, `node_modules/`, `venv/`, `__pycache__/`; `tsconfig.tsbuildinfo` added this session |
| 5 seal | HEAD SHA + this record serve as the repo seal pending the change-control issue |

Rollback: revert the hygiene commit; all changes are moves/deletes of zero-value artifacts and one `.gitignore` line.


## Audit closure reference (2026-08-26)

Front-end audit findings F1–F6 re-verified independently at HEAD `bcb00f2f`
(vitest 114/114 PASS; `tsc --noEmit` exit 0; closed-lookup trace; registry
count = 32). Dispositions, residual risks and the professional certification
statement with go-live conditions precedent: see
`AUDIT-CLOSURE-PROFESSIONAL-OPINION-20260826.md` in this directory.

## Assumption Register

> Consolidated 2026-08-27 (O-014). All ASSUME- entries issued in phase
> deliverables are tracked here; source document cited per row. **NEEDS-OWNER
> = requires platform-owner action (offline host / account access / sourcing).**

| ID | Source | Assumption (abridged) | Status | Action owner |
|---|---|---|---|---|
| ASSUME-SEO-001 | `docs/seo/international-seo-strategy.md` | jol-hub.com history/backlinks acceptable | OPEN | **NEEDS-OWNER** (networked audit) |
| ASSUME-SEO-002/003 | same | No brand keyword volume; no volume figures cited | OPEN | **NEEDS-OWNER** (Keyword Planner) |
| ASSUME-SEO-004 | same | No trademark collision | OPEN | **NEEDS-OWNER** (EUIPO) |
| ASSUME-SEO-005 | same | Task-brief page inventory = future Phase 0 inventory | OPEN | agent (diff when inventory lands) |
| ASSUME-SEO-006 | same | LV/EE domains registered & controlled | OPEN | **NEEDS-OWNER** (registrar) |
| ASSUME-SEO-007 | same | Country SEO config as YAML | OPEN | agent (at implementation) |
| ASSUME-SEO-008 | same | 27 markets fit hreflang rule; edge cases at onboarding | OPEN | agent (per-country review) |
| ASSUME-SEO-009 | same | RU locale demand in LV/EE justifies launch inclusion | OPEN | agent (Search Console, +6 mo) |
| ASSUME-PAST-001 | `docs/modules/ai-pastoral-assistant-spec.md` | qwen3-32b best available LT base | OPEN | agent (golden set §4.3) |
| ASSUME-PAST-002 | same | Phase 0 would confirm jol-llm/jol-rag viable | OPEN | agent (Phase 0 sign-off) |
| ASSUME-PAST-003 | same | Clergy role exists in jol-auth | OPEN | agent (implementation start) |
| ASSUME-PAST-004 | same | RAG corpus suitable/licensed | OPEN | agent (corpus audit) |
| ASSUME-PAST-005 | same | PII stripping best-effort | OPEN | agent (training + red-team) |
| ASSUME-PAST-006 | same | Crisis hotlines obtainable → safety.yml | OPEN | **NEEDS-OWNER** (O-010, launch blocker) |
| ASSUME-PAST-007 | same | 2.6 tok/s acceptable with streaming | OPEN | agent (GPU roadmap review) |
| ASSUME-PAST-008 | same | FAQ chatbot is a distinct module | RESOLVED 2026-08-27 | delivered as Phase 3.3b (D-009) |
| ASSUME-PAST-009 | same | 3-year safety-event retention | OPEN | legal review |
| ASSUME-AUD-001 | `docs/audits/phase0-repo-reconciliation.md` | Local clones mirror remotes | OPEN | **NEEDS-OWNER** (network) |
| ASSUME-AUD-002 | same | obsidian contains no personal data | OPEN | agent (O-012 review) |
| ASSUME-AUD-003 | same | GitHub policy actually enforced | OPEN | **NEEDS-OWNER** (network) |
| ASSUME-AUD-004 | same | Django pin 6.0.3 authoritative over recorded 6.0.7 | OPEN | agent (reconcile at sync; code-over-memory settled) |
| ASSUME-AUD-005 | same | Violating repos' secrets un-leaked | OPEN | **NEEDS-OWNER** (needs O-009 clones) |
| ASSUME-FAQ-001 | `docs/modules/faq-chatbot-spec.md` | safety.yml authored pre-launch | OPEN | **NEEDS-OWNER** (O-010, launch blocker) |
| ASSUME-FAQ-002 | same | Corpus visibility flag exists at ingest | OPEN | agent (corpus audit) |
| ASSUME-FAQ-003 | same | Consent-manager integration point exists | OPEN | agent (implementation start) |
| ASSUME-FAQ-004 | same | Rate limiter capacity at pilot traffic | OPEN | agent (load test) |
| ASSUME-FAQ-005 | same | Confessionally-neutral condolence constants | OPEN | agent + clerical review |
| ASSUME-FAQ-006 | same | Zero-storage covers minors exposure | OPEN | DPIA (O-013) |
| ASSUME-GUARD-001 | `docs/decisions/ADR-008-shared-ai-guardrail-pipeline.md` | ADR-008 numbering holds: ADR-003/005/007 stay reserved-as-phantom; if reconstituted under different numbers, re-verify the numbering note | OPEN | agent (with O-016 resolution) |
| ASSUME-GUARD-002 | same | `packages/ai-guardrails` slots into workspace verify chains + CODEOWNERS/repo-kit without kit changes | OPEN | agent (implementation gate) |
| ASSUME-GUARD-003 | same | On approval, both AI specs get docs-only edits referencing the package (migration plan in ADR-008); no runtime code until the gated implementation task | QUEUED 2026-08-27 (ADR-008 APPROVED per D-012; migration = next task, not yet executed) | agent (next task) |
| ASSUME-MKT-001 | `docs/audits/phase0-marketplace.md` | Stripe test keys provisioned only outside git via the marketplace secret store; no live keys | OPEN | **NEEDS-OWNER** (marketplace confirmation / networked review) |
| ASSUME-MKT-002 | same | Marketplace README CI/coverage/Lighthouse badge claims match reality | OPEN | **NEEDS-OWNER** (networked check) |
| ASSUME-MKT-003 | same | internal_forward.py's "ADR-0005 §3" = jol-m-infrastructure payment-boundary doc, NOT the marketplace registry's storage ADR-0005 | OPEN | marketplace owner |
| ASSUME-MKT-004 | same | Pre-import marketplace history contains no leaked credentials (squashed lineage unauditable offline) | OPEN | **NEEDS-OWNER** (networked review; MS-03 rotation posture meanwhile) |
| ASSUME-MKT-005 | same | Hub receiver can be built without any marketplace-tree change (sender contract stable at 4faef0a) | OPEN | agent (M-1 kickoff re-verification) |
| ASSUME-PAY-001 | `docs/payment-api-contract.md` | Internal-path TLS posture (hub ingress listener for the internal channel) confirmed by jol-infrastructure / jol-m-infrastructure before M-1 code | OPEN | agent (infra confirmation) |
| ASSUME-PAY-002 | same | 90-day delivery-key rotation cadence ratified (precedent: Bitrix24 token rotation) | OPEN | **NEEDS-OWNER** (ratification) |
| ASSUME-PAY-003 | same | ±300 s replay window + NTP clock sync on both hosts acceptable to sender team | OPEN | marketplace owner |
| ASSUME-PAY-004 | same | v1 event set complete at 4faef0a; future sender event types require joint handling before emission | OPEN | agent (M-1 re-verification) |
