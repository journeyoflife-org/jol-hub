# Phase 0.1 — Repository Reconciliation Report (PART 1 — INCOMPLETE)

| Attribute | Value |
|---|---|
| Phase | 0.1 (MASTER-PROMPT v2 §6 Phase 0.1) |
| Status | **PART 1 — INCOMPLETE** (degraded scope, authorized 2026-08-27) |
| Date | 2026-08-27 · Branch `feat/pages-step6` |
| Scope | All repos locally present under `/opt/jol/repos/` |
| Rollback | Docs-only. `git revert <sha>`. |

> **PART 1 — INCOMPLETE BANNER.** Entry gate FAILED (verified 2026-08-27,
> commands C1/C2 below): `catholic-digital-ministry`, `jol-master-website`,
> `jol-m-marketplace` are absent from `/opt/jol/repos/`. Per task directive,
> Part 1 audits every locally present repo and issues the B1 policy-violation
> classification (rests on ratified org policy, not repo contents).
> **Deferred to Part 2** (requires repo contents): transfer/archive/merge
> recommendation and inbound-link redirect strategy for the two violating
> repos; any findings on `jol-m-marketplace`. Host is offline — no remote
> audit was performed or attempted.

## 1. Provenance (every command executed, audit-only)

| ID | Command | Result |
|---|---|---|
| C1 | `for r in <3 repos>; do [ -d "$r/.git" ] ...` (direct .git check) | all 3 `MISSING` |
| C2 | `ls -1 \| grep -iE 'catholic\|master.?website\|marketplace'` in `/opt/jol/repos/` | no matches |
| C3 | `bash /tmp/jol_repo_audit.sh` — per repo: remote URL, HEAD/date, branch, commit count, top file-extensions, build markers, tracked-file count | full dataset → §2 |
| C4 | `jol-core` listing/README; python pins in rag/analytics/ecommerce `pyproject.toml`; Django pin in `jol-hub/backend/django/requirements.txt`; `obsidian` listing | findings → §3.3, §3.4 |
| C5 | Secret-pattern probe on `obsidian`, `jol-core`, `jol-qoder-history`: filenames (`*.env*`, `*.pem`, `*.key`, `*credential*`, `*secret*`) + content patterns (`ghp_…`, `xox…`, `AKIA…`, private-key headers). **Matches were pattern-flagged only; no matched content is quoted or reproduced in this report.** | §3.2 findings |

No network, no clone, no modification of any audited repo. CVE-database and
registry lookups were impossible offline — every dependency-health column
carries that flag.

## 2. Inventory — 22 git repositories + workspace context

Remote-org column: all remotes resolve to **journeyoflife-org** (verified in C3) — the local estate is org-clean; the policy violations are the two *non-local* repos in §4.

