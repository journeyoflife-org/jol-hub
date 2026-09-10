# Ten Vertical Front-Ends — Implementation Programme

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver ten separately-deployed vertical front-ends (basilica, cathedral, diocese, deanery, parish church, funeral, cemetery care, protestant, orthodox, other churches) for the Lithuanian pilot, each a reusable professional template for all subsequent sites of that vertical, extensible to LV/EE and 27 EU countries.

**Architecture:** Hub-and-spoke. `jol-hub` remains the Tier-0 platform source and governance root; twelve `@jol-hub/*` packages become **published, versioned artifacts**; ten spoke repositories consume them and contain **only** vertical composition. Eleven invariants (§6 of the architecture blueprint) are enforced as CI tests, not review discipline.

**Tech Stack:** Next.js 14 App Router · React 18 · TypeScript strict · Turborepo · **pnpm 10.30.3 only (never npm in `frontend/`)** · Tailwind + design tokens · PostgreSQL 16 schema-per-tenant + RLS · Django · Proxmox VE 9.2 · PBS 4.2 · SOPS/age · Verdaccio (or GitHub Packages) · GitHub Actions reusable workflows.

---

## Verified starting state — 2026-09-11

| Fact | Measured value |
|---|---|
| Branch | `feat/pages-step6`, HEAD `709249b9` |
| Unpushed commits | **2** — `709249b9` (services family pages), `845f1a65` (push record) |
| Working tree | **DIRTY, 3 items** — ` M backend/manage.py`, `?? docs/compliance/evidence/jol-hub-scope-audit-20260901.md`, `?? docs/decisions/DECISION-LOG.md.bak.20260826-2102` |
| `jol-site-*` directories | **10, all `commits=0`, `remotes=` (none)** — empty `git init` shells |
| `frontend/packages/*` | **12** — a11y, auth, bitrix-sdk, commerce, i18n, observability, perf, seed-data, seo, tenant-resolver, testing, ui |
| Publishable packages | **0 of 12** — 11 carry `"private": true`; all export raw `./src/*.ts`; none has a build step, `dist/`, or `files` allowlist |
| `jol-repo-template` | **Python** template (`pyproject.toml`, `Makefile`, `src`, `tests`) — unusable for Next.js spokes |
| Tooling present | `pnpm` 10.30.3 (`/usr/bin` + `~/.local/bin`), `corepack`, `node` 20.20.2, `gh`, `docker` |
| `/opt/jol/backups` | exists (created Aug 14) |
| Canonical `Vertical` count | **11** (incl. `diaconate`) |
| ROPA records | **10** dirs in `data/exports/ropa/lt/` — `diaconate` absent; `greek_catholic`/`cemetery` use fixture-era names |
| CI workflows in jol-hub | 8, ~92 KB — `ci`, `cd`, `compliance-check`, `entity-apps`, `entity-apps-deploy`, `frontend-test`, `payment-boundary-guard`, `security-scan` |
| GitHub Actions | **Suspended for non-payment** (O-020); owner states payment tomorrow |

---

## Blocking findings discovered during planning

These are **not** opinions. Each is measured, and each blocks a later phase.

### BF-1 (P0) — An undecided scope audit gates two of your ten front-ends

`docs/compliance/evidence/jol-hub-scope-audit-20260901.md` — **untracked, 61 lines, dated 2026-09-01** — records a grep audit for `funeral|cemetery|memorial|mortuary|burial` finding **319 files** (frontend 239, backend 38, docs 16, data 11, countries 8, tools 5, scripts 1, README 1, .github 1), and ends:

> **"Decision Required — User must approve Option A or Option B before proceeding to Phase 1."**
> Option A: deprecate funeral/cemetery/memorial features, mark "legacy — not for Catholic mission use".
> Option B: remove all 319 files' references. **HIGH RISK**.

I grepped `docs/decisions/*.md` for `scope audit|Option A|Option B|deprecate funeral|out-of-scope`: **one unrelated match**. There is **no DECISION-LOG entry, no ADR, and no gate record** dispositioning this audit. It has been orphaned for ten days.

**It also contradicts ratified scope.** MASTER-PROMPT §5 lists as ratified verticals: *"9. Funeral Homes (+commercial) · 10. Cemetery Graves & Monument Cleaning (+commercial)"*. §4 Wave-1 requires *"5 Deanery clusters, each = Deanery site + 1 church + **1 funeral home + 1 cleaning service**"*. Ten funeral/cleaning tenants are live in `registry.ts` (`siauliai-funeral`, `zagare-funeral`, `kraziai-funeral`, `lygumai-funeral`, `baisogala-funeral`, `joniskis-funeral`, `kursenai-funeral`, + matching `-cleaning`). Commit `1e6649be` is literally `feat(template): professional front-end for the cemetery-care reference site`, and `709249b9` (unpushed) implements the funeral + cemetery family pages.

**Disposition required:** both Option A and Option B contradict §5 and §4. Recommended: record the audit as **SUPERSEDED-BY-RATIFIED-SCOPE** and commit it as evidence. Building `jol-site-funeral` and `jol-site-grave-care` on top of an undecided deprecation proposal is how you get ten front-ends for verticals the platform has formally proposed removing.

### BF-2 (P0) — Two unpushed commits and a dirty tree

Correcting my previous turn: it is **2**, not 1. `845f1a65` records the push of `ebda9132` and is itself unpushed (the documented "recurring one-commit tail"); `709249b9` is the services-family implementation for four verticals. **Both exist only on this machine, since Aug 29 — 13 days against a 24-hour RPO.**

