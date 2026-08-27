# Page Package 22 — GPS Cemetery Map

Batch 3/3 (Phase 2.2) · Governing: design-system-spec v1 (c9165a3e) · SEO strategy (6da34b18) row 22 · Phase 3.4 privacy territory — deceased-person data posture.

## ⚠ PRIVACY GATE (explicit, task-mandated)

**Plot-level data is NEVER indexed and NEVER in JSON-LD** (row 22 hard rule + deceased-person privacy posture). Deceased persons' data operates under a three-tier visibility model; family objection/takedown is a first-class flow, not an afterthought.

## 1. Wireframe (mobile-first)

1. Header/nav + breadcrumb · 2. `hero` (contained): cemetery name, map intro
3. `map` (full-width, primary): interactive plot map — **public tier only rendered by default**
4. Info panel: opening hours, regulations, contact (plot inquiries go through contact form, no direct data exposure)
5. Takedown/objection entry point (persistent footer link on this page)
6. Footer

## 2. Content model — privacy tiers (task-mandated)

| Tier | Visible to | Content |
|---|---|---|
| T1 Public | everyone | plot geometry, section names, cemetery metadata — NO person data |
| T2 Memorial | authenticated family (consent-verified) | name, dates, memorial text — per-record consent flag required |
| T3 Restricted | cemetery admin only | full records; never rendered publicly |

Fields: plot geometry (✓), person records (○, T2/T3 only, consent-flagged), memorial media (○, T2, family-uploaded with consent attestation). **Default-deny**: any record without explicit consent flag renders at T1 (geometry only).

## 3. SEO metadata (row 22 — GAP flagged)

- Title: `{Cemetery name} — {tenant}`
- JSON-LD: `Map` + `CivicStructure` (props: url, name) — builder status **GAP: new builder**; **plot data excluded by construction** (builder receives cemetery entity only, never plot queries)
- hreflang/canonical: as package 01 §3

## 4. Component mapping

PageShell ✓ · EntityHero ✓ · **CemeteryMapCanvas ✗ build (DS §6 backlog — largest build in the program)** · PrivacyTierGate ✗ build · TakedownForm ✗ build · ContactBlock ✓. Map tiles self-hosted only (no third-party tile service — package 03 §7 precedent).

## 5. Family objection / takedown flow (task-mandated)

1. Entry points: persistent link on this page + Legal page (23) + contact form intent
2. Form collects: requester identity, relationship claim, record reference, requested action (restrict/remove) — **data minimization: no more than needed to locate and verify**
3. Routed to tenant admin queue (CRM) with SLA; verification before action; action logged (audit trail); requester notified
4. Objection honored → record drops to T3 immediately pending resolution (default-restrict on dispute)

## 6. Audience journeys

- **Family member**: locate a grave (T1) → request memorial access (T2 consent flow)
- **Cemetery admin**: process inquiries + takedown queue

## 7. a11y acceptance

DS-A11Y-01, 02 (map alternatives — textual section index as non-visual equivalent), 03, 05, 06 (drag/pan alternatives), 07, 09, 10 (takedown form), 12

## 8. Analytics

Essential only; **no plot-interaction tracking beyond aggregate counts, consent-gated**; no location precision beyond session.
