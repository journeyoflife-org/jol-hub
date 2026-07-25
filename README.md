# JOL-HUB — Journey of Life Enterprise Monorepo

> Central integration monorepo for a white-label, multi-tenant website publishing platform serving Catholic ministries, funeral services, cemetery care, memorial marketplaces, and religious communities across Europe and beyond.

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Platform: Ubuntu 24.04](https://img.shields.io/badge/Platform-Ubuntu_24.04-orange.svg)](https://ubuntu.com/)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-6.x-green.svg)](https://www.djangoproject.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10.x-f69220.svg)](https://pnpm.io/)
[![Compliance: GDPR | SOC2 | ISO 27001](https://img.shields.io/badge/Compliance-GDPR%20%7C%20SOC2%20%7C%20ISO%2027001-green.svg)](#compliance--security)

---

## Table of Contents

- [Quick Facts](#quick-facts)
- [What is JOL-HUB?](#what-is-jol-hub)
- [Architecture](#architecture)
- [Repository Structure](#repository-structure)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [Running the Platform](#running-the-platform)
- [Frontend Development](#frontend-development)
- [Data Pipelines](#data-pipelines)
- [Testing](#testing)
- [Database & Migrations](#database--migrations)
- [Compliance & Security](#compliance--security)
- [CI/CD & Automation](#cicd--automation)
- [Deployment](#deployment)
- [MCP Servers](#mcp-servers)
- [Satellite Repositories](#satellite-repositories)
- [Contributing](#contributing)
- [Support & Security](#support--security)
- [License](#license)

---

## Quick Facts

| Attribute | Value |
|---|---|
| **Platform target** | ~400,000 tenant websites |
| **Countries served** | 27 EU countries + international |
| **Monorepo root** | `/opt/jol/repos/jol-hub` |
| **Primary backend** | Python 3.12 + Django 6.x |
| **Primary frontend** | TypeScript 5.x + React + Turborepo + pnpm |
| **Database** | PostgreSQL 16 |
| **Task queue** | Celery + Redis 7 |
| **Container runtime** | Docker + Docker Compose |
| **Compliance** | GDPR · SOC 2 Type II · ISO 27001 |
| **Branch model** | GitFlow |
| **Primary IDE** | PhpStorm (monorepo), PyCharm (Python services) |

---

## What is JOL-HUB?

**JOL-HUB** is the authoritative source of truth for the **Journey of Life** platform. It coordinates satellite repositories, shared platform logic, canonical data entities, country-specific configurations, infrastructure definitions, and AI orchestration.

The platform is built around three core ideas:

1. **Multi-tenancy** — one deployment serves thousands of independent, white-labelled tenant sites.
2. **Country-aware configuration** — per-country legal entity types, taxonomies, VAT rules, and compliance defaults.
3. **Compliance by design** — GDPR Article 30 records, audit logging, encryption, and access controls are first-class concerns.

---

## Architecture

```text
                            ┌─────────────────────────────────┐
                            │        JOL-HUB (this repo)       │
                            │   Central Integration Monorepo    │
                            └──────────────┬────────────────────┘
                                           │
           ┌───────────────────────────────┼───────────────────────────────┐
           │                               │                               │
    ┌──────▼──────┐               ┌────────▼────────┐             ┌───────▼──────────┐
    │  backend/   │               │   frontend/     │             │    infra/        │
    │  Django API │               │  Turborepo apps │             │  IaC / CI-CD     │
    │  + Celery   │               │  Admin + tenants│             │  K8s / Terraform │
    └──────┬──────┘               └────────┬────────┘             └───────┬──────────┘
           │                               │                               │
    ┌──────▼──────┐               ┌────────▼────────┐             ┌───────▼──────────┐
    │  entities/  │               │   countries/    │             │    data/         │
    │ Domain data │               │  Country config │             │  Airflow / dbt   │
    └─────────────┘               └─────────────────┘             └──────────────────┘
           │
           ▼
    ┌──────────────────────────────────────────────────────────────┐
    │                   Satellite Repositories                      │
    │  jol-backend-platform · jol-frontend-platform                │
    │  jol-analytics-ai · jol-infrastructure · jol-ecommerce       │
    │  jol-bitrix24-integration · jol-domain-taxonomy              │
    │  jol-link-registry · mcp-servers                             │
    └──────────────────────────────────────────────────────────────┘
```

### Key runtime services

| Service | Local container | Port | Responsibility |
|---|---|---|---|
| PostgreSQL | `jolhub-db` | `5432` | Primary relational datastore |
| Redis | `jolhub-redis` | `6379` | Cache, session store, Celery broker |
| Django backend | `jolhub-backend` | `8000` | REST API, admin, business logic |
| Celery worker | `jolhub-celery-worker` | — | Background task processing |
| Celery beat | `jolhub-celery-beat` | — | Scheduled task dispatcher |

---

## Repository Structure

```text
jol-hub/
├── ai/                          # AI orchestration modules
│   ├── compliance/              #   Compliance-oriented AI checks
│   ├── data/                    #   Training / export data
│   ├── infrastructure/          #   AI runtime infrastructure
│   └── models/                  #   Model definitions
├── backend/                     # Platform backend
│   ├── django/                  #   Django project root
│   │   ├── apps/                #     Domain apps (users, organizations, donations, crm, ...)
│   │   ├── core/                #     Settings, URLs, WSGI
│   │   ├── static/              #     Static assets
│   │   ├── manage.py            #     Django CLI entrypoint
│   │   ├── requirements.txt     #     Pinned production dependencies
│   │   └── .env.example         #     Backend environment template
│   ├── logs/                    #   Application logs
│   ├── tmp/                     #   Temporary files
│   ├── Dockerfile               #   Production image
│   ├── Dockerfile.dev           #   Development image
│   ├── requirements.txt         #   Loose dependency constraints
│   └── manage.py                #   Top-level helper
├── countries/                   # Per-country configuration (27 EU folders)
│   ├── lt/                      #   Lithuania (reference implementation)
│   ├── lv/                      #   Latvia
│   ├── de/                      #   Germany
│   └── ...                      #   One directory per country
├── data/                        # Data pipelines, ETL, GDPR utilities
│   ├── airflow/                 #   Airflow DAGs
│   ├── dbt/                     #   dbt models
│   ├── src/                     #   Python pipeline code
│   ├── sql/                     #   SQL scripts
│   └── tests/                   #   pytest suite
├── docs/                        # Architecture & compliance docs
│   ├── api/                     #   OpenAPI specs
│   ├── architecture/            #   System overview, data flow, security model
│   ├── compliance/              #   GDPR checklist
│   ├── legal/                   #   Legal documents
│   ├── runbooks/                #   Operational runbooks
│   └── training/                #   Training material
├── entities/                    # Canonical domain entities
│   ├── catholic/
│   ├── orthodox/
│   ├── protestant/
│   └── services/
├── frontend/                    # Web UI monorepo
│   ├── apps/                    #   Tenant and admin applications
│   ├── packages/                #   Shared libraries (auth, ui, i18n, bitrix-sdk)
│   ├── react/                   #   React-specific code
│   ├── vue/                     #   Vue-specific code
│   ├── shared/                  #   Cross-framework shared assets
│   ├── package.json             #   Root package manifest
│   ├── pnpm-workspace.yaml      #   pnpm workspace config
│   └── turbo.json               #   Turborepo pipeline config
├── infra/                       # Infrastructure as Code
│   ├── helm/                    #   Helm charts
│   ├── kubernetes/              #   Kubernetes manifests
│   ├── networking/              #   Network definitions
│   ├── observability/           #   Monitoring & logging
│   ├── security/                #   Security policies
│   └── terraform/               #   Terraform modules
├── ops/                         # Operational configuration
│   ├── deployment/
│   ├── incident/
│   ├── monitoring/
│   └── scaling/
├── scripts/                     # Dev/ops utility scripts
│   ├── fix-dashboard.sh
│   ├── run_compliance_tests.py
│   ├── run_tenant_verification.py
│   ├── setup-venvs.sh
│   └── validate_entity_configs.py
├── tools/                       # Internal CLI utilities & MCP servers
│   ├── cli/
│   ├── generators/
│   ├── linters/
│   ├── qoder/
│   ├── scripts/
│   ├── mcp-bitrix24.py
│   ├── mcp-compliance.py
│   ├── mcp-postgres.py
│   └── requirements-mcp.txt
├── docker-compose.yml           # Local development stack
├── qodana.yaml                  # JetBrains Qodana config
├── .editorconfig
├── .gitattributes
├── .gitignore
├── LICENSE
└── README.md
```

---

## Technology Stack

### Backend

| Layer | Technology |
|---|---|
| Framework | Django 6.x + Django REST Framework |
| Authentication | OAuth 2.1 / OIDC, JWT, TOTP MFA |
| Database | PostgreSQL 16 |
| Cache / broker | Redis 7 |
| Task queue | Celery + django-celery-beat |
| Storage | AWS S3 via django-storages |
| Payments | Stripe, PayPal |
| Documentation | drf-spectacular (OpenAPI 3) |

### Frontend

| Layer | Technology |
|---|---|
| Monorepo | Turborepo + pnpm workspaces |
| Languages | TypeScript 5.x, JavaScript |
| Frameworks | React, Vue |
| Styling | Tailwind CSS |
| Lint / format | ESLint, Prettier |
| Package manager | pnpm 10.x |

### Data & AI

| Layer | Technology |
|---|---|
| ETL orchestration | Apache Airflow |
| Transformations | dbt |
| Data quality | Great Expectations |
| Privacy | k-anonymity, pseudonymization, encryption |
| AI modules | Compliance checks, content generation, SEO tagging |

### Infrastructure

| Layer | Technology |
|---|---|
| Containers | Docker, Docker Compose |
| Orchestration | Kubernetes, Helm |
| IaC | Terraform |
| CI/CD | GitHub Actions |
| Code quality | JetBrains Qodana |

---

## Quick Start

The fastest way to a working local environment is Docker Compose. It starts PostgreSQL, Redis, Django, and Celery with sensible defaults.

```bash
# 1. Clone the repository
mkdir -p /opt/jol/repos
cd /opt/jol/repos
git clone git@github.com:journeyoflife-org/jol-hub.git
cd jol-hub

# 2. Copy backend environment template
cp backend/django/.env.example backend/django/.env

# 3. Start the local stack
docker compose up -d

# 4. Verify services
docker compose ps
curl http://localhost:8000/health/   # or the configured health endpoint
```

> **Note:** `main.py` at the repository root is currently a placeholder. Use the commands in [Running the Platform](#running-the-platform) for real service entry points.

---

## Local Development Setup

### Prerequisites

| Tool | Minimum Version | Purpose |
|---|---|---|
| Ubuntu | 24.04 LTS | Development OS |
| Python | 3.12 | Backend runtime |
| Node.js | 20.x LTS | Frontend runtime |
| pnpm | 9.x | Frontend package manager |
| Docker | 24.x | Container runtime |
| Docker Compose | 2.x | Local stack orchestration |
| Git | 2.43+ | Version control |
| PostgreSQL client | 16.x | Local DB inspection (optional) |

### 1. SSH key for GitHub

```bash
ssh-keygen -t ed25519 -C "your-email@journeyoflife.org" -f ~/.ssh/id_ed25519_jol
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519_jol

cat >> ~/.ssh/config << 'EOF'
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_jol
    AddKeysToAgent yes
EOF

cat ~/.ssh/id_ed25519_jol.pub
# Add the printed key to GitHub → Settings → SSH and GPG keys
```

### 2. Git configuration

```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@journeyoflife.org"
git config --global init.defaultBranch main
git config --global pull.rebase false
git config --global core.autocrlf input
git config --global commit.gpgsign true
git config --global core.editor "nano"
```

### 3. Python environments

The monorepo uses separate virtual environments for different concerns.

#### Backend environment

```bash
python3.12 -m venv /opt/jol/venvs/jol-hub
source /opt/jol/venvs/jol-hub/bin/activate
pip install --upgrade pip setuptools wheel

# Use the pinned Django requirements
pip install -r backend/django/requirements.txt
```

#### Data environment

```bash
python3.12 -m venv /opt/jol/venvs/jol-data
source /opt/jol/venvs/jol-data/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r data/requirements.txt
```

#### MCP tools environment

```bash
python3.12 -m venv /opt/jol/venvs/jol-mcp
source /opt/jol/venvs/jol-mcp/bin/activate
pip install -r tools/requirements-mcp.txt
```

### 4. Frontend dependencies

```bash
cd frontend
pnpm install
cd ..
```

### 5. Configure environment variables

```bash
cp backend/django/.env.example backend/django/.env
# Edit backend/django/.env with your local values
```

---

## Environment Variables

Backend configuration is read from `backend/django/.env`. Key variables are listed below; see `backend/django/.env.example` for the complete template.

| Variable | Required | Description |
|---|---|---|
| `DEBUG` | Yes | `True` for local development, `False` in production |
| `SECRET_KEY` | Yes | Django secret key (≥50 characters in production) |
| `ALLOWED_HOSTS` | Yes | Comma-separated allowed hostnames |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `CELERY_BROKER_URL` | Yes | Celery broker URL |
| `CELERY_RESULT_BACKEND` | Yes | Celery result backend URL |
| `STRIPE_SECRET_KEY` | Conditional | Required for payment processing |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | Conditional | Required for PayPal donations |
| `EMAIL_HOST_USER` | Conditional | SMTP username for outbound email |
| `EMAIL_HOST_PASSWORD` | Conditional | SMTP password or app token |

> **Security:** Never commit `.env` files. All secrets must come from environment variables or a secrets manager. See [`.github/SECURITY.md`](.github/SECURITY.md).

---

## Running the Platform

### Full stack with Docker Compose

```bash
docker compose up -d
docker compose logs -f backend
```

### Backend only (local virtualenv)

```bash
source /opt/jol/venvs/jol-hub/bin/activate
cd backend/django

python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### Celery worker (local virtualenv)

```bash
source /opt/jol/venvs/jol-hub/bin/activate
cd backend/django

celery -A core worker -l info -c 2
```

### Celery beat scheduler (local virtualenv)

```bash
source /opt/jol/venvs/jol-hub/bin/activate
cd backend/django

celery -A core beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

### Stopping the stack

```bash
docker compose down          # Stop and remove containers
docker compose down -v       # Stop and remove containers + volumes
```

---

## Frontend Development

### Start all apps in development mode

```bash
cd frontend
pnpm dev
```

### Build all apps

```bash
cd frontend
pnpm build
```

### Lint and format

```bash
cd frontend
pnpm lint
pnpm format
pnpm type-check
```

### Build tenant-specific apps only

```bash
cd frontend
pnpm build:entities
```

### Useful frontend scripts

| Script | Purpose |
|---|---|
| `pnpm dev` | Start all apps in dev mode |
| `pnpm build` | Production build of all packages and apps |
| `pnpm lint` | Run ESLint across the workspace |
| `pnpm type-check` | Run TypeScript type checks |
| `pnpm format` | Format with Prettier |
| `pnpm test` | Run all test suites |
| `pnpm compliance:check` | Run admin-dashboard compliance checks |
| `pnpm gdpr:validate` | Validate GDPR rules in admin-dashboard |

---

## Data Pipelines

### Activate environment

```bash
source /opt/jol/venvs/jol-data/bin/activate
cd /opt/jol/repos/jol-hub/data
```

### Run tests

```bash
pytest tests/
```

### Generate a GDPR Article 30 ROPA report

```bash
python -c "from src.gdpr import ROPAGenerator; ROPAGenerator().save_report()"
```

### Trigger daily ETL

```bash
airflow dags trigger jol_daily_sync
```

### Validate data quality

```bash
python -m src.  cli run_checks --checkpoint entity_completeness
```

### Generate compliance report

```bash
python -m src.cli compliance_report --days 30
```

---

## Testing

### Backend

```bash
source /opt/jol/venvs/jol-hub/bin/activate
cd backend/django

pytest
# or with coverage
pytest --cov=. --cov-report=html --cov-report=term
```

### Data module

```bash
source /opt/jol/venvs/jol-data/bin/activate
cd data
pytest tests/
```

### Frontend

```bash
cd frontend
pnpm test
pnpm test:coverage
```

### Compliance tests

```bash
# Run compliance tests for all standards
python scripts/run_compliance_tests.py --country lt --all

# Run for a specific entity type
python scripts/run_compliance_tests.py --country lt --entity-type cathedral

# JSON output
python scripts/run_compliance_tests.py --standard gdpr --output json
```

### Coverage requirement

Backend services require a **minimum of 80%** test coverage before merging to `develop`.

---

## Database & Migrations

Migrations live inside the individual Django apps.

```bash
source /opt/jol/venvs/jol-hub/bin/activate
cd backend/django

# Apply migrations
python manage.py migrate

# Create a new migration
python manage.py makemigrations <app_name>

# Rollback one migration
python manage.py migrate <app_name> zero-1
```

---

## Compliance & Security

Journey of Life operates under the following frameworks:

| Framework | Status | Scope |
|---|---|---|
| **GDPR** | Required | All EU personal data processing |
| **SOC 2 Type II** | Target | Platform availability, security, confidentiality |
| **ISO 27001** | Target | Information security management |

### Built-in controls

- GPG-signed commits are required (`git config --global commit.gpgsign true`).
- Branch protection is enforced on `main` and `develop`.
- `CODEOWNERS` mandates review for security-sensitive paths.
- Secrets must never appear in source code.
- The `compliance/` MCP server enforces audit trails for regulated operations.
- Field-level encryption for PII, Argon2 password hashing, and TLS 1.3 in transit.

See [`.github/SECURITY.md`](.github/SECURITY.md) for the full disclosure policy and incident response process.

---

## CI/CD & Automation

GitHub Actions workflows are in `.github/workflows/`:

| Workflow | Purpose |
|---|---|
| `ci.yml` | Lint, test, and build verification |
| `cd.yml` | Continuous deployment |
| `compliance-check.yml` | GDPR / SOC2 / PCI-DSS compliance validation |
| `security-scan.yml` | Dependency, secret, and container scanning |
| `entity-apps.yml` | Build and test entity frontend apps |
| `entity-apps-deploy.yml` | Deploy tenant frontend apps |

### Local code quality

```bash
# Python formatting
source /opt/jol/venvs/jol-hub/bin/activate
cd backend/django
black .
isort .
flake8 .

# Qodana (JetBrains)
docker run --rm -v $(pwd):/data/project jetbrains/qodana-php:2025.3
```

---

## Deployment

### Kubernetes / Helm

Helm charts are under `infra/helm/jol-hub/` and Kubernetes manifests under `infra/kubernetes/`.

```bash
# Example: deploy backend
helm upgrade --install jol-hub ./infra/helm/jol-hub \
  --namespace jol-hub \
  --values infra/helm/jol-hub/values.yaml
```

### Terraform

Terraform modules are under `infra/terraform/`. Run plans from the appropriate environment directory.

---

## MCP Servers

MCP (Model Context Protocol) servers are located in `/opt/jol/mcp-servers/` and provide AI tool integrations. See the [mcp-servers](https://github.com/journeyoflife-org/mcp-servers) repository for full documentation.

```bash
cd /opt/jol/mcp-servers
docker compose -f docker-compose.mcp.yml up -d
```

Available MCP servers include: `bitrix24`, `compliance`, `filesystem`, `git`, `postgres`, `shared`, `web`.

---

## Satellite Repositories

Satellite repositories are cloned under `/opt/jol/repos/` and maintain their own lifecycle. JOL-HUB coordinates but does not own their internals.

| Repository | Local Path | IDE | Description |
|---|---|---|---|
| [jol-backend-platform](https://github.com/journeyoflife-org/jol-backend-platform) | `/opt/jol/repos/jol-backend-platform` | PyCharm | Core backend APIs and services |
| [jol-frontend-platform](https://github.com/journeyoflife-org/jol-frontend-platform) | `/opt/jol/repos/jol-frontend-platform` | PhpStorm | Tenant-facing frontend platform |
| [jol-infrastructure](https://github.com/journeyoflife-org/jol-infrastructure) | `/opt/jol/repos/jol-infrastructure` | PyCharm | Terraform, Ansible, CI/CD configs |
| [jol-analytics-ai](https://github.com/journeyoflife-org/jol-analytics-ai) | `/opt/jol/repos/jol-analytics-ai` | PyCharm | Analytics and AI enrichment services |
| [jol-ecommerce-engine](https://github.com/journeyoflife-org/jol-ecommerce-engine) | `/opt/jol/repos/jol-ecommerce-engine` | PhpStorm | Product catalog, payments, VAT |
| [jol-bitrix24-integration](https://github.com/journeyoflife-org/jol-bitrix24-integration) | `/opt/jol/repos/jol-bitrix24-integration` | PyCharm | Bitrix24 CRM integration layer |
| [jol-domain-taxonomy](https://github.com/journeyoflife-org/jol-domain-taxonomy) | `/opt/jol/repos/jol-domain-taxonomy` | PyCharm | Canonical taxonomy and classifications |
| [jol-link-registry](https://github.com/journeyoflife-org/jol-link-registry) | `/opt/jol/repos/jol-link-registry` | PyCharm | Platform-wide URL and link registry |
| [mcp-servers](https://github.com/journeyoflife-org/mcp-servers) | `/opt/jol/mcp-servers` | PyCharm | MCP server orchestration layer |

---

## Contributing

Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) before submitting a pull request.

1. Create a feature or fix branch from `develop`.
2. Write tests for your changes.
3. Ensure all tests pass locally.
4. Sign all commits with GPG.
5. Open a pull request against `develop` with a clear description.
6. Address all review comments before merge.

For major architectural changes, create an **Architecture Decision Record (ADR)** in `docs/decisions/` before implementation.

### Branching strategy (GitFlow)

| Branch | Purpose | Who can push |
|---|---|---|
| `main` | Production-ready code only | Merge via PR, requires 2 approvals |
| `develop` | Integration branch | Merge via PR, requires 1 approval |
| `feature/*` | New features | Developer |
| `release/*` | Release preparation | Release manager |
| `hotfix/*` | Production emergency fixes | Senior developer + PM |
| `fix/*` | Bug fixes on develop | Developer |

### Commit message format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```text
type(scope): short description

feat(backend): add multi-country VAT calculation
fix(frontend): resolve mobile layout on dashboard
docs(readme): update local setup instructions
chore(infra): update Terraform provider versions
```

---

## Support & Security

**Do not report security vulnerabilities in public GitHub issues.**

- Security team: [security@journeyoflife.org](mailto:security@journeyoflife.org)
- Data Protection Officer: [dpo@journeyoflife.org](mailto:dpo@journeyoflife.org)
- Security documentation: [docs.jolhub.org/security](https://docs.jolhub.org/security)

For operational questions, see the runbooks in `docs/runbooks/`.

---

## License

This project is licensed under the **Apache License, Version 2.0**. See [`LICENSE`](LICENSE) for the full license text.

Copyright © 2024–2026 Journey of Life Organization. All rights reserved.
