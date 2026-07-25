# JOL-HUB — Journey of Life Enterprise Monorepo

> **Platform for ~400,000 independent websites** across 27 EU countries and beyond, serving Catholic ministries, funeral services, cemetery care, memorial marketplaces, and religious communities.

***

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Repository Structure](#repository-structure)
- [Sub-Projects (Satellite Repositories)](#sub-projects-satellite-repositories)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [Running the Platform](#running-the-platform)
- [Testing](#testing)
- [Database & Migrations](#database--migrations)
- [MCP Servers](#mcp-servers)
- [AI Layer](#ai-layer)
- [Countries & Multi-Tenancy](#countries--multi-tenancy)
- [Scripts & Automation](#scripts--automation)
- [Infrastructure & DevOps](#infrastructure--devops)
- [Compliance](#compliance)
- [Branching Strategy](#branching-strategy)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)
- [Maintainers](#maintainers)

***

## Overview

**JOL-HUB** is the central integration monorepo for the **Journey of Life** platform — a white-label, multi-tenant website publishing system designed to serve religious institutions, memorial services, and funeral service providers across Europe and globally.

The monorepo acts as the **authoritative source of truth** for shared platform logic, coordination between satellite services, canonical data entities, country-specific configurations, infrastructure definitions, and AI orchestration.

| Attribute            | Value                                              |
|----------------------|----------------------------------------------------|
| **Platform target**  | ~400,000 tenant websites                           |
| **Countries served** | 27+ EU countries + international                   |
| **Primary language** | Python 3.12 (backend), TypeScript 5.x (frontend)  |
| **Primary IDE**      | PhpStorm (monorepo), PyCharm (Python services)     |
| **Local path**       | `/opt/jol/repos/jol-hub`                           |
| **GitHub remote**    | `git@github.com:journeyoflife-org/jol-hub.git`     |
| **Branch model**     | GitFlow (main / develop / feature / release / fix) |
| **Compliance**       | GDPR · SOC 2 Type II · ISO 27001                   |

***

## Architecture

```
                        ┌─────────────────────────────────┐
                        │        JOL-HUB (this repo)       │
                        │  Central Integration Monorepo     │
                        └────────────┬────────────────────-┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
  ┌──────▼──────┐           ┌────────▼────────┐         ┌───────▼──────────┐
  │  backend/   │           │   frontend/     │         │    infra/        │
  │  API layer  │           │  Web UI / Admin │         │  IaC / CI-CD     │
  └──────┬──────┘           └────────┬────────┘         └───────┬──────────┘
         │                           │                           │
  ┌──────▼──────┐           ┌────────▼────────┐         ┌───────▼──────────┐
  │  entities/  │           │   countries/    │         │    data/         │
  │ Domain data │           │  Country config │         │  Pipelines/ETL   │
  └─────────────┘           └─────────────────┘         └──────────────────┘
         │
  ┌──────▼──────────────────────────────────────────────────────┐
  │                   Satellite Repositories                     │
  │  jol-auth · jol-analytics-ai · jol-bitrix24-integration      │
  │  jol-compliance · jol-devops · jol-ecommerce-engine          │
  │  jol-infrastructure · jol-link-registry · jol-mcp-servers     │
  │  jol-repo-template · jol-scripts · jol-security             │
  │  (stubs: jol-backend-platform · jol-frontend-platform        │
  │         · jol-domain-taxonomy)                               │
  └─────────────────────────────────────────────────────────────┘
```

***

## Repository Structure

```
jol-hub/
│
├── ai/                        # AI orchestration modules (4 modules)
│   ├── content-generation/    #   Auto-content for tenant websites
│   ├── seo-tagging/           #   Automated SEO tag/metadata generation
│   ├── lead-scoring/          #   CRM lead intelligence
│   └── chatbot/               #   FAQ/chatbot service layer
│
├── backend/                   # Platform backend (APIs, business logic)
│   ├── api/                   #   REST / GraphQL endpoints
│   ├── services/              #   Domain services
│   ├── models/                #   ORM models (SQLAlchemy)
│   ├── migrations/            #   Alembic database migrations
│   └── tests/                 #   Backend unit & integration tests
│
├── countries/                 # Per-country configuration (26 folders)
│   ├── LT/                    #   Lithuania
│   ├── DE/                    #   Germany
│   ├── PL/                    #   Poland
│   └── ...                    #   (one directory per country)
│
├── data/                      # Data pipelines and ETL jobs
│   ├── pipelines/
│   ├── schemas/
│   └── fixtures/
│
├── docs/                      # Architecture documentation
│   ├── architecture/
│   ├── api/
│   ├── runbooks/
│   └── decisions/             #   Architecture Decision Records (ADRs)
│
├── entities/                  # Canonical domain entities (shared types)
│
├── frontend/                  # Web UI (multi-tenant admin + public)
│   ├── apps/
│   ├── components/
│   ├── pages/
│   ├── styles/
│   └── tests/
│
├── infra/                     # Infrastructure as Code
│   ├── terraform/
│   ├── ansible/
│   ├── kubernetes/
│   └── docker/
│
├── ops/                       # Operational configuration
│
├── scripts/                   # Dev/ops utility scripts
│   ├── dev-setup.sh
│   ├── create-isolated-repos.sh
│   └── fix-paths.sh
│
├── tools/                     # Internal CLI utilities
│
├── docker-compose.yml         # Local development stack
├── main.py                    # Platform entrypoint
├── qodana.yaml                # JetBrains Qodana code quality config
├── .editorconfig              # Universal editor config
├── .gitattributes             # Line endings & merge drivers
├── .gitignore                 # Ignore rules
├── CHANGELOG.md               # Release history
├── CONTRIBUTING.md            # Contribution guide
├── LICENSE                    # Apache-2.0
├── README.md                  # This file
└── SECURITY.md                # Vulnerability disclosure policy
```

***

## Sub-Projects (Satellite Repositories)

All satellite repositories are cloned under `/opt/jol/repos/` and maintain their own lifecycle. JOL-HUB coordinates but does not own their internals.

### Active Satellite Repositories

| Repository | Local Path | IDE | Description |
|---|---|---|---|
| [jol-auth](https://github.com/journeyoflife-org/jol-auth) | `/opt/jol/repos/jol-auth` | PyCharm | OAuth 2.1 / OIDC authentication service |
| [jol-analytics-ai](https://github.com/journeyoflife-org/jol-analytics-ai) | `/opt/jol/repos/jol-analytics-ai` | PyCharm | Analytics and AI enrichment services |
| [jol-bitrix24-integration](https://github.com/journeyoflife-org/jol-bitrix24-integration) | `/opt/jol/repos/jol-bitrix24-integration` | PyCharm | Bitrix24 CRM integration layer |
| [jol-compliance](https://github.com/journeyoflife-org/jol-compliance) | `/opt/jol/repos/jol-compliance` | PyCharm | GDPR / SOC 2 / ISO 27001 compliance engine |
| [jol-devops](https://github.com/journeyoflife-org/jol-devops) | `/opt/jol/repos/jol-devops` | PyCharm | DevOps tooling, automation scripts, runbooks |
| [jol-ecommerce-engine](https://github.com/journeyoflife-org/jol-ecommerce-engine) | `/opt/jol/repos/jol-ecommerce-engine` | PhpStorm | Product catalog, payments, VAT (PCI-DSS SAQ A) |
| [jol-infrastructure](https://github.com/journeyoflife-org/jol-infrastructure) | `/opt/jol/repos/jol-infrastructure` | PyCharm | Terraform, Ansible, CI/CD configs |
| [jol-link-registry](https://github.com/journeyoflife-org/jol-link-registry) | `/opt/jol/repos/jol-link-registry` | PyCharm | Platform-wide URL and link registry |
| [jol-mcp-servers](https://github.com/journeyoflife-org/jol-mcp-servers) | `/opt/jol/repos/jol-mcp-servers` | PyCharm | MCP server orchestration layer |
| [jol-repo-template](https://github.com/journeyoflife-org/jol-repo-template) | `/opt/jol/repos/jol-repo-template` | PyCharm | Template repository for new satellite repos |
| [jol-scripts](https://github.com/journeyoflife-org/jol-scripts) | `/opt/jol/repos/jol-scripts` | PyCharm | Shared utility and migration scripts |
| [jol-security](https://github.com/journeyoflife-org/jol-security) | `/opt/jol/repos/jol-security` | PyCharm | Security scanning, WAF rules, pen-test tooling |

### Stub Repositories (not yet populated)

The following repositories exist on GitHub but contain only a placeholder README. They are reserved for future decomposition of the monolith.

| Repository | Local Path | Status |
|---|---|---|
| [jol-backend-platform](https://github.com/journeyoflife-org/jol-backend-platform) | `/opt/jol/repos/jol-backend-platform` | Stub — reserved for backend microservice extraction |
| [jol-frontend-platform](https://github.com/journeyoflife-org/jol-frontend-platform) | `/opt/jol/repos/jol-frontend-platform` | Stub — reserved for frontend monorepo extraction |
| [jol-domain-taxonomy](https://github.com/journeyoflife-org/jol-domain-taxonomy) | `/opt/jol/repos/jol-domain-taxonomy` | Stub — reserved for canonical domain model extraction |

***

## Prerequisites

| Tool | Minimum Version | Install |
|---|---|---|
| Ubuntu | 24.04 LTS | [ubuntu.com](https://ubuntu.com) |
| Python | 3.12 | `apt install python3.12` |
| Node.js | 20.x LTS | [nodejs.org](https://nodejs.org) |
| Docker | 24.x | [docs.docker.com](https://docs.docker.com/engine/install/ubuntu/) |
| Docker Compose | 2.x | included with Docker |
| Git | 2.43+ | `apt install git` |
| PhpStorm | 2024.x | [jetbrains.com/phpstorm](https://www.jetbrains.com/phpstorm/) |
| PyCharm | 2024.x | [jetbrains.com/pycharm](https://www.jetbrains.com/pycharm/) |
| gh CLI | 2.x | [cli.github.com](https://cli.github.com) |

***

## Local Development Setup

### 1. SSH Key Configuration (required)

```bash
# Generate a dedicated ed25519 key for GitHub
ssh-keygen -t ed25519 -C "your-email@journeyoflife.org" -f ~/.ssh/id_ed25519_jol

# Add to ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519_jol

# Configure SSH to use this key for GitHub
cat >> ~/.ssh/config << 'EOF'
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_jol
    AddKeysToAgent yes
EOF

# Copy public key and add to GitHub → Settings → SSH and GPG keys
cat ~/.ssh/id_ed25519_jol.pub
```

### 2. Git Global Configuration

```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@journeyoflife.org"
git config --global init.defaultBranch main
git config --global pull.rebase false
git config --global core.autocrlf input
git config --global core.editor "nano"
```

### 3. Clone the Repository

```bash
mkdir -p /opt/jol/repos
cd /opt/jol/repos
git clone git@github.com:journeyoflife-org/jol-hub.git
cd jol-hub
```

### 4. Python Virtual Environment

```bash
python3.12 -m venv /opt/jol/venvs/jol-hub
source /opt/jol/venvs/jol-hub/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r backend/requirements.txt
pip install -r ai/requirements.txt
```

### 5. Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### 6. Start the Local Stack

```bash
docker compose up -d
```

This starts PostgreSQL, Redis, and supporting services defined in `docker-compose.yml`.

### 7. Open in IDE

**PhpStorm** (recommended for full monorepo work):
```
File → Open → /opt/jol/repos/jol-hub
```

**PyCharm** (for Python-only work on backend/ai/scripts):
```
File → Open → /opt/jol/repos/jol-hub
Settings → Project Interpreter → /opt/jol/venvs/jol-hub/bin/python
```

***

## Environment Variables

Copy the example file and configure for your local environment:

```bash
cp .env.example .env
```

**Never commit `.env` to version control.** All sensitive values must come from environment variables or a secrets manager. See [`SECURITY.md`](SECURITY.md) for the secrets handling policy.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `SECRET_KEY` | Yes | Application secret key (min 64 chars) |
| `JWT_SECRET` | Yes | JWT signing key |
| `BITRIX24_WEBHOOK_URL` | Conditional | Bitrix24 CRM integration webhook |
| `AI_API_KEY` | Conditional | AI service API key |
| `ALLOWED_HOSTS` | Yes | Comma-separated allowed hostnames |
| `DEBUG` | No | Set `false` in production |
| `LOG_LEVEL` | No | Default: `INFO` |
| `COUNTRY_CODE` | No | Default country context |

***

## Running the Platform

```bash
# Start all services
docker compose up -d

# Backend API (development)
source /opt/jol/venvs/jol-hub/bin/activate
cd backend
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

# Frontend (development)
cd frontend
npm run dev

# Run all services via main entrypoint
python main.py
```

***

## Testing

```bash
# Backend tests
source /opt/jol/venvs/jol-hub/bin/activate
cd backend
pytest tests/ -v --cov=. --cov-report=html

# Frontend tests
cd frontend
npm run test

# End-to-end tests
npm run test:e2e

# Code quality (JetBrains Qodana)
docker run --rm -v $(pwd):/data/project \
  jetbrains/qodana-python:latest
```

Test coverage requirement: **minimum 80%** for backend services before merge to `develop`.

***

## Database & Migrations

```bash
# Apply all pending migrations
source /opt/jol/venvs/jol-hub/bin/activate
cd backend
alembic upgrade head

# Create a new migration
alembic revision --autogenerate -m "description_of_change"

# Rollback last migration
alembic downgrade -1
```

***

## MCP Servers

MCP (Model Context Protocol) servers are located in `/opt/jol/mcp-servers/` and provide AI tool integrations. See the [mcp-servers](https://github.com/journeyoflife-org/mcp-servers) repository for full documentation.

```bash
# Start MCP servers stack
cd /opt/jol/mcp-servers
docker compose -f docker-compose.mcp.yml up -d
```

Available MCP servers: `bitrix24`, `compliance`, `filesystem`, `git`, `postgres`, `shared`, `web`.

***

## AI Layer

The `ai/` directory contains four AI service modules:

| Module | Responsibility |
|---|---|
| `content-generation/` | Auto-generate tenant website content (SEO-optimised) |
| `seo-tagging/` | Automated Schema.org structured data and meta tag generation |
| `lead-scoring/` | CRM lead intelligence and scoring pipeline |
| `chatbot/` | Tenant FAQ and conversational interface service |

Each module exposes a REST API consumed by `backend/` services. See `ai/README.md` for module-specific documentation.

***

## Countries & Multi-Tenancy

Country configurations under `countries/` define per-tenant defaults for:
- Language and locale (`locale.json`)
- Legal entity types (`entity-types.json`)
- Institution taxonomies (`taxonomy.json`)
- SEO and hreflang settings (`seo.json`)
- VAT and compliance rules (`compliance.json`)

Currently configured: **26 EU country folders** plus international.

***

## Scripts & Automation

| Script | Purpose |
|---|---|
| `scripts/dev-setup.sh` | Bootstrap local development environment |
| `scripts/create-isolated-repos.sh` | Create satellite repositories from template |
| `scripts/dev-setup-sparse-checkout.sh` | Sparse checkout for large-repo workflows |
| `scripts/fix-paths-monorepo-to-jol-hub.sh` | Migrate path references after repo rename |

***

## Infrastructure & DevOps

Infrastructure code lives in `infra/` and the satellite repository [`jol-infrastructure`](https://github.com/journeyoflife-org/jol-infrastructure).

| Tool | Usage |
|---|---|
| Terraform | Cloud resource provisioning |
| Ansible | Server configuration and provisioning |
| Docker Compose | Local development stacks |
| Kubernetes | Production container orchestration |
| GitHub Actions | CI/CD pipelines (`.github/workflows/`) |

***

## Compliance

Journey of Life operates under the following compliance frameworks:

| Framework | Status | Scope |
|---|---|---|
| **GDPR** | Required | All EU personal data processing |
| **SOC 2 Type II** | Target | Platform availability, security, confidentiality |
| **ISO 27001** | Target | Information security management |

**Key compliance controls in this repository:**

- All commits must be **GPG-signed** (`git config --global commit.gpgsign true`)
- Branch protection enforced on `main` and `develop` — no direct pushes
- `CODEOWNERS` file mandates review for security-sensitive paths
- Secrets must **never** appear in source code; use `.env` files locally and a secrets manager in production
- The `compliance/` MCP server enforces audit trails for regulated data operations
- See [`SECURITY.md`](SECURITY.md) for the full vulnerability disclosure and incident response policy

***

## Branching Strategy

This repository follows **GitFlow**:

| Branch | Purpose | Who can push |
|---|---|---|
| `main` | Production-ready code only | Merge via PR, requires 2 approvals |
| `develop` | Integration branch | Merge via PR, requires 1 approval |
| `feature/*` | New features | Developer |
| `release/*` | Release preparation | Release manager |
| `hotfix/*` | Production emergency fixes | Senior developer + PM |
| `fix/*` | Bug fixes on develop | Developer |

**Commit message format** (Conventional Commits):
```
type(scope): short description

feat(backend): add multi-country VAT calculation
fix(frontend): resolve mobile layout on dashboard
docs(readme): update local setup instructions
chore(infra): update Terraform provider versions
```

***

## Contributing

Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) before submitting a pull request. In summary:

1. Fork the repository or create a feature branch from `develop`
2. Write tests for your changes
3. Ensure all tests pass locally
4. Sign all commits with GPG
5. Open a pull request against `develop` with a clear description
6. Address all review comments before merge

For major architectural changes, create an **Architecture Decision Record (ADR)** in `docs/decisions/` before implementation.

***

## Security

**Do not report security vulnerabilities in public GitHub issues.**

Please read [`SECURITY.md`](SECURITY.md) for the full vulnerability disclosure policy and the private reporting process.

Responsible disclosure contact: **security@journeyoflife.org**

***

## License

This project is licensed under the **Apache License, Version 2.0**.
See the [`LICENSE`](LICENSE) file for the full license text.

Copyright © 2024–2026 Journey of Life Organization. All rights reserved.

***

## Maintainers

| Name | Role | GitHub |
|---|---|---|
| Gintaras Kazlauskas | Platform Architect / Lead Engineer | [@GintarasKaz](https://github.com/JourneyOfLife) |

Platform: [journeyoflife.org](https://journeyoflife.org) | GitHub Org: [github.com/journeyoflife-org](https://github.com/journeyoflife-org)

***
