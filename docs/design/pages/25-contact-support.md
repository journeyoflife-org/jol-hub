# Page Package 25 — Contact & Support

Batch 3/3 (Phase 2.2) · Governing: design-system-spec v1 (c9165a3e) · SEO strategy (6da34b18) row 25 · Renderer module: `contact-form` + `content`.

## 1. Wireframe (mobile-first)

1. Header/nav + breadcrumb · 2. `hero` (contained): contact channels summary (phone, email, address, office hours)
3. `contact-form` (contained, primary): the personal-data-minimization form (below)
4. `content` (two-column-60-40): support topics → routed answers (FAQ linking 23/24) | map/address card
5. Footer

## 2. Content model — contact form = personal data minimization pattern (task-mandated)

| Field | Req | Rationale |
|---|---|---|
| name | ✓ | needed to respond |
| email | ✓ | needed to respond |
| topic (controlled list: general, sacrament, funeral service, donation, privacy request → routes to DSAR, technical) | ✓ | routing without collecting detail |
| message | ✓ | free text — **privacy notice inline at the field** (what we do with it, retention, link to 23) |
| phone | ✗ **optional, labeled as such** | collected only if offered — minimization by default |
| address/DOB/etc. | ✗ **never collected here** | forms MUST NOT ask beyond the above (assertion **DS-FORM-25**: schema whitelist in tests) |

Submitted messages: stored via CRM contact-sync (Bitrix24 processor path — package 20 note applies); never logged raw beyond transport (O-019 posture); retention per D-022 pattern.

## 3. SEO metadata (row 25 — Implemented)

- Title: `{Contact & Support} — {tenant}`
- JSON-LD: `ContactPage` + `Organization` (props: url, contactPoint) — **Implemented** builders
- hreflang/canonical: as package 01 §3

## 4. Component mapping

PageShell ✓ · ContactBlock ✓ (as-built; extend with minimization schema) · FAQAccordion ✓ · MapBlock ✗ (shared backlog from 03) — support-journey terminus: every other page's escalation path lands here (packages 22/24 reference it).

## 5. Audience journeys

- **Parishioner**: question → right channel (topic routing prevents misrouted pastoral questions)
- **Data subject**: privacy topic → DSAR handoff (single path, package 23 §5)
- **Funeral director**: service inquiry → scheduling handoff (package 20)

## 6. a11y acceptance

DS-A11Y-01, 03, 07, 09, 10 (forms — binds hardest here: labels, error linkage, announcements), 12 + DS-FORM-25 minimization assertion

## 7. Analytics

`page_view` (essential) · `form_topic_select` (consent-gated, topic value only — message content NEVER) · `form_submit_success`
