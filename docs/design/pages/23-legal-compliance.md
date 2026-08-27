# Page Package 23 — Legal & Compliance

Batch 3/3 (Phase 2.2) · Governing: design-system-spec v1 (c9165a3e) · SEO strategy (6da34b18) row 23 · **This page DISPLAYS this program's compliance artifacts — it is the public face of the governance record.**

## 1. Wireframe (mobile-first)

1. Header/nav + breadcrumb · 2. `hero` (contained): "Legal & compliance" index
3. Document sections (each `content` block, deep-linkable anchors): Privacy policy · Cookie & consent notice · Retention schedule · Accessibility statement · Terms · Takedown/objection policy (→ 22)
4. Contact block for DSR requests (→ DSAR flow) · 5. Footer

## 2. Content model — artifact sources (task-mandated)

| Document | Source of truth | Locale |
|---|---|---|
| Privacy policy | tenant-level template + JOL baseline (GDPR Arts. 13/14) | translated (LT req, EN req, RU opt) |
| Cookie/consent notice | ePrivacy — consent categories exactly matching the gate's categories; no third-party trackers listed because none exist (DS batch pattern §7) | translated |
| **Retention schedule** | **D-022 pattern: LT payment/fiscal records 10 years per accounting obligation; LV/EE pending local advice — display MUST match jurisdiction status (pending shown as "being confirmed", never a fabricated number)** | translated |
| **Accessibility statement** | **EN 301 549 REQUIRES one**: conformance claim (WCAG 2.2 AA target), the DS-A11Y assertion set as the measurable basis, known-limitations section, feedback/escalation contact, date of assessment | translated |
| Terms | tenant template | translated |

Admin-editable: NONE of the compliance texts are free-form editable by parish admins (DS §3 guardrails at maximum: JOL-controlled, versioned, change-controlled — edits flow through the same DECISION-LOG discipline as the artifacts they display).

## 3. SEO metadata (row 23 — GAP flagged trivial)

- Title: `{Legal & Compliance} — {tenant}`
- JSON-LD: `WebPage` (+ `FAQPage` where Q/A sections exist) — **GAP trivial** (row 23): wire existing builders
- hreflang/canonical: as package 01 §3

## 4. Component mapping

PageShell ✓ · Prose/ContentBlock ✓ (anchor deep-links) · FAQAccordion ✓ · DSRContactBlock ✗ minor build (form posts to DSAR flow, not CRM) · **no backlog beyond SharedCompliancePage extension (DS §6 row 23 marked ✓ — this package extends it with retention + a11y statement blocks)**

## 5. Audience journeys

- **Data subject**: find privacy policy → understand rights → submit DSR (one path, ≤3 clicks)
- **Regulator/auditor**: conformance claims with measurable basis (assertion IDs cited)

## 6. a11y acceptance

DS-A11Y-01, 02, 03, 09 (long-document heading discipline is critical here), 10 (DSR form), 12

## 7. Analytics

`page_view` (essential) · `dsr_form_start` (consent-gated; content of DSRs NEVER in analytics)
