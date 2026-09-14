# QODER.md

Behavioral guidelines to reduce common LLM coding mistakes when using Qoder in PyCharm. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.
- Prefer PyCharm's built-in refactoring tools (Rename, Extract Method, Move, etc.) over manual text manipulation when the IDE can do it safely.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```text
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## Project-Specific Guidelines — jol-hub

JOL-HUB is the Journey Of Life Lithuania pilot monorepo: Django backend
(`backend/django/`), Turborepo/pnpm frontend (`frontend/`), data pipelines
(`data/`), and on-prem infra manifests (`infra/`). Every change carries
compliance weight (GDPR, SOC 2 Type II, ISO 27001:2022, PCI-DSS SAQ A).

### Toolchain — non-negotiables

- Frontend is **pnpm-only** (`pnpm@10.30.3` via **corepack**). Bare `pnpm`/
  `npm` are NOT on PATH and fail inside npm-script subshells — root and
  package scripts must call tools directly or use `corepack pnpm`.
- **Never run `npm install`** in `frontend/`: arborist crashes on the pnpm
  symlink tree.
- The host is **offline**: installs come from the pnpm store; browser-bound
  gates (Playwright browsers, Lighthouse, trufflehog, git-secrets) are
  unavailable — compensating gates exist (`check-secrets`, boundary scan,
  axe, contrast). Never claim an unavailable gate as executed.

### Architecture invariants

- **ADR-001**: schema-per-tenant; tenants resolve by subdomain or `X-Tenant`.
  Unknown tenants get the generic 404 — **never enumerate tenants**
  (GDPR Art. 9 / SOC 2 CC6.1).
- **Tenants are data, not apps**: new sites are seed-data fixtures
  (`frontend/packages/seed-data/src/fixtures/tenants/`), never new apps.
  Never import from deleted `lt-*` demo apps.
- **ADR-002**: frontend extraction to `jol-frontend-platform` is deferred;
  build inside this monorepo, keep packages extractable.
- **On-prem only**: Proxmox/nginx assumptions; **no AWS assumptions**, no
  cloud CDN patterns, no AI brands named as requirements.

### Payment boundary (ADR-009 — ratified local decision; unrelated: jol-infrastructure ADR-005 is GitOps workflow; historical "ADR-0005 Model A" lineage absorbed by ADR-009, see O-016)

- The pilot boundary is **CLOSED**: test mode only, no live transactions
  until SAQ A is verified.
- `scripts/check-payment-boundary.sh` must pass before commits: no
  server-side Stripe SDK, no keys/endpoints anywhere in the tree.
- The literals `STRIPE_SECRET` / `STRIPE_API_KEY` are forbidden **even in
  comments and examples** — the guard scans the whole tree.

### Secrets — never in git

- No tokens, keys, PEMs, or real env values. Only `*.example` templates are
  committed; real values are injected from Vaultwarden/Ansible Vault at
  deploy time (`.env.production` / `.env.staging` are git-ignored).
- Run `check-secrets` after builds; never print or echo secrets; SOPS/age
  patterns per jol-infrastructure ADR-003 (secrets management) apply repo-wide.

### Commits, branches, gates

- Conventional Commits with the **closed scope list**: `frontend, ui, i18n,
  auth, commerce, crm, seo, a11y, tenant, template, editor, infra,
  compliance`; body plus `Refs: MASTER-PROMPT §N`.
- GPG-signed commits; `main` needs 2 approvals, `develop` 1; pre-commit runs
  detect-secrets, ruff, ruff-format, mypy, bandit. Never `--no-verify`.
- The host-wrapper change to `backend/manage.py` is intentionally kept out
  of feature commits — don't commit it unless asked.
- Frontend gates before committing: `corepack pnpm test:unit`, package
  `verify` chains (ui, i18n), `check-perf` budget, `check-a11y`, payment
  boundary.

### Backend conventions

- The Django project root is `backend/django/` (Docker WORKDIR);
  `backend/manage.py` is a thin host wrapper. Use `backend/venv`.
- Migrations stay backward-compatible (add columns, don't drop) so rollback
  is a revert, not a rescue.

### Rollback

- Every change states how to revert it. Deployments go through
  `scripts/deploy.sh` (snapshot-gated) / `scripts/rollback.sh`; incidents
  follow `frontend/docs/wave0/EMERGENCY-ROLLBACK.md` (P0/P1 post-mortem
  within 24 h). If you cannot describe the rollback, the change is not ready.
