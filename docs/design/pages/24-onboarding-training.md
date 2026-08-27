# Page Package 24 — Onboarding & Training

Batch 3/3 (Phase 2.2) · Governing: design-system-spec v1 (c9165a3e) · SEO strategy (6da34b18) row 24 · Renderer modules: `hero`, `content`, `feature-grid` (module index), `subscription-cta` (office-hours signup).

## 1. Wireframe (mobile-first)

1. Header/nav + breadcrumb · 2. `hero` (contained): "Get started with your site"
3. `content` (contained): onboarding steps as numbered cards (1 setup → 2 content → 3 go live), each linking to the training module
4. Training module index (`feature-grid`): guides per admin task (editing content, managing events, preview/publish, what you can't change and why)
5. Office-hours/help signup (`subscription-cta`) · 6. Footer

## 2. Content model — support-journey mapping (task-mandated)

| Stage | Admin need | Page surface |
|---|---|---|
| Pre-launch | what JOL controls vs. what I edit (the 90/10 model explained in plain language) | step 1 card |
| First edits | logo, hero, welcome text within guardrails | training modules → live editor preview link |
| Ongoing | events, news, liturgy schedules | module links → 19 |
| Stuck | escalation to human support | → page 25 (≤2 clicks from any module) |

Fields: module.title/body (✓, translated), step copy (✓), video embeds (○, **self-hosted only, no third-party players** — ePrivacy consistency).

## 3. SEO metadata (row 24 — GAP flagged trivial)

- Title: `{Onboarding & Training} — {tenant}`
- JSON-LD: `WebPage` (+ `Course` where structured — hasEducationalLevel/provider optional) — **GAP trivial**: wire existing builders
- hreflang/canonical: as package 01 §3

## 4. Component mapping

PageShell ✓ · Prose/ContentBlock ✓ · StepCards ✗ minor build · TrainingModuleIndex ✗ minor build (both small; join DS §6 backlog row 24) · ContactBlock ✓

## 5. Audience journeys

- **Parish admin (non-technical, primary)**: first login → guided first edit → confidence (the page exists to make the 90/10 constraint feel like guardrails, not limits)
- **Vendor** (marketplace tenants, secondary): same pattern, marketplace-flavored modules (out of batch scope, flagged)

## 6. a11y acceptance

DS-A11Y-01, 02 (video captions required where video exists), 03, 07, 09, 12

## 7. Analytics

`page_view` (essential) · `module_open` · `support_escalation_click` (consent-gated)
