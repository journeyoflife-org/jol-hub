# Contributing to JOL-HUB

Thank you for your interest in contributing to JOL-HUB — the white-label
publishing platform for Catholic ministries across the EU. This document
defines the standards and procedures every contributor must follow.

---

## 1. Prerequisites

| Requirement | Detail |
|---|---|
| **Git** | 2.40+ with GPG signing enabled |
| **Python** | 3.12+ (backend) |
| **Node.js** | 20+ with pnpm 9+ (frontend) |
| **PostgreSQL** | 16+ (local dev) |
| **Redis** | 7+ (Celery broker) |
| **MongoDB** | 7+ (secondary document store) |

Clone the repository and install pre-commit hooks:

```bash
git clone git@github.com:journeyoflife-org/jol-hub.git
cd jol-hub
pip install pre-commit
pre-commit install
```

---

## 2. Branching Strategy (GitFlow)

| Branch | Purpose | Who can push |
|---|---|---|
| `main` | Production-ready code only | Merge via PR, requires 2 approvals |
| `develop` | Integration branch | Merge via PR, requires 1 approval |
| `feature/*` | New features | Developer |
| `release/*` | Release preparation | Release manager |
| `hotfix/*` | Production emergency fixes | Senior developer + PM |
| `fix/*` | Bug fixes on develop | Developer |

### Creating a branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### Naming conventions

| Type | Pattern | Example |
|---|---|---|
| Feature | `feature/<short-description>` | `feature/vat-calculation-de` |
| Fix | `fix/<short-description>` | `fix/login-redirect-loop` |
| Hotfix | `hotfix/<short-description>` | `hotfix/csrf-token-expiry` |
| Release | `release/<version>` | `release/1.2.0` |

---

## 3. Commit Standards

### GPG signing (mandatory)

Every commit must be GPG-signed. Configure your signing key once:

```bash
git config --global user.signingkey <YOUR_KEY_ID>
git config --global commit.gpgsign true
```

Verify a commit is signed:

```bash
git log --show-signature -1
```

### Conventional Commits

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```text
type(scope): short description

feat(backend): add multi-country VAT calculation
fix(frontend): resolve mobile layout on dashboard
docs(readme): update local setup instructions
chore(infra): update Terraform provider versions
```

| Type | Use case |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, linting (no logic change) |
| `refactor` | Code restructuring (no behavior change) |
| `test` | Adding or modifying tests |
| `chore` | Build, tooling, dependencies |
| `ci` | CI/CD pipeline changes |
| `perf` | Performance improvement |

### Atomic commits

Each commit should represent one logical change. If your feature requires
multiple unrelated changes, split them into separate commits.

---

## 4. Pull Request Process

1. **Rebase** your branch onto the latest `develop` (or `main` for hotfixes):
   ```bash
   git fetch origin
   git rebase origin/develop
   ```

2. **Run all checks locally** before opening a PR:
   ```bash
   # Backend
   cd backend/django && python manage.py test && ruff check . && mypy .

   # Frontend
   cd frontend && pnpm lint && pnpm test && pnpm build
   ```

3. **Open a pull request** with:
   - A clear title following Conventional Commits format
   - A description explaining *what* changed and *why*
   - Links to any related issues or tickets
   - Screenshots or recordings for UI changes
   - Updated documentation if APIs or configuration changed

4. **Address review feedback** promptly. Push new commits rather than
   force-pushing (reviewers need to see what changed).

5. **Squash-merge** when approved. The PR title becomes the commit message.

### PR approval requirements

| Target branch | Minimum approvals | Additional requirements |
|---|---|---|
| `main` | 2 | All CI checks green, no unresolved conversations |
| `develop` | 1 | All CI checks green |
| `hotfix/* → main` | 2 | Post-merge to `develop` required |

---

## 5. Code Quality Standards

### Python (Backend)

- **Linter**: Ruff (`ruff check .`)
- **Formatter**: Ruff format (`ruff format .`)
- **Type checker**: mypy (`mypy .`)
- **Security scanner**: Bandit (`bandit -r .`)
- **Test coverage**: Minimum 80% for new code

