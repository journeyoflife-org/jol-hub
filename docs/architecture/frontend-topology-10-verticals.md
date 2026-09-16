# Frontend Topology — Ten Vertical Hub-and-Spoke

> **Authoritative decision:** ADR-011 (2026-09-11). This document is the
> technical companion to that ADR.

## System Context

```mermaid
graph TB
    subgraph "journeyoflife-org (GitHub)"
        HUB["jol-hub<br/>(Tier-0 hub + 12 packages)"]
        S1["jol-site-basilica"]
        S2["jol-site-cathedral"]
        S3["jol-site-diocese"]
        S4["jol-site-deanery"]
        S5["jol-site-parish"]
        S6["jol-site-funeral"]
        S7["jol-site-cemetery-care"]
        S8["jol-site-protestant"]
        S9["jol-site-orthodox"]
        S10["jol-site-other-church"]
        REG["Registry<br/>(Verdaccio or GitHub Packages)"]
    end

    subgraph "On-prem (Proxmox VE 9.2)"
        LB["Ingress<br/>(vertical router)"]
        APP["Spoke instances<br/>(Next.js 14 per vertical)"]
        DB["PostgreSQL 16<br/>(schema-per-tenant + RLS)"]
        PBS["PBS 4.2<br/>(RPO 24h / RTO 4h)"]
    end

    HUB --> REG
    REG --> S1 & S2 & S3 & S4 & S5 & S6 & S7 & S8 & S9 & S10
    S1 & S2 & S3 & S4 & S5 & S6 & S7 & S8 & S9 & S10 --> LB
    LB --> APP
    APP --> DB
    DB --> PBS
```

## Component Inventory

### Hub (`jol-hub`)

| Component | Role |
|---|---|
| `frontend/apps/template-renderer` | Integration test-bed; renders all 32 pilot tenants |
| `frontend/packages/ui` | Shared component library (primitives, composite, layout) |
| `frontend/packages/i18n` | Trilingual translations (lt/ru/en), 27-locale architecture |
| `frontend/packages/seo` | Schema.org builders, hreflang, sitemap, IndexNow |
| `frontend/packages/commerce` | Tier-gated feature flags, display-only handoff (ADR-009) |
| `frontend/packages/tenant-resolver` | Resolution chain: subdomain → tenant → schema → locale |
| `frontend/packages/seed-data` | Tenant fixtures, vertical registry, block schema |
| `frontend/packages/auth` | Authentication contracts |
| `frontend/packages/bitrix-sdk` | Bitrix24 CRM integration client |
| `frontend/packages/a11y` | Accessibility utilities |
| `frontend/packages/perf` | Performance monitoring |
| `frontend/packages/observability` | Logging and tracing |
| `frontend/packages/testing` | Shared test utilities |
| `backend/django/` | Django REST API, schema-per-tenant, RLS |
| `scripts/` | Policy-as-code guards (payment boundary, theme literals) |
| `data/` | ROPA records, compliance pipelines, dbt models |

### Spokes (10 repositories)

Each spoke contains **only** vertical composition code:
- `next.config.js` with vertical-specific settings
- Page routes consuming `@journeyoflife-org/*` packages
- Vertical-specific theme tokens (accent colour, hero variant)
- Vertical-specific Schema.org types
- No shared logic, no duplicated packages

## Technology Stack (verified)

| Layer | Technology |
|---|---|
| Frontend framework | Next.js 14 App Router |
| UI library | React 18 |
| Language | TypeScript strict |
| Styling | Tailwind CSS + design tokens |
| Build | Turborepo + pnpm 10.30.3 (never npm) |
| Backend | Python 3.12+ / Django 6.x / DRF |
| Database | PostgreSQL 16 (schema-per-tenant + RLS) |
| Infrastructure | Proxmox VE 9.2, Ubuntu Server 24.04 LTS |
| Backup | PBS 4.2 (RPO 24h / RTO 4h) |
| CI/CD | GitHub Actions (reusable workflows) |
| Secrets | SOPS/age with tiered recipients |
| Package registry | Verdaccio (on-prem) or GitHub Packages |

