# Page Package 20 — CRM Dashboard (Bitrix24)

Batch 3/3 (Phase 2.2) · Governing: design-system-spec v1 (c9165a3e) · SEO strategy (6da34b18) row 20 · Integration surface verified READ-ONLY in `jol-bitrix24-integration` @ `3420da0`: webhook signature verification, contact sync, field mapping, conflict resolution, security suite incl. `test_pii_never_logged`.

## 1. Wireframe (mobile-first; authenticated surface)

1. Auth gate (login → role check; unauthenticated users NEVER see dashboard chrome)
2. Header (admin variant) + tenant switcher (multi-tenant admins)
3. Overview cards: pending contact-sync conflicts, recent leads, scheduling load
4. Contact-sync panel: field-mapping status, conflict queue (approve/reject per conflict), last-sync time
5. Scheduling panel: service appointments list + create/edit (writes to Bitrix24 calendar via integration)
6. Audit trail excerpt (recent CRM actions, read-only)

## 2. Content model

All data lives in Bitrix24 (CRM is never CMS — MASTER-PROMPT §3 hard rule); hub renders via `jol-bitrix24-integration` client. Editable by non-technical admins: appointment slots, contact-merge decisions (approve/reject, never raw field editing). NOT editable: field mappings, sync config (JOL-controlled 90%, DS §3 analogy + renderer precedent).

## 3. SEO metadata (row 20 — Implemented posture)

- **noindex, never crawled** — robots hard rule 4 posture; meta robots noindex + X-Robots-Tag, authenticated before any content bytes; **no JSON-LD ever** on this surface; no hreflang (app surface)

## 4. Component mapping

AuthGate ✓ (components/auth) · DashboardShell ✗ **build** · SyncConflictQueue ✗ **build** · SchedulingPanel ✗ **build** · AuditTrailList ✗ builds (backlog addition to DS §6 — authenticated-surface components)

## 5. Audience journeys

- **Parish admin (non-technical)**: see conflicts → one-tap approve/reject with plain-language explanation; schedule a service in ≤5 steps
- **Funeral director**: appointment booking for a service inquiry

## 6. a11y acceptance

DS-A11Y-01, 03, 05 (confirm dialogs), 07, 09, 10 (forms), 12 — authenticated surfaces are NOT exempt from WCAG

## 7. Analytics

Minimal + essential only (operational error telemetry, no behavior tracking of admin users without consent; PII never logged per the integration's enforced suite).

## GDPR processor-relationship note (task-mandated)

Bitrix24 is a **processor** for tenant personal data: a DPA must be in place per tenant deployment; contact sync transfers personal data to the processor — lawful basis and Art. 28 documentation belong to tenant onboarding (not this page); the `pii_never_logged` suite is the technical guarantee layer; data-subject requests route through the hub DSAR flow, which must cover Bitrix24-stored records (erasure propagation required).
