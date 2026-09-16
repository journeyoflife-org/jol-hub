# ADR-001: Tenant Data Isolation — PostgreSQL Schema-per-Tenant + RLS

---

## Status
Accepted — ratified by platform owner 2026-08-24. Supersedes earlier
"separate database per website" formulation.

## Context
The Lithuania pilot (23 Wave-1 tenants, path to ~1,300 LT and ~400,000 EU
tenants) requires tenant data isolation that satisfies GDPR Art. 9
special-category data, Art. 17 erasure, and cross-tenant confidentiality,
while remaining operable on the on-prem pilot DB (`jol-db-pilot-lt01`)
without one database instance per site.

## Decision
- Isolation unit = **PostgreSQL schema per tenant** on a shared cluster.
- **Row-Level Security** policies as defense-in-depth on all
  tenant-scoped tables.
- Connection role strategy: least-privilege application role; tenant schema
  resolved per request from the tenant-resolution chain
  (subdomain → tenant → schema); `search_path` pinning; no cross-schema
  grants.
- Erasure: `deleted_at` logical deletion + legal sign-off + erasure log
  (per `jol-infrastructure/docs/compliance/erasure-log.md`), followed by
  scheduled physical purge per retention policy.
- Backups: PBS at VM level retains whole-cluster recoverability; per-tenant
  export/erasure tooling required for Art. 15/17/20.

## Consequences
- **Positive**: Operable at 400k-tenant scale; single cluster to harden,
  patch, and back up; clean per-tenant erasure boundary (DROP/EXPORT schema).
- **Positive**: RLS provides a second independent isolation layer.
- **Negative**: Schema-count growth requires migration tooling discipline
  (migrations must fan out across tenant schemas).
- **Negative**: Requires spec delta against
  `jol-infrastructure/docs/servers/jol-db-pilot-lt01.md` (change-controlled
  issue + doc update) — OPEN ACTION.

## Alternatives Considered
1. Database-per-tenant — rejected (operational collapse at scale; 400k DBs).
2. Single shared schema + tenant_id column only — rejected (single-layer
   isolation insufficient for Art. 9 data without RLS; weaker erasure story).
3. Citus/distributed Postgres — deferred (re-evaluate at industrialization;
   adds an estate dependency before the pilot proves the model).

## Compliance
- GDPR Art. 9 / Art. 25: special-category data isolation by design
- GDPR Art. 17: schema-scoped erasure boundary
- SOC 2 CC6.1 / CC6.3: logical access controls, least privilege
- ISO 27001:2022 A.8.13 (segregation of environments), A.5.34 (privacy)
