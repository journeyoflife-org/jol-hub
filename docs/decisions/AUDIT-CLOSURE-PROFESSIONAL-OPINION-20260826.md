# Audit Closure — Professional Opinion: Lithuania Pilot Front-End

> Date: 2026-08-26 · Auditor: Principal Platform Architect (independent re-verification)
> Scope: `jol-hub/frontend` vs `MASTER-PROMPT-LT-PILOT-FRONTEND.md` and audit findings F1–F6 (2026-08-26)
> Evidence base: HEAD `bcb00f2f` (branch `feat/pages-step6`), working tree clean except `backend/manage.py` (unrelated, +19/−20)
> Compliance anchors: SOC 2 CC3.1/CC7.2 · ISO 27001:2022 A.8.32/A.8.34 · GDPR Art. 9/Art. 32

---

## 1. Independent re-verification executed (2026-08-26)

| # | Check | Result |
|---|---|---|
| V-1 | Unit/security suite: `vitest run` in `template-renderer` | **114/114 PASS** (7 files, 1.47 s) |
| V-2 | `tsc --noEmit` in `template-renderer` | **Exit 0 — clean** |
| V-3 | Tenant registry count (F3): `grep -c "slug:"` in `tenant-resolver/src/registry.ts` | **32 PilotSpec entries** = ratified 31-site Wave-1 tree + VIP cathedral reference; matches DECISION-LOG O-002 (CLOSED) |
| V-4 | Cross-tenant fallback trace (F6): all HTTP surfaces (`sitemap.ts`, `[tenant]/layout.tsx`, `route-dispatch.tsx`) | All call the **closed** `loadTenantFixture` (unknown → `null` → 404); `loadTenantFixtureWithFallback` is exported but has **zero call sites in any HTTP path** — leakage structurally impossible today |
| V-5 | Decision-log governance: D-001…D-005, O-001…O-006, hygiene-gate execution record | Present, append-only, authority-attributed |
| V-6 | Secret hygiene: tracked `.env*` files | Only `.env.example` templates tracked (hygiene-gate step 1); no secret VALUES read or required (Tier-1 rule) |

## 2. Finding-by-finding disposition

| Finding | Disposition | Evidence & residual risk |
|---|---|---|
| F1 — livestream module absent from renderer; legacy client-side password defect | **CLOSED-AS-DEFERRED (risk contained)** | D-004 confirms ONE renderer (`template-renderer`) is the public surface; the defective `LivestreamEmbed.tsx` lives only in the legacy `parish-template` app, a legacy extraction candidate (O-004), not part of the pilot serving path. **Residual**: no consent-gated livestream capability ships until a renderer module is built — funeral tenants must NOT be sold live-streaming before then. Owner: platform architect. |
| F2 — legacy `parish-template` / `master-site` apps, `.jol-hub.eu` hard-code | **CONTAINED — closure pending** | Apps remain in-repo as documented extraction candidates (O-004). Risk contained by D-004 (single public renderer) but the artifacts are still launchable. **Closure action**: delete or banner `DEPRECATED` before any `*.gyvenimo-kelias.lt` public exposure. |
| F3 — Wave-1 site-count inconsistency | **CLOSED** | O-002 ratifies the canonical count: 32 pilot tenants = 31-site hierarchy + VIP cathedral; delta implemented and rendering-verified (commit `bcb00f2f`). Cosmetic residue: registry banner comment still reads "(21 tenants)" and MASTER-PROMPT §4/§15 still say "23 sites" — flagged for the next change-controlled doc revision. |
| F4 — `TENANT_BASE_DOMAIN` absent from env templates | **OPEN (LOW)** | Resolution still correct via the code default (`gyvenimo-kelias.lt`), but production env must not rely on code defaults. One-line addition to `.env.production.example` / `.env.staging.example`. |
| F5 — collections empty until backend content plane | **OPEN — accepted pilot dependency** | Documented in `RENDERING.md` ("no backend content service yet"); empty states translated and accessible, detail routes 404 honestly. Gates Wave-1 business KPIs, not the stakeholder showcase. |
| F6 — fallback tenant leakage risk | **CLOSED (structural)** | V-4: zero HTTP call sites for the fallback variant. Optional hardening: a unit test asserting that invariant survives future edits (recommended, non-blocking). |

## 3. Corrections to the record (append-only discipline)

1. **O-005 wording is inaccurate**: it states `frontend/apps/parish-template/.env.local` "no longer exists (app directory removed post-ratification)". Verified 2026-08-26: the app directory **still exists** and contains `.env.local` (mode `600 jol:jol`, dated 2026-04-06, untracked — no secret exposure in git). Corrected via DECISION-LOG row O-007; the hygiene conclusion (0 tracked secret files) is unaffected.
2. `CHANGELOG.md` is referenced by the jol-hub README but absent from the repo root — belongs to the O-006 README reconciliation.

## 4. Professional opinion (certification statement)

In my professional opinion, the 2026-08-26 front-end audit of the Lithuania
pilot is **remediated to the extent that Wave 0 stakeholder showcase and
Wave 1 onboarding may proceed**, subject to the conditions below. The
verification evidence (V-1…V-6) was produced independently on the cited HEAD;
the governance trail (decision log, hygiene-gate record, ADRs) satisfies
SOC 2 CC3.1 change-evidence and ISO 27001:2022 A.8.32 requirements.

**Conditions precedent to PUBLIC go-live on `*.gyvenimo-kelias.lt`** (not to
the stakeholder showcase):

1. F2 closure — legacy apps deleted or `DEPRECATED`-bannered.
2. F4 — `TENANT_BASE_DOMAIN` explicit in env templates.
3. F1 — consent-gated livestream module in the renderer before any funeral
   tenant markets live-streaming (until then: capability not sold).
4. O-003 — the `jol-db-pilot-lt01` spec delta against ADR-001 executed in
   `jol-infrastructure` (change-controlled).

**Rollback**: all audit-closure artifacts are documentation; revert the
recording commit. No production mutation occurred during this verification.

⚠ Items not re-executable on this offline host (trufflehog/git-secrets
history scan) rely on the recorded compensating controls (hygiene-gate
step 2) — equivalence NOT claimed; periodic rescan remains an open control.

---
Signed: Principal Platform Architect · JOL · 2026-08-26
Verification commands and outputs retained in this record and in commit metadata.