`backend/manage.py` is modified but uncommitted. The diff is a legitimate, well-documented fix: the root `manage.py` becomes a wrapper that re-execs `backend/django/manage.py` so import roots (`core`, `apps`) and env-file discovery match the container WORKDIR, with an explicit warning never to put the wrapper directory on `sys.path` (the local `django/` folder would shadow the framework package). **It should be committed, not left dirty** — a dirty tree cannot produce a clean bundle, a clean spoke scaffold, or an honest gate baseline.

### BF-3 (P0) — Zero of twelve packages are publishable

Variant B requires spokes to consume `@jol-hub/*` as versioned dependencies. Measured reality:

| Defect | Evidence | Consequence |
|---|---|---|
| `"private": true` on 11 of 12 | `a11y`, `auth`, `bitrix-sdk`, `commerce`, `i18n`, `seo`, + others | `pnpm publish` **refuses outright** |
| `exports`/`main`/`types` point at raw `./src/*.ts` | `seo`: `".": "./src/index.ts"`; `i18n`: 8 subpaths all `./src/*`; `ui`: 17 subpaths | Consumers must compile your TypeScript from `node_modules`; no versioned artifact exists |
| No build step, no `dist/`, no `files` allowlist | all 12 | Nothing to publish |
| `workspace:*` dependencies | `ui` → `@jol-hub/i18n: workspace:*` | Requires publish-time resolution **and** the dependency published first |
| Wildcard export | `ui`: `"./components/*": "./src/components/*/index.ts"` | Cannot be mirrored to `dist/` without a build |

**This is the critical path, and it is ADR-002's own unmet trigger condition** — *"packages (`ui`, `i18n`, `auth`, `bitrix-sdk`) have stable public APIs."*

### BF-4 (P1) — Dangling export from the O-021 PSP-widget removal

`frontend/packages/ui/package.json:16` still declares:

```json
"./components/donation": "./src/components/donation/index.ts"
```

Glob for `frontend/packages/ui/src/components/donation/**` returns **0 files** — D-041 deleted 24 files across both widget trees. The export survived the deletion. Any consumer resolving `@jol-hub/ui/components/donation` gets module-not-found, and the manifest still advertises a donation component that the payment-boundary remediation removed. **Fix in Phase 0** — it is a one-line deletion and it will break the first publish dry-run otherwise.

### BF-5 (P1) — There is no front-end repository template

`jol-repo-template` is a **Python** scaffold (`pyproject.toml`, `Makefile`, `src/`, `tests/`). That is why the ten `jol-site-*` shells contain `main.py` and `.venv`. Scaffolding Next.js spokes from it produces the same category error the Via-Vitae CHANGELOG already had to clean up (*"`main.py` … caused Python linting, type checking and CodeQL analysis to run against non-Python repositories"*).

**A new `jol-frontend-repo-template` must be created before any spoke is cut.**

### BF-6 (P2) — The architecture document that caused this is still stale

`docs/architecture/system-overview.md` (*"Last Updated: March 2026"*) describes `frontend/react` SPAs, Vite, Redux/Zustand, Kubernetes, CDN/Edge, S3, Elasticsearch, GitLab CI, OAuth 2.0, RPO < 15 min, multi-region failover, and root dirs `entities/`, `ops/`, `tests/` — **none of which exist**. Its "Future Considerations: microservices migration path" is the sentence that makes ten repositories look like the natural design. Supersede it in Phase 1 or the next architect repeats this cycle.

---

## Decision lines still required

```
scope-audit-bf1   = SUPERSEDED-BY-RATIFIED-SCOPE | OPTION-A | OPTION-B
vertical-count    = ELEVEN (add jol-site-diaconate) | TEN (descope diaconate + log entry)
repo-naming       = CANONICAL (jol-site-other-church, jol-site-cemetery-care) | AS-YOUR-LIST
registry          = VERDACCIO-ON-PREM | GITHUB-PACKAGES
commerce-scope    = DISPLAY-ONLY+HANDOFF (no unfreeze) | UNFREEZE (needs ADR-009 §4 SAQ A path)
protestant-ecom   = GRANT | DENY          (expands MASTER-PROMPT §5 entitlements)
other-church-ecom = GRANT | DENY          (expands MASTER-PROMPT §5 entitlements)
page-counts       = MODULES (D-005 stands) | PAGE-COUNTS (requires superseding D-005)
```

**Assumptions I am planning against** (override any of them and the plan changes): `vertical-count = TEN`, `repo-naming = CANONICAL`, `commerce-scope = DISPLAY-ONLY+HANDOFF`, `page-counts = MODULES`, `scope-audit-bf1 = SUPERSEDED-BY-RATIFIED-SCOPE`. `registry` is left open — Phase 2 Task 2.4 works with either.

---

## Honest schedule — read this before choosing

| Variant | User-visible outcome | Estimated elapsed | Blocking work |
|---|---|---|---|
| **A** — one codebase, ten build targets | 10 deployed front-ends, 10 URLs, 10 brands | **~4–6 working days** | Per-vertical template differentiation; 10 build/deploy configs |
| **B** — ten repositories (this plan) | Identical user-visible outcome | **~15–20 working days** | BF-3 (12 packages publishable), BF-5 (frontend template), registry, 10× CI, 10× satellite kit |

The delta is almost entirely BF-3 and BF-5. **If "as soon as possible" outranks "separate repositories", Variant A delivers the same ten front-ends roughly four times faster** and stays reversible into B later. This plan executes B, as instructed.

Critical path: `Phase 0 → Phase 1 → 2.1 → 2.2/2.3 → 2.4 → 2.6 → 2.7/2.8 → Phase 3 → Phase 4`. Phase 2.5 (block schema) and Phase 1.5 (ROPA) are parallelisable.

---

# PHASE 0 — Stabilise (today, ~1 hour)

Nothing downstream is safe until the tree is clean and the work is off-site. All of Phase 0 is reversible and touches no topology.

### Task 0.1: Bundle backup of jol-hub to PBS

