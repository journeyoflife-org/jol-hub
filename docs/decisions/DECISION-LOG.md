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

## Open questions

| # | Question | Owner | Status |
|---|---|---|---|
| O-001 | **Polish (PL) language for the LT pilot** — include at launch or defer? Architecture already supports it via `packages/i18n` extension (lt/en/ru live today) | Platform owner | OPEN (MASTER-PROMPT §11) |
| O-002 | **Wave-1 site count reconciliation**: MASTER-PROMPT §4/§15 say "23 Wave-1 sites" (diocese + 5 × (deanery + church + funeral + cleaning) = 21 listed, counted 23 with the cathedral). The ratified Wave-1 hierarchy (2026-08-26) specifies 30 service sites + diocese = **31**, with each parish church also carrying its own funeral home and cleaning service. Implementation baseline as of 2026-08-26: **24 pilot tenants** (23 of the 31-site tree + the VIP cathedral reference). Delta to close: 8 church-level service sites (`zagare-funeral`, `zagare-cleaning`, `kraziai-funeral`, `kraziai-cleaning`, `lygumai-funeral`, `lygumai-cleaning`, `baisogala-funeral`, `baisogala-cleaning`) | Platform architect | OPEN — scheduled as immediate follow-up |
| O-003 | Spec delta for `jol-infrastructure/docs/servers/jol-db-pilot-lt01.md` against ADR-001 (change-controlled issue in jol-infrastructure) | DevOps | OPEN ACTION (ADR-001) |
| O-004 | MASTER-PROMPT §3 estate table describes the pre-dismantlement frontend (12 `lt-*` demo apps). Reality since the demolition step: ONE template-renderer + seed fixtures; `master-site`/`parish-template` remain as legacy extraction candidates. Table is retained as ratified ground truth; this entry records the verified delta | Platform architect | RECORDED |
| O-005 | Hygiene-gate candidate list staleness: `frontend/apps/parish-template/.env.local` no longer exists (app directory removed post-ratification); `backend/.env` / `backend/django/.env` exist in the working tree but are **untracked** (verified 2026-08-26: `git ls-files` returns only `.env.example` templates) | Platform architect | RECORDED |
| O-006 | README reconciliation (SQLAlchemy/Alembic→Django, npm→pnpm) — MASTER-PROMPT §3 conflict item; not yet executed | Platform architect | OPEN |

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
