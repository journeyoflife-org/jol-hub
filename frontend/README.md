# JOL-HUB Frontend

Turborepo + pnpm workspace for the JOL-HUB multi-tenant platform.

## App topology (after STEP 1 refactor)

```
frontend/
├── apps/
│   ├── admin-dashboard/       # Platform administration (compliance, tenants, audit)
│   ├── master-site/           # Public marketing / master site
│   ├── parish-template/       # Legacy single-tenant template (retained per design)
│   └── template-renderer/     # Multi-tenant renderer — serves ALL entity tenants
└── packages/
    ├── auth/                  # AuthN/AuthZ shared package
    ├── bitrix-sdk/            # Bitrix24 CRM integration SDK
    ├── i18n/                  # Localization shared package
    ├── seed-data/             # Tenant fixtures (Zod-validated) — tenant DATA
    ├── tenant-resolver/       # X-Tenant / subdomain resolution + middleware
    └── ui/                    # Shared UI component library
```

### Why `template-renderer`

The 12 hard-coded `lt-*` demo apps were an anti-pattern: each tenant was a
separate Next.js app instead of a data configuration. STEP 1 (ADR-002)
collapsed them into one renderer:

- **Tenants are data.** Each former lt-\* app is now a JSON fixture in
  `packages/seed-data/src/fixtures/tenants/<slug>.json`, validated at load
  time against `TenantFixtureSchema` (Zod).
- **One routing surface.** `apps/template-renderer` serves
  `app/[tenant]/[[...slug]]/page.tsx`; the tenant comes from the
  `X-Tenant` header or a subdomain of `*.gyvenimo-kelias.lt`
  (configurable via `TENANT_BASE_DOMAIN`).
- **Shared UI lives in packages.** Compliance pages (privacy / cookies /
  consent / DSR) are rendered by shared templates, not per-tenant code.

### Tenant resolution & security

Resolution order: `X-Tenant` header → subdomain slug. Unknown tenants and
unknown pages return the same bare 404 — the platform never enumerates
valid tenants (GDPR Art. 9 information disclosure, SOC 2 CC6.1).

Local development:

```bash
pnpm --filter @jol-hub/template-renderer dev
curl -H "X-Tenant: parish-st-john-vilnius" http://localhost:3000/
```

### Commands

```bash
pnpm install          # workspace install (pnpm only — never npm)
pnpm build            # turbo run build (all apps, depends on ^build)
pnpm dev              # all apps in dev mode
pnpm type-check       # tsc across the workspace
```

### Rollback (STEP 1)

The deleted `lt-*` apps remain recoverable from git history on branch
`feat/template-renderer-step1`. Their content is preserved as fixtures in
`packages/seed-data`, which stay the canonical seed data either way.