**Files:** creates `/opt/jol/backups/jol-hub-20260911.bundle`

- [ ] **Step 1: Create the bundle**

```bash
cd /opt/jol/repos/jol-hub
git bundle create /opt/jol/backups/jol-hub-20260911.bundle --all
```

- [ ] **Step 2: Verify the bundle is complete**

```bash
git bundle verify /opt/jol/backups/jol-hub-20260911.bundle
```

Expected: `is okay` and a list of refs including `feat/pages-step6`.

- [ ] **Step 3: Confirm the two unpushed commits are inside it**

```bash
git bundle list-heads /opt/jol/backups/jol-hub-20260911.bundle | grep -E '709249b9|845f1a65'
```

Expected: both shas present. If either is absent, **stop** — the bundle did not capture the work.

- [ ] **Step 4: Copy to PBS and record**

Copy the bundle to the PBS-backed location, then note the path and sha256 in the Phase 0 commit message. Do not commit the bundle itself.

### Task 0.2: Commit the `backend/manage.py` wrapper fix

**Files:** `backend/manage.py` (already modified in the working tree)

- [ ] **Step 1: Re-read the diff and confirm intent**

```bash
cd /opt/jol/repos/jol-hub && git --no-pager diff backend/manage.py
```

Expected: the wrapper described in BF-2 — `PROJECT_DIR = Path(__file__).resolve().parent / "django"`, `os.chdir`, `sys.path[0]` replacement, `compile()` + `exec()`.

- [ ] **Step 2: Prove it works before committing**

```bash
cd /opt/jol/repos/jol-hub && python backend/manage.py check
```

Expected: `System check identified no issues`. Any traceback means the wrapper is broken — **do not commit**; report instead.

- [ ] **Step 3: Commit**

```bash
git add backend/manage.py
git commit -m "fix(backend): make root manage.py a wrapper for backend/django

Re-execs the inner manage.py so import roots ('core', 'apps') and env-file
discovery match the container WORKDIR. Never places the wrapper directory on
sys.path — the local 'django/' folder would shadow the framework package.

Refs: MASTER-PROMPT §3"
```

### Task 0.3: Disposition and commit the orphaned scope audit (BF-1)

**Files:** modifies `docs/compliance/evidence/jol-hub-scope-audit-20260901.md`; appends to `docs/decisions/DECISION-LOG.md`

- [ ] **Step 1: Append a disposition block to the audit file** (do not alter the original findings — append only)

Append after line 61:

```markdown

---

## Disposition (2026-09-11)

**Verdict: SUPERSEDED-BY-RATIFIED-SCOPE. Neither Option A nor Option B is adopted.**

Both options contradict ratified scope:

- MASTER-PROMPT §5 lists as ratified verticals: "9. Funeral Homes (+commercial)"
  and "10. Cemetery Graves & Monument Cleaning (+commercial)".
- MASTER-PROMPT §4 Wave-1 requires 5 deanery clusters, each including
  1 funeral home and 1 cleaning service.
- Ten funeral/cleaning tenants are live in
  `frontend/packages/tenant-resolver/src/registry.ts`.
- `1e6649be feat(template): professional front-end for the cemetery-care
  reference site` and `709249b9 feat(frontend): services family pages
  (deaneries, other churches, funeral, cemetery)` implement these verticals.

Process defect recorded: this file was authored as evidence on 2026-09-01 but
left **untracked** and its "Decision Required" was never entered in
DECISION-LOG. Untracked evidence is not part of the audit trail (SOC 2 CC3.1).
Standing correction: any file under `docs/compliance/evidence/` is committed in
the same change that creates it.
```

- [ ] **Step 2: Append a DECISION-LOG entry** (append-only — never edit an existing row)

Add as the next `D-0nn` row in the *Ratified decisions* table of `docs/decisions/DECISION-LOG.md`:

```markdown
| D-062 | 2026-09-11 | **Scope audit of 2026-09-01 DISPOSITIONED: SUPERSEDED-BY-RATIFIED-SCOPE.** Neither Option A (deprecate funeral/cemetery) nor Option B (remove 319 files) is adopted — both contradict MASTER-PROMPT §5 verticals 9/10 and §4 Wave-1 structure, and ten funeral/cleaning tenants are live. Process defect recorded: the evidence file was left untracked for ten days and its "Decision Required" never entered this log; standing correction is that `docs/compliance/evidence/` files are committed in the creating change. Unblocks the ten-vertical front-end programme. | Platform owner | The audit's Option A / Option B proposal |
```

- [ ] **Step 3: Commit both**

```bash
git add docs/compliance/evidence/jol-hub-scope-audit-20260901.md docs/decisions/DECISION-LOG.md
git commit -m "docs(compliance): disposition the 2026-09-01 scope audit as superseded

Option A/B both contradict ratified MASTER-PROMPT §5 verticals 9-10 and §4
Wave-1. Evidence file was untracked for ten days; committed now with the
standing correction that evidence is committed in the creating change.

Refs: MASTER-PROMPT §4, §5 · SOC 2 CC3.1"
```

### Task 0.4: Clear the stray `.bak` artifact

**Files:** `docs/decisions/DECISION-LOG.md.bak.20260826-2102`

- [ ] **Step 1: Confirm it is a stale backup, not the only copy of anything**

```bash
cd /opt/jol/repos/jol-hub
diff <(git show HEAD:docs/decisions/DECISION-LOG.md) docs/decisions/DECISION-LOG.md.bak.20260826-2102 | head -40
```

Expected: differences only where the log has grown since Aug 26. If the `.bak` contains rows **absent** from the current log, **stop and report** — that would mean lost decision history.

- [ ] **Step 2: Delete it and gitignore the pattern**

