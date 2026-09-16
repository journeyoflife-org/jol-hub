---
kind: build_system
name: Multi-Service Build, CI/CD & Container Pipeline (Django + Next.js Turborepo + Airflow)
category: build_system
scope:
    - '**'
source_files:
    - .github/workflows/ci.yml
    - .github/workflows/cd.yml
    - .github/workflows/release.yml
    - backend/Dockerfile
    - backend/Dockerfile.dev
    - backend/django/requirements.txt
    - docker-compose.yml
    - frontend/turbo.json
    - frontend/package.json
    - frontend/apps/template-renderer/package.json
    - data/airflow/config/airflow.cfg
    - data/dbt/dbt_project.yml
    - data/setup.cfg
    - infra/helm/jol-hub/Chart.yaml
---

## Overview

JOL-HUB is a multi-service monorepo with three distinct build systems that are orchestrated together by GitHub Actions:

1. **Backend** — Django application built via Python `pip` and packaged into Docker images.
2. **Frontend** — Next.js applications managed as a pnpm/Turborepo monorepo (`frontend/`) with workspace packages under `packages/`, apps under `apps/`, and shared tooling via `turbo.json`.
3. **Data pipelines** — Apache Airflow DAGs plus dbt models under `data/airflow/` and `data/dbt/`, configured via `airflow.cfg` and `dbt_project.yml`.

All three subsystems share a single CI/CD surface: GitHub Actions workflows in `.github/workflows/` run lint/type-check/test/build for each service, then push container images to GHCR and deploy to Kubernetes via `kubectl set image`.

## Backend build system (Django)

- **Dependency management**: `backend/django/requirements.txt` is the canonical lock; pip caches it in CI.
- **Lint/format/type**: CI installs `black`, `isort`, `flake8`, `mypy`, `django-stubs`; runs `black --check`, `isort --check-only`, `flake8 . --max-line-length=100`, and `mypy . --ignore-missing-imports --no-error-summary || true`.
- **Tests**: `pytest` with `pytest-django`, `pytest-cov`, `pytest-xdist`, `pytest-asyncio`; coverage threshold enforced at 60% (`--cov-fail-under=60`). Tests run against an ephemeral PostgreSQL 16 and Redis 7 service containers provisioned by the workflow.
- **Docker**: Two Dockerfiles — `backend/Dockerfile.dev` (development, includes debug-toolbar/black/isort/flake8) and `backend/Dockerfile` (multi-stage production builder using `python:3.12-slim-bookworm`, non-root user `jolhub`, health check on `/health/`, gunicorn with 4 workers × 2 threads).
- **Local orchestration**: `docker-compose.yml` spins up PostgreSQL 16, Redis 7, MongoDB 7 (loopback-only), the Django dev server, a Celery worker, and Celery Beat, all sharing mounted volumes for code/static/media.

## Frontend build system (Turborepo + pnpm)

- **Workspace root**: `frontend/package.json` declares `packageManager: pnpm@10.30.3`, Node `>=20`, and top-level scripts that delegate to Turbo (`build`, `lint`, `type-check`, `test`, `clean`).
- **Task graph**: `frontend/turbo.json` defines tasks `build`, `lint`, `type-check`, `test`, `dev`, `clean`. `build` depends on `^build` (upstream deps first), emits `.next/**` (excluding cache), and uses `outputLogs: new-only`. `test` depends on `^build`. `dev` is persistent and uncached.
- **Apps**: Under `frontend/apps/` — `admin-dashboard`, `master-site`, `parish-template`, `template-renderer` — each a self-contained Next.js app with its own `package.json`, `next.config.js`, `tailwind.config.ts`, `tsconfig.json`, and `postcss.config.mjs`.
- **Packages**: Shared libraries under `frontend/packages/` (`a11y`, `auth`, `bitrix-sdk`, `commerce`, `i18n`, `observability`, `perf`, `seed-data`, `seo`, `tenant-resolver`, `testing`, `ui`) consumed via `workspace:*` protocol.
- **Quality gates**: ESLint + Prettier (`format:check`), TypeScript (`tsc --noEmit` per app), Vitest unit tests, Playwright E2E, Lighthouse budget checks, accessibility checks, secret scanning — all wired through per-app scripts and surfaced via root `pnpm test:*` aliases.
- **Artifacts**: CI uploads `.next` builds of `master-site` and `parish-template` as 7-day artifacts.

## Data pipeline build system (Airflow + dbt)