| # | Repo | Purpose (from code, not README) | Last commit (C3) | Stack | Dependency health (offline) | Duplicates / forks / dead code |
|---|---|---|---|---|---|---|
| 1 | jol-hub | Tier-0 monorepo: Django backend (346 ts/293 tsx frontend majority), Turborepo/pnpm Next.js 14, data pipelines, infra manifests; active pilot development | 2026-08-27 (branch `feat/pages-step6`) | Django 6.0.3 + DRF, Next.js 14, Python 3.12 | 91 exact-pinned reqs; **Django 6.0.3 ≠ 6.0.7 recorded in platform memory — pin drift to reconcile**; CVE DB unavailable offline | README vs reality drift (O-006); `backend/manage.py` host-wrapper intentionally dirty |
| 2 | jol-analytics-ai | Analytics/AI-enrichment service (54 py, Dockerized) | 2026-07-13 | Python ≥3.12, docker-compose | pins present; CVE lookup impossible | none observed |
| 3 | jol-auth | OAuth 2.1/OIDC identity service (thin: 25 files, 6 commits) | 2026-07-18 | Python, pyproject | early-stage; CVE lookup impossible | none observed |
| 4 | jol-backend-platform | **Stub**: README only (3 tracked files, 1 commit) | 2026-02-04 | — | — | matches README stub table — consistent |
| 5 | jol-bitrix24-integration | CRM integration layer: sync/webhooks (37 py) | 2026-07-13 | Python | CVE lookup impossible | none observed |
| 6 | jol-compliance | Compliance documentation engine + light tooling (50 md vs 7 py); unmerged work on `feature/initial-setup` | 2026-07-25 | Python | CVE lookup impossible | unmerged feature branch |
| 7 | jol-core | **Concept/marketing repo**: standalone docs (multi-tenant framework, hybrid-cloud, EU website mgmt) + 2 one-off files (`gdpr_compliant_bitrix24_synchronization_implementation.py`, `audi_trail_dashboard_DPO.jsx`); no build system | 2026-07-26 (36 commits) | none | — | overlaps jol-infrastructure scope; README cites wrong org + MIT license (§3.3) |
| 8 | jol-devops | Runbooks, scripts, workflow YAML (15 md/16 yml+yaml) | 2026-08-03 | shell/YAML | n/a | boundary vs jol-infrastructure to confirm in Part 2 |
| 9 | jol-domain-taxonomy | **Stub**: README only | 2026-02-04 | — | — | consistent with README |
| 10 | jol-ecommerce-engine | Commerce engine (85 py + 5 tsx; PCI-DSS SAQ A scope) | 2026-08-12 | Python ≥3.12 + package.json | CVE lookup impossible; payment boundary CLOSED org-wide (ADR-005/007) | none observed |
| 11 | jol-frontend-platform | **Stub**: README only (extraction deferred per D-003/ADR-002) | 2026-02-04 | — | — | consistent with README + D-003 |
| 12 | jol-hermes-agents | Agent definitions/configs (24 md, 5 py, Docker) | 2026-08-03 | Python | CVE lookup impossible | overlaps jol-llm chatbot scope — boundary to define (feeds ASSUME-PAST-008) |
| 13 | jol-infrastructure | IaC: 43 tf + 150 yml/yaml + runbooks; VM specs; acceptance gate | 2026-08-24 (branch `docs/db-pilot-tenant-isolation-delta` = **open action O-003 in flight**) | Terraform/Ansible | n/a | none observed |
| 14 | jol-link-registry | URL/link registry service (45 py) | 2026-07-15 | Python, docker-compose | CVE lookup impossible | none observed |
| 15 | jol-llm | Self-hosted LLM platform home: model manifests (qwen3-32b-q8_0 production), compliance evidence, benchmarks; deploy assets live in jol-infrastructure | 2026-08-04 | docs + shell | manifests checksummed; 0-day prompt retention posture verified earlier this session | none observed |
| 16 | jol-mcp-servers | MCP server suite (62 py); unmerged work on `fix/ci-pipeline` | 2026-08-13 | Python | CVE lookup impossible | unmerged fix branch |
| 17 | jol-qoder-history | **AI agent session-transcript archive** (932 md/157 json), exports of sessions across jol-llm/jol-infrastructure etc.; **NO remote** | 2026-08-26 | n/a | — | **security findings §3.2** |
| 18 | jol-rag-server | RAG pipeline service: ingest/query routers, Art. 17 deletion endpoint (~3,000 LOC) | 2026-08-13 | Python ≥3.12 | CVE lookup impossible | corpus content unverified (feeds ASSUME-PAST-004) |
| 19 | jol-repo-template | Satellite template: kit files for new repos | 2026-07-16 | Python scaffolding | n/a | single commit since creation — drift-check CI coverage to verify |
| 20 | jol-scripts | Utility/migration scripts (18 py) | 2026-07-15 | Python | CVE lookup impossible | none observed |
| 21 | jol-security | Security tooling: 38 sh + 52 md documentation | 2026-07-25 (1 commit) | shell | n/a | docs-heavy; tooling execution status unverified |
| 22 | obsidian | **Knowledge vault**: 7 governance/architecture/operations sections (110 md + plugin assets) | 2026-01-27 (stalest) | n/a | — | **security findings §3.2** |

Workspace context: `/opt/jol/repos/jol-hub` is the Tier-0 coordinator; satellite
repos keep independent lifecycles (README §Sub-Projects convention).

## 3. Cross-cutting findings

### 3.1 README drift (feeds O-006)

| Direction | Repos | Evidence |
|---|---|---|
| Present locally, absent from README satellite table | jol-core, jol-llm, jol-rag-server, jol-hermes-agents, jol-qoder-history, obsidian | C3 inventory vs README L165–188 |
| In README, absent locally | none of the listed satellites | C3 |
| Content drift | README describes SQLAlchemy/Alembic/npm; reality is Django/pnpm; `countries/*/config/seo.json` claimed but absent (YAML in reality) | prior session verification + C4 |

### 3.2 Security findings (pattern-matched; no content reproduced)

| ID | Repo | Finding | Severity | Required action |
|---|---|---|---|---|
| S-01 | jol-qoder-history | AI session-transcript archive of platform repos; **no remote, no org governance, no retention policy**; secret-pattern matches present in session exports (C5) | HIGH | Review + sanitize or purge; if retained, it must gain a remote under journeyoflife-org with private visibility and retention policy, or be removed from the estate |
| S-02 | obsidian | Operational knowledge vault in git with a GitHub remote; secret-pattern match in `obsidian-local-rest-api` plugin config (C5); stale since 2026-01 | MEDIUM-HIGH | Content review for personal/operational data (B1-class exposure if personal data present); move to private storage; decide archive vs private-keep |
| S-03 | org-wide | Offline host: trufflehog/git-secrets UNAVAILABLE (UNAVAILABLE — never executed); compensating control = C5 pattern probe + repo-local `check-secrets` gates | — | Record as compensating control, not equivalence (hygiene-gate precedent 2026-08-26) |

### 3.3 Policy / identity findings