```bash
rm docs/decisions/DECISION-LOG.md.bak.20260826-2102
printf '\n# Change-control backups (§2.7) are transient; never tracked\n*.bak.[0-9]*\n' >> .gitignore
git add .gitignore
git commit -m "chore(repo): remove stale DECISION-LOG backup, gitignore the pattern

Change-control .bak.<timestamp> files are transient working copies under
MASTER-PROMPT §2.7 and must not accumulate untracked in the tree.

Refs: MASTER-PROMPT §2.7"
```

### Task 0.5: Fix the dangling donation export (BF-4)

**Files:** `frontend/packages/ui/package.json:16`

- [ ] **Step 1: Write the failing check**

```bash
cd /opt/jol/repos/jol-hub/frontend
node -e "
const fs=require('fs');
const pkg=JSON.parse(fs.readFileSync('packages/ui/package.json','utf8'));
const missing=Object.entries(pkg.exports||{})
  .flatMap(([k,v])=>Array.isArray(v)?v:[v])
  .filter(p=>typeof p==='string' && p.startsWith('./src/') && !fs.existsSync('packages/ui/'+p));
if(missing.length){console.error('DANGLING EXPORTS:',missing.join(', '));process.exit(1);}
console.log('all exports resolve');
"
```

Expected: **FAIL** with `DANGLING EXPORTS: ./src/components/donation/index.ts`.

- [ ] **Step 2: Remove the dangling line**

Delete line 16 (`"./components/donation": "./src/components/donation/index.ts",`) from `frontend/packages/ui/package.json`. Leave every other export untouched.

- [ ] **Step 3: Re-run the check and the package gate**

```bash
cd /opt/jol/repos/jol-hub/frontend
node -e "
const fs=require('fs');
const pkg=JSON.parse(fs.readFileSync('packages/ui/package.json','utf8'));
const missing=Object.entries(pkg.exports||{})
  .flatMap(([k,v])=>Array.isArray(v)?v:[v])
  .filter(p=>typeof p==='string' && p.startsWith('./src/') && !fs.existsSync('packages/ui/'+p));
if(missing.length){console.error('DANGLING EXPORTS:',missing.join(', '));process.exit(1);}
console.log('all exports resolve');
"
pnpm --filter @jol-hub/ui verify
```

Expected: `all exports resolve`, then `verify` exit 0 (tsc + tests + check-contrast + check-a11y).

- [ ] **Step 4: Confirm the payment-boundary guard is still clean**

```bash
cd /opt/jol/repos/jol-hub && bash scripts/check-payment-boundary.sh; echo "exit=$?"
```

Expected: `exit=0`.

- [ ] **Step 5: Commit**

```bash
git add frontend/packages/ui/package.json
git commit -m "fix(ui): remove dangling components/donation export

The donation widget tree was deleted by O-021 staged removal (D-041, 24 files)
but its export subpath survived in the manifest. Consumers resolving
@jol-hub/ui/components/donation got module-not-found, and the manifest still
advertised a component the payment-boundary remediation removed.

Refs: ADR-009 · D-041 · O-021"
```

### Task 0.6: Push, once Actions billing is restored

- [ ] **Step 1: Confirm the freeze is lifted**

```bash
cd /opt/jol/repos/jol-hub && gh api repos/journeyoflife-org/jol-hub --jq .full_name
gh run list --repo journeyoflife-org/jol-hub --limit 3
```

Expected: the API call succeeds and `gh run list` returns runs that are **not** `startup_failure`. If runs still show `startup_failure`, billing is not yet restored — **do not chase** (standing policy D-040/O-020); report and wait.

- [ ] **Step 2: Push**

Requires an explicit `push=PUSH` decision line.

```bash
cd /opt/jol/repos/jol-hub
git push origin feat/pages-step6
git --no-pager log --oneline origin/feat/pages-step6..HEAD
```

Expected: push exit 0; the second command prints **nothing** (zero unpushed).

- [ ] **Step 3: Record the push and close O-020**

Append to `docs/decisions/DECISION-LOG.md`: a push-record row (range, exit code, unpushed count at push time) **and** the O-020 closure row with root cause = Actions billing suspension, owner-provided 2026-09-11, fix = payment. Move O-020 from *Open questions* to closed by appending the resolution to its cell — never delete the row.

---

# PHASE 1 — Ratify (~2 hours)

CONTRIBUTING §9: *"For major architectural changes, create an ADR **before** implementation."*

### Task 1.1: Author ADR-011 (hub-and-spoke front-end topology)

**Files:** create `docs/decisions/ADR-011-ten-vertical-frontends-hub-and-spoke.md`

- [ ] **Step 1: Write the ADR** with sections Status / Context / Decision / Consequences / Alternatives Considered / Compliance. It must state explicitly:
  - **Supersedes** ADR-002 and DECISION-LOG D-003, D-004.
  - **Amends** MASTER-PROMPT §9 (per-entity apps) and §12 (no parallel codebase) — §12 is satisfied by INV-1/INV-2, not violated.
  - **Adds** Via-Vitae (20 repos, proprietary ARR licence, `jolarca.com`, Next 15/React 19, trunk-based, DCO) to the §3 estate table as the brand/marketing tree, with the segregation rule analogous to §2.2.
  - The eleven invariants, each with its enforcement mechanism.
  - The accepted risk: denomination literals in repository names are ungatable (INV-7 residue; O-022/D-059 precedent).
  - Reversibility condition: the topology collapses back to Variant A **only while INV-1…INV-4 hold**.
  - The four §0 annexes: security / compliance / cross-repo / rollback.
- [ ] **Step 2: Validate against the ADR template shape** used by ADR-001/002/009/010 (Status → Context → Decision → Consequences → Alternatives → Compliance).
- [ ] **Step 3: Commit** as `docs(decisions): ADR-011 hub-and-spoke front-end topology`.