## Interaction Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant I as Ingress (vertical router)
    participant S as Spoke (Next.js)
    participant P as @journeyoflife-org/* packages
    participant A as Hub API (Django)
    participant D as PostgreSQL (RLS)

    U->>I: GET /lt/vilnius-cathedral/mass-times
    I->>S: Route to jol-site-cathedral
    S->>P: import { MassSchedule } from '@journeyoflife-org/ui'
    S->>P: import { resolveTenant } from '@journeyoflife-org/tenant-resolver'
    P->>A: GET /api/tenants/vilnius-cathedral/schedule
    A->>D: SET schema = 't_vilnius_cathedral'
    D-->>A: Rows (RLS-filtered)
    A-->>S: JSON
    S-->>U: HTML (SSR with Schema.org Event)
```

## Invariants (enforced as CI)

See ADR-011 §Decision for the full table (INV-1 through INV-11).

## Vertical Matrix

| # | Spoke | Vertical | Layout | Template | Commercial |
|---|---|---|---|---|---|
| 1 | jol-site-basilica | basilica | sacred | church-template | No |
| 2 | jol-site-cathedral | cathedral | sacred | church-template | No |
| 3 | jol-site-diocese | diocese | administrative | diocese-template | No |
| 4 | jol-site-deanery | deanery | administrative | deanery-template | No |
| 5 | jol-site-parish | church | sacred | church-template | No |
| 6 | jol-site-funeral | funeral | memorial | funeral-template | Yes (booking) |
| 7 | jol-site-cemetery-care | cemetery-cleaning | memorial | cleaning-template | Yes (booking) |
| 8 | jol-site-protestant | protestant | eastern | church-template | No |
| 9 | jol-site-orthodox | orthodox | eastern | church-template | No |
| 10 | jol-site-other-church | other-church | eastern | church-template | No |

## Deployment Topology

```mermaid
graph LR
    subgraph "Proxmox VE 9.2 (on-prem)"
        subgraph "CT: jol-ingress"
            NGINX["nginx<br/>(vertical router)"]
        end
        subgraph "CT: jol-app-01"
            B["jol-site-basilica :3001"]
            C["jol-site-cathedral :3002"]
            D["jol-site-diocese :3003"]
            E["jol-site-deanery :3004"]
            F["jol-site-parish :3005"]
        end
        subgraph "CT: jol-app-02"
            G["jol-site-funeral :3006"]
            H["jol-site-cemetery-care :3007"]
            I["jol-site-protestant :3008"]
            J["jol-site-orthodox :3009"]
            K["jol-site-other-church :3010"]
        end
        subgraph "CT: jol-db"
            PG["PostgreSQL 16"]
        end
    end

    NGINX --> B & C & D & E & F & G & H & I & J & K
    B & C & D & E & F & G & H & I & J & K --> PG
```

## Domain Strategy (D-006, D-051)

- `gyvenimo-kelias.lt` — LT ccTLD; tenant subdomains
- `dzives-cels.lv` — LV ccTLD
- `elu-tee.ee` — EE ccTLD
- `jol-hub.com` — brand/marketplace hub only

Each spoke serves one or more tenant subdomains under the ccTLD.

## Compliance Control Map

| Control | Mechanism | Scope |
|---|---|---|
| GDPR Art. 9 | Schema-per-tenant + RLS (ADR-001) | Hub + all spokes |
| GDPR Art. 30 | ROPA records per vertical | `data/exports/ropa/lt/` |
| GDPR Art. 35 | DPIA per spoke before go-live | Per-spoke compliance |
| PCI-DSS SAQ A | Payment boundary CLOSED (ADR-009) | All spokes + hub |
| SOC 2 CC6.1 | Opaque 404 for unknown tenant/page/locale | All spokes |
| WCAG 2.1 AA | axe-core in CI | All spokes |
| DS-THEME-01 | `check-theme-literals.sh` | Hub packages + all spokes |
