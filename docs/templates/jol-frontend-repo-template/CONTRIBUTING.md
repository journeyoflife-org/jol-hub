# Contributing to JOL __VERTICAL_NAME__

Thank you for your interest in contributing to the Journey of Life platform.

## Code of Conduct

This project adheres to the [Contributor Covenant](https://www.contributor-covenant.org/). By participating, you agree to uphold this code.

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm 10.30.3 (enforced by `packageManager` field)
- Git with GPG signing configured

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm test         # Run tests
pnpm verify       # Full gate battery
```

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/) with a **closed scope list**:

**Allowed types:** `feat`, `fix`, `perf`, `refactor`, `test`, `docs`, `chore`, `security`

**Allowed scopes:** `frontend`, `ui`, `i18n`, `auth`, `commerce`, `seo`, `a11y`, `tenant`, `infra`, `compliance`

**Format:**
```
type(scope): subject

Body (optional)

Refs: MASTER-PROMPT §N
```

**Examples:**
```
feat(frontend): add mass schedule block
fix(i18n): correct Lithuanian locale fallback
security(auth): patch OIDC token validation
```

## Branch Protection

- `main`: 2 approvals required, GPG-signed commits mandatory
- `develop`: 1 approval required
- `feature/*`: no protection, but must pass CI before merge

## Pull Request Process

1. Create a feature branch from `develop`
2. Make your changes with conventional commits
3. Run `pnpm verify` — all gates must pass
4. Submit PR to `develop`
5. Address review comments
6. Squash-merge upon approval

## Security

See [SECURITY.md](./SECURITY.md) for vulnerability reporting.

## License

EUPL-1.2. See [LICENSE](./LICENSE).