### Task 1.2: Append the superseding DECISION-LOG entries

**Files:** `docs/decisions/DECISION-LOG.md` (append-only)

- [ ] **Step 1: Append rows** for: ADR-011 acceptance; D-003/D-004 superseded; the vertical-count decision (ten, with `diaconate` descoped or added); the repo-naming decision; the registry decision; commerce scope (display-only + handoff, D-052 freeze **not** lifted); Protestant/Other-Church commerce expansion granted or denied; page-count position (D-005 stands).
- [ ] **Step 2: Strike through D-003 and D-004 in prose** — per the log's own header, superseded decisions are struck through, never deleted.
- [ ] **Step 3: Commit** as `docs(compliance): record ADR-011 ratifications and supersede D-003/D-004`.

### Task 1.3: Supersede the stale architecture document (BF-6)

**Files:** rewrite `docs/architecture/system-overview.md`; create `docs/architecture/frontend-topology-10-verticals.md`

- [ ] **Step 1: Move the current §0 blueprint** (system context, component inventory, technology stack, interaction diagrams, invariants, compliance control map, vertical matrix, deployment topology) into `frontend-topology-10-verticals.md`.
- [ ] **Step 2: Correct `system-overview.md`** against verified reality: `frontend/apps/template-renderer` + 12 packages (not `frontend/react` SPAs); Next.js 14 App Router (not Vite/Redux); Proxmox VE 9.2 (not Kubernetes); self-hosted/EU caching (not CDN/Edge + S3); Python 3.12+, PostgreSQL 16; GitHub Actions only (not GitLab); OAuth 2.1; **RPO 24 h / RTO 4 h** (not RPO 15 min + multi-region); remove the non-existent `entities/`, `ops/`, root `tests/` from the structure diagram; delete the "microservices migration path" future-consideration or reframe it as ADR-011.
- [ ] **Step 3: Add a supersession note** at the top of `system-overview.md` pointing at ADR-011 and the new topology doc, with the March-2026 drift explained.
- [ ] **Step 4: Commit** as `docs(architecture): supersede March-2026 system overview; add ten-vertical topology`.

### Task 1.4: Reconcile the vertical taxonomy and repository names

**Files:** create `docs/architecture/vertical-taxonomy-mapping.md`

- [ ] **Step 1: Write the reconciliation table** — repo name ↔ canonical `Vertical` ↔ ROPA dir ↔ page package ↔ layout family ↔ template ↔ `vertical-theme.ts` entry ↔ §5 commercial flag. Source rows from the architecture blueprint §8.
- [ ] **Step 2: Lock the naming decisions**: `jol-site-other-church` (not `jol-site-church`, which collides with `jol-site-parish`); `jol-site-cemetery-care` (aligns with canonical `cemetery-cleaning`); `jol-site-deanery` singular. Record each with a one-line rationale.
- [ ] **Step 3: Record the `diaconate` disposition** — descoped with rationale, or added as an eleventh spoke.
- [ ] **Step 4: Commit** as `docs(architecture): vertical taxonomy and repository naming reconciliation`.

### Task 1.5: Fix the two ROPA defects (R-1, R-2)

**Files:** `data/exports/ropa/lt/*`

- [ ] **Step 1: R-2 — align ROPA directory names to the canonical taxonomy.** Rename `greek_catholic` → `other-church` and `cemetery` → `cemetery-cleaning`, and update the `vertical`/entity identifiers **inside** each JSON so a ROPA record joins mechanically to a tenant slug. Verify the internal id fields (`lt-catholic-basilica-001` style) still match `countries/lt/examples/**/entity.yml`.
- [ ] **Step 2: R-1 — resolve `diaconate`.** Either author `data/exports/ropa/lt/diaconate/lt-catholic-diaconate-001_ropa.json` following the existing record shape, or record the descope in Task 1.4 and leave it absent. **Do not leave a ratified commercial vertical with processing capability and no Art. 30 record.**
- [ ] **Step 3: Run the existing compliance gates**

```bash
cd /opt/jol/repos/jol-hub/frontend
pnpm compliance:full; echo "compliance=$?"
pnpm gdpr:validate;  echo "gdpr=$?"
```

Expected: both exit 0.

- [ ] **Step 4: Commit** as `fix(compliance): align ROPA records to canonical vertical taxonomy`.

---

# PHASE 2 — Platformise (~2–3 weeks; the critical path)

### Task 2.1: Package publishability audit and dependency graph

**Files:** create `docs/architecture/package-publish-plan.md`

- [ ] **Step 1: Generate the internal dependency graph**

```bash
cd /opt/jol/repos/jol-hub/frontend
corepack enable --install-directory ~/.local/bin 2>/dev/null || true
pnpm list --depth 1 --filter "./packages/*" --json > /tmp/pkg-graph.json
node -e "
const g=require('/tmp/pkg-graph.json');
for(const p of g){
  const d=Object.entries({...p.dependencies,...p.devDependencies})
    .filter(([k])=>k.startsWith('@jol-hub/')).map(([k,v])=>k+'@'+v);
  console.log(p.name.padEnd(28), d.join(' ')||'(leaf)');
}"
```

- [ ] **Step 2: Topologically sort** into publish waves. Known edges: `ui → i18n`; `tenant-resolver → seed-data`. Compute the rest from Step 1 output — do not guess.
- [ ] **Step 3: Record per package**: `private` flag, export subpath count, whether exports point at `src/` or `dist/`, presence of a build script, presence of `files`, CSS/asset exports, wildcard exports. `ui` is the hardest: 17 subpaths including `"./components/*"` wildcard, two CSS files and a Tailwind config.
- [ ] **Step 4: Commit** the plan document.

### Task 2.2: Add a real build to every package

**Files:** modify all 12 `frontend/packages/*/package.json`; add `tsup.config.ts` per package

