---
kind: configuration_system
name: Configuration System — Django env-based settings, Helm/ConfigMap injection, and per-module .env files
category: configuration_system
scope:
    - '**'
source_files:
    - backend/django/core/settings/base.py
    - backend/django/core/settings/development.py
    - backend/django/core/settings/production.py
    - backend/django/core/settings/test.py
    - backend/django/.env.example
    - infra/helm/jol-hub/values.yaml
    - infra/helm/jol-hub/templates/configmap.yaml
    - infra/helm/jol-hub/templates/secrets.yaml
    - data/src/config.py
    - data/.env.example
    - data/airflow/config/airflow.cfg
    - frontend/apps/master-site/next.config.js
    - frontend/apps/master-site/.env.example
    - backend/django/apps/core/secrets.py
    - backend/django/apps/core/vault.py
    - countries/lt/config/liturgical.yml
    - countries/lt/config/compliance.yml
    - countries/lt/config/seo.yml
---

## What system/approach is used

JOL-HUB uses a layered configuration strategy across three tiers:

1. **Django backend** — `django-environ` (`environ.Env`) plus `python-dotenv` `load_dotenv()` in `backend/django/core/settings/base.py`. Settings are split into `base.py` (shared defaults), `development.py`, `production.py`, and `test.py`, each importing base and overriding values. Environment variables drive all runtime config; `.env` files are loaded at import time.
2. **Kubernetes / Helm** — `infra/helm/jol-hub/values.yaml` defines the single source of truth for deployment parameters. Templates render `ConfigMap` (`infra/helm/jol-hub/templates/configmap.yaml`) for non-secret settings and `Secret` (`templates/secrets.yaml`) for sensitive values. The ConfigMap injects `DJANGO_SETTINGS_MODULE=core.settings.production` plus DB, Redis, Celery, GDPR, email, and feature flags as environment variables consumed by the Django process.
3. **Data pipeline & Airflow** — `data/src/config.py` defines typed dataclasses (`DataModuleConfig`, `DataProcessingActivity`, `RetentionPolicy`) with sensible defaults, while `data/.env.example` documents the expected environment variables (DB, Redis, Airflow home, GDPR retention, encryption provider, KMS keys). Airflow itself is configured via `data/airflow/config/airflow.cfg`.
4. **Frontend apps** — Each Next.js app under `frontend/apps/*` ships its own `.env.example` (e.g. `apps/master-site/.env.example`) and reads `process.env.*` at build/runtime; `next.config.js` holds build-time i18n locale defaults.
5. **Per-country YAML configs** — `countries/{ee,lt,lv}/config/*.yml` hold liturgical calendars, compliance rules, and SEO settings consumed by the platform at runtime to tailor behavior per jurisdiction.
6. **Secrets resolution** — `backend/django/apps/core/secrets.py` and `vault.py` provide optional AWS Secrets Manager and HashiCorp Vault lookups keyed off `ENVIRONMENT` and `PROJECT_NAME` env vars, falling back to plain env vars when disabled.

## Key files and packages

- `backend/django/core/settings/base.py` — central settings loader, `environ.Env` registry, database/celery/cache/email/logging/security/MongoDB/Prometheus config.
- `backend/django/core/settings/{development,production,test}.py` — environment-specific overrides.
- `backend/django/.env.example` — canonical list of every env var the Django process expects.
- `infra/helm/jol-hub/values.yaml` — Helm chart defaults (replicas, resources, autoscaling, domains, env blocks).
- `infra/helm/jol-hub/templates/configmap.yaml` — non-secret env vars mounted into pods.
- `infra/helm/jol-hub/templates/secrets.yaml` — Kubernetes Secret template generating `DJANGO_SECRET_KEY`, `NEXTAUTH_SECRET`, DB creds, etc.
- `data/src/config.py` — typed Python config for the data/GDPR module.
- `data/.env.example` — data-pipeline environment variable reference.
- `data/airflow/config/airflow.cfg` — Airflow core/webserver/scheduler/logging config.
- `frontend/apps/*/next.config.js` and `frontend/apps/*/package.json` — frontend build/runtime config.
- `countries/{ee,lt,lv}/config/*.yml` — per-country liturgical/compliance/SEO configuration.
- `backend/django/apps/core/secrets.py`, `backend/django/apps/core/vault.py` — optional secrets backends.

