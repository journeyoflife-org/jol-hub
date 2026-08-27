# Page Package 21 — AI Pastoral Assistant (public entry + clergy surface)

Batch 3/3 (Phase 2.2) · Governing: design-system-spec v1 (c9165a3e) · SEO strategy (6da34b18) row 21 · **CONSUMES `docs/modules/ai-pastoral-assistant-spec.md` (fc255391, D-008) — this page implements that spec's UX layer; where they differ, the module spec wins.**

## ⚠ PRIVACY GATE (explicit, task-mandated)

**This page MUST NOT SHIP without `countries/{lt,lv,ee}/config/safety.yml` (O-010, OPEN — launch blocker per D-008/D-009).** No hotspot numbers, no escalation targets are ever hardcoded in this page or its components; all crisis/safeguarding content loads from the owner-curated safety.yml at runtime; absent config → assistant entry is hidden, not degraded.

## 1. Wireframe (mobile-first)

1. **Public entry** (indexable): hero explaining the assistant's advisory-only role, FAQ preview (FAQPage JSON-LD source), "clergy sign-in" path
2. **Clergy conversation surface** (RBAC gate first; noindex): RBAC check (clergy role only — spec §auth) → conversation UI (20-turn cap, 2048-token context per profile), advisory framing banner permanently visible, disclosure line on every AI-generated message, escalation affordance always one tap away

## 2. Content model

- Config-sourced: safety.yml (owner-only), assistant identity strings, disclosure templates — **no admin free-text editing of safety content** (DS §3 guardrails extended: safety config is JOL-controlled 100%)
- Conversation data: retained per spec §storage (clergy surface retention policy; 0-day prompt retention on the inference side per platform facts); no personal data in FAQ JSON-LD (row 21 rule)

## 3. SEO metadata (row 21 — GAP flagged)

- Public entry: `FAQPage` JSON-LD (mainEntity Q/A pairs) — builder status **GAP: `faqPageEntity` available** (wire it); conversation surfaces: **noindex, no JSON-LD ever, no personal data in structured data**
- hreflang: public entry per package 01 §3; conversation surface none

## 4. Component mapping

AuthGate/RBAC ✓ (components/auth) · ChatSurface ✗ **build (AI-module-specific; guardrails from `ai-guardrails` package per ADR-008 — classify/refusalFor/disclosureFor)** · DisclosureBanner ✗ build · EscalationButton ✗ build (safety.yml-fed) · FAQAccordion ✓ — the ai-guardrails implementation is the gating dependency (ASSUME-GUARD-002).

## 5. Audience journeys

- **Clergy (primary)**: sign in → ask preparatory question → receive advisory-framed draft → own judgment (never the assistant's)
- **Parishioner (public entry only)**: understand what the assistant is/isn't → directed to human contacts for pastoral needs

## 6. UX grammar (advisory-only — spec-derived, testable)

- **No decision verbs** in assistant output templates: never "you must/should decide"; framing = preparatory material for the cleric's own judgment (assertion **DS-UX-21**: output template grep forbids decision-verb list)
- Disclosure on every AI message (EU AI Act Art. 50 posture) · refusal messages use safety.yml constants only · escalation path UI: persistent button + refusal-state auto-display of relevant safety contacts

## 7. a11y acceptance

DS-A11Y-01, 03, 05 (dialogs), 09, 10 (input labeling), 11, 12 + DS-UX-21 grammar assertion

## 8. Analytics

Essential only; **no conversation content ever in analytics** (spec); entry-page views consent-gated as usual.