- **Airflow config**: `data/airflow/config/airflow.cfg` sets `dags_folder = /opt/jol/repos/jol-hub/data/airflow/dags`, `plugins_folder = /opt/jol/repos/jol-hub/data/airflow/plugins`, SQLA connection string, webserver port 8080, `mask_sensitive_data = True` for GDPR-compliant log masking.
- **DAGs**: Python DAGs live in `data/airflow/dags/` (`jol_daily_sync.py`, `jol_gdpr_cleanup.py`, `jol_hub_etl.py`, `jol_weekly_reporting.py`) and custom operators in `data/airflow/plugins/jol_operators.py`.
- **Transformations**: dbt project rooted at `data/dbt/` with `dbt_project.yml`, `profiles.yml`, and model directories `models/staging/` and `models/marts/`.
- **Python data module**: `data/src/` contains ETL/pipeline code, quality expectations (Great Expectations-style), transformations (staging/intermediate/marts), GDPR anonymizer/retention manager, and CLI entrypoints; pytest configured via `data/setup.cfg` (`testpaths = tests`, `addopts = -v --tb=short`).

## CI/CD (GitHub Actions)

| Workflow | Trigger | Purpose |
|---|---|---|
| `ci.yml` | Push/PR to `main`, `master`, `develop` | Backend lint → type → tests (with Postgres+Redis services); Frontend lint → type → test → build; Docker build test; Codecov upload |
| `cd.yml` | Push to `main`/`develop`, tags `v*`, or manual dispatch | Build backend/frontend images with `docker/metadata-action` (branch/ref/semver/sha/latest tags), push to `ghcr.io/<repo>/backend` and `.../frontend`, deploy to staging (`kubectl set image` in `jolhub-staging`), then production (`jolhub-production`) with rollout status and smoke tests; rollback job on failure |
| `release.yml` | Push to `feat/pages-step6` or `main` | `changesets/action` creates version PR or publishes packages via `pnpm release` (requires `NPM_TOKEN`) |
| `compliance-check.yml`, `security-scan.yml`, `payment-boundary-guard.yml`, `frontend-test.yml`, `entity-apps.yml`, `entity-apps-deploy.yml` | Additional gated checks for compliance, security scans, payment boundary enforcement, frontend-only testing, and entity-specific apps |

Key conventions enforced by CI:
- Python pinned to `3.11`, Node to `20`, pnpm to `10.30.3`.
- `pnpm install --frozen-lockfile` required — dependency tree must be locked.
- Backend coverage must meet ≥60%.
- Docker images use GHA cache (`cache-from: type=gha`, `cache-to: type=gha,mode=max`).
- Images tagged with branch, PR ref, semver, sha, and `latest` only on `refs/heads/main`.
- Production deployment requires environment protection (secrets `KUBE_CONFIG_PRODUCTION`, `KUBE_CONFIG_STAGING`).

## Packaging & publishing

- **npm packages**: Managed via Changesets (`frontend/.changeset/`); `pnpm build:packages` builds all `packages/*` via Turbo, then `changeset publish` pushes to npm registry using `NPM_TOKEN`.
- **Docker images**: Built from `backend/Dockerfile` and `frontend/Dockerfile` (referenced by CD workflow); pushed to `ghcr.io/jol-hub/jol-hub/backend` and `.../frontend`.
- **Helm chart**: `infra/helm/jol-hub/Chart.yaml` declares `version: 1.0.0`, `appVersion: "1.0.0"`, maintainer info, sources URL; templates under `templates/` include backend, celery, frontend, ingress, secrets, configmap, service monitor.
- **Kustomize manifests**: `infra/kubernetes/` provides base Kustomize overlays (`base/`, `apps/`, `monitoring/`, `logging/`, `networking/`, `security/`, `observability/`) alongside Helm.

## Versioning strategy

- Frontend packages follow semantic versioning driven by Changesets; releases produce changelog entries and publish to npm.
- Docker images receive multiple tags per commit: branch name, PR ref, `major.minor` semver, `sha-<commit>`, and `latest` only on main.
- Helm chart version is manually bumped in `Chart.yaml` (currently `1.0.0`).
- Data pipeline versions are not centrally versioned; DAGs and dbt models are deployed by pushing code and re-triggering Airflow.

## Constraints and conventions

- Secrets are never committed: `POSTGRES_PASSWORD`, `MONGO_INITDB_ROOT_PASSWORD`, `DJANGO_SECRET_KEY` are overridden via local `.env` files; CI uses GitHub secrets.
- MongoDB is bound to loopback in docker-compose (`127.0.0.1:27017`) to prevent public exposure.
- Backend runs as non-root user `jolhub` in production images.
- Health endpoints: backend exposes `/health/` (used in Docker HEALTHCHECK and CI smoke tests); CD also probes `/api/v1/health/`, `/api/v1/health/db/`, and root `/`.
- All lint/format rules are enforced as CI failures (black, isort, flake8, prettier, eslint, tsc) — changes that do not pass these gates cannot merge.