## Architecture and conventions

- **Environment-first**: All runtime configuration flows through environment variables. `base.py` calls `load_dotenv()` then `environ.Env.read_env(BASE_DIR / '.env')`, so local `.env` overrides are supported but production relies on Helm-injected env vars.
- **Base + environment modules**: Django settings follow the classic `base.py` + per-env override pattern. Production enforces HTTPS, HSTS, strict cookies, SSL-required DB connections, JSON-only REST renderers, and tighter throttling; development enables debug toolbar, console email backend, relaxed security; test switches to SQLite in-memory, locmem cache, synchronous Celery, and mongomock.
- **Helm as deployment config source of truth**: `values.yaml` is the single place operators edit replicas, images, resource limits, autoscaling, ingress TLS, monitoring, and pod security context. Templates map those values into `ConfigMap` and `Secret` objects that become env vars inside containers.
- **Separation of secret vs non-secret**: Non-sensitive settings go into `ConfigMap`; secrets (DB passwords, JWT keys, payment credentials) go into `Secret`. Payment-provider keys are explicitly blanked out in `secrets.yaml` per ADR-0005/STEP-18 — the codebase carries no PSP keys.
- **Typed defaults in Python**: The data module's `config.py` uses `@dataclass` with explicit defaults (Postgres host/port, Redis, GDPR toggles, batch sizes, retention periods) so callers get safe defaults even if env vars are missing.
- **Feature flags via env vars**: Flags such as `PAYMENT_EVENTS_ENABLED`, `ENABLE_GDPR_BANNER`, `ENABLE_ANALYTICS`, `ENABLE_MFA`, `GDPR_SECURE_COOKIE`, `MONGODB_TLS_ENABLED` toggle features without code changes.
- **Per-country configuration**: Jurisdiction-specific behavior (liturgical calendars, compliance rules, SEO metadata) is externalized to YAML under `countries/<cc>/config/`, keeping the codebase generic while allowing country-level customization.
- **Airflow config via static cfg**: Airflow's `airflow.cfg` pins DAG/plugins folders, logging level, and SQL connection string; it is not templated, reflecting a simpler operational model for the data layer.

## Conventions and constraints

- **Never hardcode secrets in code or `.env`**: `base.py` comments and `development.py` enforce that real DB credentials must come from `.env` (gitignored); production supplies them via Helm `Secret`.
- **Payment boundary enforced**: Comments in `base.py` and `secrets.yaml` state that JOL-HUB holds no payment service provider keys (ADR-0005, STEP 18); any PSP credential added here would be a PCI scope violation.
- **MongoDB TLS required in production**: `MONGODB_TLS_ENABLED` defaults to `False` locally but must be enabled with a CA bundle path in production; TTL on raw webhook payloads is set via `MONGODB_TTL_DAYS` for GDPR data minimisation.
- **Prometheus `/metrics/` access control**: `PROMETHEUS_ALLOWED_IPS` and `PROMETHEUS_AUTH_TOKEN` must be set in production; empty IP list means allow-all, which is flagged as unsafe in comments.
- **GDPR/audit toggles**: `GDPR_COOKIE_DOMAIN`, `GDPR_SECURE_COOKIE`, `GDPR_DEFAULT_RETENTION_DAYS`, `ENABLE_AUDIT_LOGGING`, `mask_sensitive_data = True` in Airflow enforce privacy-by-default settings.
- **Encryption key management**: `data/.env.example` mandates `ENCRYPTION_PROVIDER=aws_kms` for production, with `AWS_KMS_KEY_ID`, `KEY_ROTATION_DAYS`, and `AUTO_KEY_ROTATION`; plain `PII_ENCRYPTION_KEY` is marked deprecated.
- **Helm security baselines**: `podSecurityContext.runAsNonRoot: true`, `securityContext.allowPrivilegeEscalation: false`, `readOnlyRootFilesystem: true`, and dropped `ALL` capabilities are the default pod posture.
- **Celery concurrency defaults**: Base sets `CELERY_WORKER_CONCURRENCY = 4`; production and Helm both expose replica counts separately for web workers vs Celery workers.
- **Frontend i18n locales**: `next.config.js` declares `locales: ['lt', 'ru', 'en']` with `defaultLocale: 'lt'`; this is build-time config, not runtime env.