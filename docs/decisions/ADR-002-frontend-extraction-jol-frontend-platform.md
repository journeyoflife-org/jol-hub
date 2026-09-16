# ADR-002: Frontend Extraction into jol-frontend-platform

---

## Status
Proposed — decision deferred until Wave 0 exit criteria are met.

## Context
`jol-hub/frontend` (Turborepo/pnpm/Next.js) currently holds 15 apps,
including 12 hard-coded `lt-*` entity demos that contradict the tenant
model. `jol-frontend-platform` exists as a stub reserved for extraction.
Extracting too early freezes an unproven architecture; extracting too late
entrenches the per-entity anti-pattern.

## Decision
1. Wave 0: build the **single template-renderer app + tenant resolution +
   structured content models** inside `jol-hub/frontend`; convert the 12
   `lt-*` demos into seed fixtures. Framework choice confirmed via the
   scored matrix required by MASTER-PROMPT §9 (Next.js incumbent).
2. Extraction into `jol-frontend-platform` is triggered ONLY after:
   Wave 0 reference sites pass the acceptance gate, the tenant-resolution
   chain is proven, and packages (`ui`, `i18n`, `auth`, `bitrix-sdk`) have
   stable public APIs.
3. Extraction moves code, not contracts: `jol-hub` retains the integration
   contracts (entities, API schemas); Tier-0 sovereignty rules unchanged.

## Consequences
- **Positive**: No premature repo split; pilot velocity preserved.
- **Positive**: Extraction decision becomes evidence-based (SOC 2 CC3.1).
- **Negative**: Monorepo grows during pilot; extraction cost rises with
  delay — trigger conditions are binding, not aspirational.

## Alternatives Considered
1. Extract immediately — rejected (freezes unproven tenant architecture).
2. Never extract — rejected (violates ratified ecosystem map; monorepo CI
   blast radius at 400k-site scale).

## Compliance
- SOC 2 CC8.1: extraction executed as change-controlled migration
- ISO 27001:2022 A.8.32: change management for repo reorganization