- [ ] **Step 1: Add `tsup` as a shared dev dependency** and a root `build:packages` turbo task.
- [ ] **Step 2: Per package, in dependency order**, set: remove `"private": true`; add `"build": "tsup"`; emit ESM + CJS + `.d.ts` to `dist/`; rewrite `exports` so every subpath has `types` + `import` + `require` conditions pointing into `dist/`; add `"files": ["dist"]`; add `"publishConfig": { "registry": "<from Task 2.4>", "access": "restricted" }`; add `"sideEffects"` correctly (`ui` must list its CSS files or Tailwind styles will be tree-shaken away).
- [ ] **Step 3: Resolve the `ui` wildcard export.** `"./components/*": "./src/components/*/index.ts"` cannot survive a build. Enumerate the component directories and emit an explicit subpath per component, generated by a script so it cannot drift.
- [ ] **Step 4: Prove each build in isolation**

```bash
cd /opt/jol/repos/jol-hub/frontend
pnpm --filter @jol-hub/<pkg> build && pnpm --filter @jol-hub/<pkg> verify
```

Expected: `dist/` populated; `verify` exit 0.

- [ ] **Step 5: Prove the package works from a clean external consumer.** For each package, in a throwaway directory outside the workspace, `pnpm init`, install the built tarball (`pnpm pack` then `pnpm add <tarball>`), and import every exported subpath. **This is the test that catches BF-4-class defects.** A package that only works inside the workspace is not publishable.
- [ ] **Step 6: Commit per package** — `build(<pkg>): emit publishable dist with versioned exports`.

### Task 2.3: Semver, CHANGELOG and release automation

- [ ] **Step 1: Add a per-package `CHANGELOG.md`** in Keep-a-Changelog form (the Via-Vitae baseline is a good model — all nine sections present, `_None._` when empty).
- [ ] **Step 2: Wire `release-please` or a manual release PR rule** — a version bump without a CHANGELOG entry in the same change is a review blocker.
- [ ] **Step 3: Pin `1.0.0` as the baseline** for all 12 packages at first publish; document that the platform version floor (INV-5) starts at `1.0.0`.

### Task 2.4: Stand up the package registry

- [ ] **Step 1: Choose** per the `registry` decision line.
  - **Verdaccio on-prem** (recommended, INV-10): Proxmox LXC, `docker run verdaccio/verdaccio`, storage on a PBS-backed dataset, HA pair, allowlisted upstream proxy, its own backup and access control. It becomes a CC9.2 critical component — document the runbook.
  - **GitHub Packages** (available once billing is restored): zero new infrastructure, but adds a US-jurisdiction supply-chain dependency to every spoke build.
- [ ] **Step 2: Publish the twelve packages in topological order** and verify a clean external consumer can resolve all of them.
- [ ] **Step 3: Record the registry decision, runbook and backup plan** in DECISION-LOG.

### Task 2.5: Extend the block schema ONCE, in the platform

**Files:** `frontend/packages/seed-data/src/schema.ts`, `src/registry.ts`, fixtures

- [ ] **Step 1: Write failing tests** for the new block types in `frontend/packages/seed-data/src/__tests__/`.
- [ ] **Step 2: Add the blocks** the vertical page packages require and the current five (`hero`, `text`, `keyValue`, `list`, `cta`) cannot express: `massSchedule`, `gallery`, `faq`, `sacramentList`, `clergyRoleList`, `visitingInfo`, `mapLocation`. Clergy blocks carry **roles only, never names** — clergy names are Art. 9 personal data and must come from the RLS-scoped content API, never from a committed fixture.
- [ ] **Step 3: Decide per block** whether it renders through the generic `[...slug]` catch-all or needs a first-class typed route. Rule: a block needs a typed route **iff** it carries its own JSON-LD (`massSchedule` → `Event`/`ChurchService`; `faq` → `FAQPage`; `sacramentList` → `Service`).
- [ ] **Step 4: Emit correct structured data.** Mass times are `Event` instances with `startDate`, **not** `openingHoursSpecification` — that property models visitor opening hours and belongs to `visitingInfo`.
- [ ] **Step 5: Gate** — `pnpm --filter @jol-hub/seed-data test`, `pnpm test:unit`, `pnpm type-check`, then the full battery.
- [ ] **Step 6: Commit.** **This must land before any spoke is cut** — doing it ten times is the single largest avoidable cost in Variant B.

### Task 2.6: Create `jol-frontend-repo-template` (BF-5)

**Files:** new repository `journeyoflife-org/jol-frontend-repo-template`, marked as a GitHub template

- [ ] **Step 1: Scaffold** Next.js 14 App Router + TypeScript strict + Tailwind, pnpm-only (`packageManager: pnpm@10.30.3`), consuming `@jol-hub/*` at pinned versions from Task 2.4.
- [ ] **Step 2: Embed the satellite kit byte-identically** — `.sops.yaml`, `scripts/sops-validate.py`, pre-commit secret hooks, `secrets/README.md`, `secrets/encrypted/{common,production,critical}/.gitkeep`, CODEOWNERS rules for `/.sops.yaml`, `/secrets/`, `/scripts/sops-validate.py`.
- [ ] **Step 3: Embed the SHA-256 drift check** against `jol-hub@main` — the mechanism already proven in the SOPS rollout. Any mismatch fails the pipeline.
- [ ] **Step 4: Embed the governance baseline** — GitFlow (`develop` integration, `feature/*`), **GPG-signed commits mandatory**, Conventional Commits with the closed Appendix A scope list, `LICENSE`, `SECURITY.md` (`security@journeyoflife.org`, 72-hour Art. 33 workflow), `CHANGELOG.md`, `CONTRIBUTING.md`, `.editorconfig`, `.gitignore` covering `.env*`, `.next`, `.turbo`, `*.tsbuildinfo`, `.idea`, `.venv`.
- [ ] **Step 5: Wire the gate scripts** — copy `check-payment-boundary.sh`, `check-theme-literals.sh`, `check-secrets`, `check-a11y-pages.ts`, `check-perf-budget.ts` and call the org's reusable workflows rather than duplicating 92 KB of YAML.
- [ ] **Step 6: Prove the template** by generating one throwaway repo from it and running the full battery green.
- [ ] **Step 7: Explicitly exclude `main.py`, `.venv`, and any Python scaffolding** — the defect class BF-5 exists to prevent.