### TypeScript/JavaScript (Frontend)

- **Linter**: ESLint with `@typescript-eslint` plugin
- **Formatter**: Prettier
- **Type checker**: `tsc --noEmit`
- **Test framework**: Vitest
- **Build**: Turborepo (`turbo build`)

### Pre-commit hooks

The repository uses `pre-commit` with the following hooks:

| Hook | Purpose |
|---|---|
| `detect-secrets` | Prevents secrets from entering version control |
| `ruff` | Python linting |
| `ruff-format` | Python formatting |
| `mypy` | Static type checking |
| `bandit` | Security vulnerability scanning |

---

## 6. Security Requirements

### Never commit secrets

- Hardcoded passwords, API keys, tokens, or connection strings are **strictly prohibited**.
- Use environment variables via `.env` files (gitignored).
- The `.env.example` file documents required variables with non-functional placeholders.
- If you accidentally commit a secret, notify `security@journeyoflife.org` immediately.

### Dependency management

- Review Dependabot PRs within 5 business days.
- Major version bumps require manual testing before merge.
- Security advisories ( Dependabot alerts) must be addressed within 48 hours.

### Data protection (GDPR)

- Never log PII (names, emails, phone numbers, IP addresses).
- Use field-level encryption for sensitive data.
- Follow the data retention policies defined in `docs/compliance/`.
- All data subject access requests (DSAR) go through `dpo@journeyoflife.org`.

### Security disclosures

See [`SECURITY.md`](.github/SECURITY.md) for the responsible disclosure policy.

---

## 7. Database Migrations

```bash
# Create a migration after model changes
cd backend/django
python manage.py makemigrations --name <descriptive_name>

# Apply migrations locally
python manage.py migrate

# Verify migration is reversible
python manage.py migrate <app> <previous_migration>
```

**Rules:**
- Never edit a migration that has been merged to `main`.
- Always provide a `reverse` function for data migrations.
- Test migrations on a copy of production data before merging.

---

## 8. Frontend Development

### Monorepo structure

The frontend uses Turborepo with pnpm workspaces:

```text
frontend/
├── apps/           # Application entry points
├── packages/       # Shared libraries
├── shared/         # Cross-app utilities
└── turbo.json      # Turborepo configuration
```

### Adding a new package

```bash
cd frontend
pnpm create <package-type> packages/<name>
```

Update `pnpm-workspace.yaml` if the directory is outside the default globs.

---

## 9. Architecture Decision Records (ADR)

For major architectural changes, create an ADR before implementation:

```bash
touch docs/decisions/NNNN-short-title.md
```

Use the template in `docs/decisions/0000-template.md` (if available) or
follow this structure:

```markdown
# ADR-NNNN: Title

## Status
Proposed | Accepted | Deprecated | Superseded

## Context
Why is this decision needed?

## Decision
What did we decide?

## Consequences
What are the positive and negative impacts?
```

---

## 10. Issue Reporting

### Bug reports

Use the GitHub issue template. Include:

- Steps to reproduce
- Expected vs actual behavior
- Environment (browser, OS, device)
- Screenshots or error logs (redact any PII)

### Feature requests

Use the feature request template. Include:

- Problem statement
- Proposed solution
- Alternatives considered
- Impact on existing functionality

---

## 11. Code of Conduct

- Be respectful and professional in all interactions.
- Focus on the code, not the person.
- Provide constructive, actionable feedback.
- Assume good intent.

---

## 12. Questions

| Topic | Contact |
|---|---|
| General questions | [GitHub Discussions](https://github.com/journeyoflife-org/jol-hub/discussions) |
| Security concerns | [security@journeyoflife.org](mailto:security@journeyoflife.org) |
| GDPR / Data protection | [dpo@journeyoflife.org](mailto:dpo@journeyoflife.org) |
| Operational issues | [support.jolhub.org](https://support.jolhub.org) |

---

*This document is maintained as part of the JOL-HUB repository. Propose
changes via pull request following the process described above.*