- **jol-core README** references GitHub org `JourneyOfLife` (wrong per ratified
  placement policy) and declares **MIT © 2025**, conflicting with the
  estate's Apache-2.0 posture (jol-hub LICENSE) and the 2026 baseline.
  Reason for flagging: identity drift inside a journeyoflife-org repo invites
  contributors to the wrong org.
- **License consistency**: jol-core MIT vs Apache-2.0 estate — reconcile at
  Part 2 disposition.

### 3.4 Dependency-health limitations (stated, not hidden)

CVE database, PyPI/npm registry freshness, and advisory feeds are unreachable
on this offline host. The table reports **pins as facts** and flags
"CVE lookup impossible" wherever a verdict would require them. Verified facts:
Python ≥3.12 consistent across inspected services; Django pinned 6.0.3 in
jol-hub (recorded platform value 6.0.7 — reconcile pin or memory at next
networked sync; `ASSUME-AUD-004`).

## 4. B1 policy-violation classification (issuable without repo contents)

Basis: ratified repo-placement policy — production repos reside under
`journeyoflife-org`; the `JourneyOfLife` user account is experimental/sandbox
only; repos handling personal data, payment data, or production secrets are
**prohibited** there (recorded org policy + jol-hub README maintainer
topology).

| Repo | Classification | Reason |
|---|---|---|
| `JourneyOfLife/catholic-digital-ministry` | **POLICY VIOLATION** | Production-grade ministry/web assets under the experimental account; content class (church/parish data) is plausibly personal-data-bearing → prohibited location |
| `JourneyOfLife/jol-master-website` | **POLICY VIOLATION** | The master website is by definition a production asset; prohibited location |

**Deferred to Part 2** (cannot be decided without inspecting contents):
transfer vs archive vs merge for each, inbound-link 301/redirect strategy,
CI re-baselining (branch protection, GPG enforcement, `CODEOWNERS`),
and secrets re-baselining (assume compromised: rotate anything ever committed
there, since history cannot be verified offline). The conservative standing
instruction until Part 2: **no new work in either repo; treat their secrets
as rotation candidates.**

## 5. Recommendations (Part 1, every one cited)

| # | Recommendation | Reason |
|---|---|---|
| R-1 | Sanitize/purge decision for jol-qoder-history before next agent-history export | S-01: uncontrolled transcript archive is an Art. 9 leak vector (transcripts can contain pastoral/personal content) |
| R-2 | Security review + relocation decision for obsidian | S-02: knowledge vaults accumulate credentials/personal data; public-org hosting of governance content is an exposure |
| R-3 | Fix jol-core README org reference + license, or merge scope into jol-infrastructure and archive | §3.3 identity drift misdirects contributors; concept docs duplicate ratified IaC estate |
| R-4 | Add the six drift repos to README satellite table (or record intentional exclusion) in the O-006 reconciliation | §3.1: README is currently a false inventory (audit-fail risk) |
| R-5 | Decide stub futures (jol-backend-platform, jol-frontend-platform, jol-domain-taxonomy) at Wave-0 exit | Stubs are honest today (D-003 defers extraction); they become dead code if extraction is cancelled without deletion |
| R-6 | Merge/close the two unmerged branches (jol-compliance `feature/initial-setup`, jol-mcp-servers `fix/ci-pipeline`) | Open branches with no merge date = audit noise + SOC 2 CC8.1 change-control gaps |
| R-7 | Clone the three gate repos to unblock Part 2 | Entry gate still failing; Part 2 cannot start otherwise |

## 6. Assumption Register

| ID | Assumption | Basis | Review trigger |
|---|---|---|---|
| ASSUME-AUD-001 | All local clones mirror their remotes' default branches closely (no local-only divergence) | Offline — fetch impossible; only local refs inspected | First networked sync: `git fetch --dry-run` per repo |
| ASSUME-AUD-002 | `obsidian` contains no personal data beyond what the §3.2 review will find | Not yet content-reviewed | R-2 review |
| ASSUME-AUD-003 | org-wide git policy (GPG signing, branch protection) is actually enforced on GitHub, not just documented | Offline — GitHub settings unverifiable | First networked access |
| ASSUME-AUD-004 | jol-hub Django pin 6.0.3 is authoritative and the recorded 6.0.7 is stale (requirements.txt wins over memory) | Code over memory precedence | Next networked sync / memory correction |
| ASSUME-AUD-005 | The two violating repos contain no secrets that have already leaked via their public hosting | Unverifiable offline | Part 2 history review; secrets rotation either way (R-7 + §4 standing instruction) |

## 7. Exit-criteria self-check

| Criterion | Status |
|---|---|
| Every local repo in the table | §2: 22/22 git repos |
| Every recommendation cites a reason | §5 reason column |
| Provenance line for every command | §1, C1–C5 |
| B1 classification issued; mechanics deferred | §4 |
| Assumption Register present | §6 |
| No code changes | docs-only; verified by `git status` at commit time |