### Task 2.7: Publish reusable CI workflows

**Files:** `journeyoflife-org/.github/workflows/`

- [ ] **Step 1: Convert** `ci.yml`, `compliance-check.yml`, `security-scan.yml`, `payment-boundary-guard.yml`, `frontend-test.yml` into `workflow_call` reusable workflows.
- [ ] **Step 2: Each spoke calls them** with a small per-repo `ci.yml` (~15 lines) — INV-6, and the reason a spoke cannot silently skip a gate.
- [ ] **Step 3: Add a meta-check** that fails if a spoke's workflow set diverges from the required list.

### Task 2.8: Implement the eleven invariants as CI tests

**Files:** `frontend/packages/testing/` + per-spoke gate scripts

Model every one on `data/tests/test_dependency_guard.py`, whose standard is: *"Adding the SDK back requires an ADR amending ADR-0005 — **not a PR**."*

- [ ] **Step 1: INV-1/INV-2 boundary lint** — a spoke fails CI if it declares a React component, a design token, a JSON-LD builder, a consent/privacy implementation, or a country literal (`if (country === 'lt')`).
- [ ] **Step 2: INV-3** — `check-payment-boundary.sh` layer-4 in all ten pipelines.
- [ ] **Step 3: INV-4** — PII-pattern scan over `.next/`, static output and logs; build artifacts excluded from the PSP scan to avoid false positives (existing hardening).
- [ ] **Step 4: INV-5** — platform version floor check at deploy time.
- [ ] **Step 5: INV-7** — `check-theme-literals.sh` in all ten.
- [ ] **Step 6: Falsify each gate both directions** — planted violation exits 1, clean tree exits 0. Record the canary results (ADR-010 / O-022 obligation).

---

# PHASE 3 — Cut ONE spoke and prove it (~3–4 days)

**Do not cut the other nine until this one is fully green.** This rule is what keeps the topology reversible.

### Task 3.1: Scaffold `jol-site-basilica`

- [ ] **Step 1: Create the repository** in `journeyoflife-org` from `jol-frontend-repo-template`. **Never** in the `JourneyOfLife` personal account — Art. 9 data is strictly prohibited there.
- [ ] **Step 2: Delete the empty local shell** `/opt/jol/repos/jol-site-basilica` (0 commits, 0 remotes — nothing to preserve) and clone the new repo in its place.
- [ ] **Step 3: Apply the satellite kit** and verify the SHA-256 drift check passes.
- [ ] **Step 4: Configure branch protection + CODEOWNERS** (`main` 2 approvals, `develop` 1, per CONTRIBUTING §4).

### Task 3.2: Implement the basilica vertical

- [ ] **Step 1: Implement page package 03** — wireframe order (header/breadcrumb → hero → content 60/40 → event-list → service-list → gallery → map → contact-form → footer), content model, `Church`/`CatholicChurch` + `parentOrganization` JSON-LD, hreflang/canonical, `DS-A11Y-01,02,03,07,08,09,10,12`, analytics events (`page_view`, `mass_times_open`, `map_directions_click` consent-gated, `contact_form_submit_success`).
- [ ] **Step 2: Map only — no third-party map SDK.** Self-hosted tiles or a static map image plus a click-through directions link (page package 03 §7).
- [ ] **Step 3: Consume the new block types** from Task 2.5 for mass schedule, gallery, sacraments, visiting info, clergy roles.
- [ ] **Step 4: Add the LT fixture** for `basilica-vilnius-cathedral`, carrying forward the existing content — and add the **missing `ru` keys**. The committed fixture has `lt` and `en` only; a locale silently falling back to English is a blocking failure.
- [ ] **Step 5: Mark every unverified liturgical fact** `[TODO: verify with parish/diocese — do not publish unverified]`. The **1922 vs 1985** basilica-status-year conflict is unresolved and must not be published either way.

### Task 3.3: Prove the spoke

- [ ] **Step 1: Full gate battery** — `type-check`, `test:unit`, `test:vitest`, `test:e2e`, `test:a11y`, `check-perf`, `check-secrets`, `test:security`, `check-payment-boundary.sh`, `check-theme-literals.sh`. All exit 0.
- [ ] **Step 2: Lighthouse ≥ 90 mobile**; LCP < 2.5 s and CLS < 0.1 on a throttled mobile profile.
- [ ] **Step 3: Breakpoint check** at 360 / 768 / 1024 / 1440 px.
- [ ] **Step 4: Three-locale parity** — no silent English fallback in `lt`, `en`, `ru`.
- [ ] **Step 5: Deploy to Proxmox**, `noindex` until the Vilnius mandate and the `katedra.lt` relationship are resolved. Smoke test. Record the rollback (previous image tag).
- [ ] **Step 6: Write the spoke playbook** — the exact sequence just executed, as the recipe for Phase 4.

---

# PHASE 4 — Batch the remaining nine (~4–5 days)

### Task 4.1: Execute the playbook nine times

For each row below — the existing empty local shell is renamed to the canonical repository name locked in Task 1.4:

| Page pkg | Canonical `Vertical` | Empty shell to delete | Repository to create | Family / accent |
|---|---|---|---|---|
| 04 | `cathedral` | `jol-site-cathedral` | `jol-site-cathedral` | sacred / gold |
| 05 | `diocese` | `jol-site-diocese` | `jol-site-diocese` | administrative / primary |
| 06 | `deanery` | `jol-site-deanery` | `jol-site-deanery` | administrative / primary |
| 07 | `church` | `jol-site-parish` | `jol-site-parish` | sacred / gold |
| 11 | `funeral` | `jol-site-funeral` | `jol-site-funeral` | memorial / gray-400 |
| 12 | `cemetery-cleaning` | `jol-site-grave-care` | **`jol-site-cemetery-care`** | memorial / liturgical-green |
| 08 | `protestant` | `jol-site-protestant` | `jol-site-protestant` | congregation / green |
| 09 | `orthodox` | `jol-site-orthodox` | `jol-site-orthodox` | eastern / purple |
| 10 | `other-church` | `jol-site-church` | **`jol-site-other-church`** | sacred / gold |

- [ ] **Step 1:** Create the repository from `jol-frontend-repo-template` under `journeyoflife-org`; delete the matching empty shell from the table above (each is `commits=0`, `remotes=` none — nothing to preserve) and clone the new repo in its place.
- [ ] **Step 2:** Implement its page package from the table above.
- [ ] **Step 3:** Apply its layout family and accent from the table above.
- [ ] **Step 4:** Wire commerce per the entitlement decision — **display-only catalogue plus handoff link** unless an unfreeze line was issued. Funeral and cemetery care additionally get `booking` at NORMAL tier.
- [ ] **Step 5:** Full gate battery + Lighthouse ≥ 90 + four breakpoints + three-locale parity.
- [ ] **Step 6:** Deploy `noindex`, smoke test, record rollback.
- [ ] **Step 7:** Commit and push per repo, each with its own push decision line.

### Task 4.2: Cross-spoke verification

- [ ] **Step 1: Drift sweep** — SHA-256 satellite-kit check green in all ten; platform versions identical across all ten (INV-5).
- [ ] **Step 2: Boundary sweep** — zero components, tokens, schema builders, consent implementations or country literals defined in any spoke (INV-1/INV-2).
- [ ] **Step 3: PSP sweep** — `check-payment-boundary.sh` exit 0 in all ten (INV-3).
- [ ] **Step 4: hreflang reciprocity** across all spokes and locales.
- [ ] **Step 5: Asset register + ROPA** — ten spokes added to the ISO A.5.9 inventory; per-vertical ROPA records joinable to tenant slugs.

---

# PHASE 5 — Deploy and industrialise

- [ ] **5.1 Ingress + vertical router** on Proxmox: Host → tenant → vertical → spoke; TLS 1.3; cache key `(tenant, locale, template)`; self-hosted or EU-jurisdiction caching only.
- [ ] **5.2 Domains** per D-006/D-051: `{tenant-slug}.gyvenimo-kelias.lt`, then `dzives-cels.lv`, `elu-tee.ee`; `jol-hub.com` stays brand/hub only.
- [ ] **5.3 Per-tenant `sitemap.xml` + `robots.txt`**, sharding and IndexNow designed for the 400k-site target.
- [ ] **5.4 LV/EE enablement** via `countries/{lv,ee}/config` — no spoke code change (proves the country axis stayed data).
- [ ] **5.5 DPIA amendment** for ten deployments: name the minimum assessed platform version, add per-vertical annexes, cover the Art. 9 review queue for gallery uploads.
- [ ] **5.6 Onboarding runbook**, target ≤ 1 working day per site.

---

## Rollback

| Level | Mechanism | Reversible |
|---|---|---|
| Phase 0 | Every task is a discrete commit; `git revert <sha>` | ✅ |
| Spoke release | Redeploy previous immutable image tag | ✅ seconds |
| Content error | `git revert` — **never force-push** (standing policy D-027…D-061) | ✅ forward-only |
| Platform package | Publish a patched version, bump spokes forward; **unpublishing forbidden** | ✅ forward-only |
| Whole topology | Collapse ten spokes into Variant A (ten build targets) | ✅ **only while INV-1…INV-4 hold** |

The moment a spoke defines its own component, token or consent logic, the decision becomes permanent. That is what the invariants protect.

---

## Definition of Done

- Zero unpushed commits; working tree clean; bundle on PBS
- BF-1 dispositioned and committed; BF-4 fixed; BF-6 superseded
- ADR-011 Accepted; DECISION-LOG entries appended; D-003/D-004 struck through in prose
- O-020 closed with root cause recorded
- 12 packages publishable, published, and proven from a clean external consumer
- `jol-frontend-repo-template` exists and has generated one proven repo
- Reusable workflows published; all ten spokes call them
- Eleven invariants implemented as CI tests, each falsified in both directions
- Ten spokes deployed `noindex`, each with Lighthouse ≥ 90 mobile, CWV green, four breakpoints clean, three-locale parity with no silent fallback
- Zero PSP surface in any spoke; `check-payment-boundary.sh` exit 0 × 10
- Asset register and ROPA updated; DPIA amended
- No liturgical or canonical fact published without a source

---

## Not in scope for this programme

- Lifting the D-052 payment freeze or building any donation/PSP capability (D-053 deferral stands)
- Authoring `countries/{lt,lv,ee}/config/safety.yml` — O-010, owner + clerical review, never agent-generated
- Resolving the Vilnius mandate or the `katedra.lt` relationship — owner action; spokes stay `noindex` until closed
- Resolving the **1922 vs 1985** basilica-status-year conflict or the two competing lists of Lithuanian basilicas — owner must supply an authoritative citation
- Authoring RU legal text for privacy/cookie/accessibility pages
- Any Via-Vitae change — the brand tree consumes page packages by pinned reference only
