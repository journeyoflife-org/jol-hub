#!/usr/bin/env bash
# =============================================================================
# template-renderer deployment script — STEP 17 (Wave 0).
# =============================================================================
# Release-directory deployment with atomic symlink switch, mandatory
# snapshot gate, health/smoke verification and automatic rollback.
#
# SOC 2 CC8.1 / ISO 27001 A.8.32 change control:
#   - refuses to run without a confirmed VM snapshot (--confirm-snapshot)
#   - builds + tests BEFORE touching the release path
#   - health check (/api/health) + smoke test after switch
#   - on failure: rollback.sh restores the previous release automatically
#
# Usage:
#   ./scripts/deploy.sh --env production --confirm-snapshot
#   ENV_FILE may point at the Vault-rendered environment (never committed).
# =============================================================================
set -euo pipefail

# -----------------------------------------------------------------------------
# Configuration (overridable via environment)
# -----------------------------------------------------------------------------
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_ROOT="${DEPLOY_ROOT:-/opt/jol/apps/template-renderer}"
RELEASES_DIR="${DEPLOY_ROOT}/releases"
CURRENT_LINK="${DEPLOY_ROOT}/current"
KEEP_RELEASES="${KEEP_RELEASES:-5}"
SERVICE_MANAGER="${SERVICE_MANAGER:-pm2}"       # pm2 | docker | systemd
SERVICE_NAME="${SERVICE_NAME:-template-renderer}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:${APP_PORT:-3000}/api/health}"
SMOKE_URL="${SMOKE_URL:-http://127.0.0.1:${APP_PORT:-3000}/lt/parish-st-john-vilnius}"
ENV_NAME="production"
SNAPSHOT_CONFIRMED=0
SKIP_TESTS=0

log()  { printf '\033[1;34m[deploy]\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31m[deploy:FAIL]\033[0m %s\n' "$*" >&2; exit 1; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env) ENV_NAME="$2"; shift 2 ;;
    --confirm-snapshot) SNAPSHOT_CONFIRMED=1; shift ;;
    --skip-tests) SKIP_TESTS=1; shift ;;  # emergency only — must be logged
    *) fail "unknown argument: $1" ;;
  esac
done

# -----------------------------------------------------------------------------
# 0. Gates (RULES)
# -----------------------------------------------------------------------------
if [[ "${SNAPSHOT_CONFIRMED}" -ne 1 ]]; then
  fail "Refusing to deploy: take a VM snapshot first (vzdump/qemu-agent), then pass --confirm-snapshot.
   RULE: ALWAYS snapshot the VM before a production deploy."
fi

if [[ "${ENV_NAME}" == "production" && -n "${STAGING_ONLY:-}" ]]; then
  fail "Staging guard active — production deploys disabled in this window."
fi

log "environment: ${ENV_NAME}; deploy root: ${DEPLOY_ROOT}"

# -----------------------------------------------------------------------------
# 1. Build + test BEFORE touching releases (never deploy untested code)
# -----------------------------------------------------------------------------
cd "${APP_DIR}"

if [[ "${SKIP_TESTS}" -eq 1 ]]; then
  log "WARNING: --skip-tests used — record the justification in the change log."
else
  log "running unit suites…"
  corepack pnpm --filter @jol-hub/template-renderer test
  corepack pnpm --filter @jol-hub/template-renderer test:vitest
  log "running E2E smoke (requires playwright browsers; set E2E_SKIP=1 on hosts without them)…"
  if [[ "${E2E_SKIP:-0}" -eq 1 ]]; then
    log "E2E skipped on this host (documented) — staging gate must have passed."
  else
    corepack pnpm --filter @jol-hub/template-renderer test:e2e
  fi
fi

log "production build (standalone)…"
corepack pnpm --filter @jol-hub/template-renderer build

log "budget + secret gates…"
corepack pnpm --filter @jol-hub/template-renderer check-perf
corepack pnpm --filter @jol-hub/template-renderer check-secrets

# -----------------------------------------------------------------------------
# 2. Stage the release
# -----------------------------------------------------------------------------
TS="$(date -u +%Y%m%d%H%M%S)"
RELEASE_DIR="${RELEASES_DIR}/${TS}"
mkdir -p "${RELEASE_DIR}"

log "staging release ${TS}…"
cp -a "${APP_DIR}/.next/standalone/." "${RELEASE_DIR}/"
# Monorepo standalone nests the app at apps/template-renderer; static assets
# and public/ must sit beside THAT server.js.
STAGE_APP="${RELEASE_DIR}/apps/template-renderer"
mkdir -p "${STAGE_APP}/.next"
cp -a "${APP_DIR}/.next/static" "${STAGE_APP}/.next/static"
if [[ -d "${APP_DIR}/public" ]]; then
  cp -a "${APP_DIR}/public" "${STAGE_APP}/public"
fi

# Environment rendered by Ansible Vault must already be on the host.
if [[ -f "${DEPLOY_ROOT}/env/.env.${ENV_NAME}" ]]; then
  cp "${DEPLOY_ROOT}/env/.env.${ENV_NAME}" "${RELEASE_DIR}/.env"
  log "environment file installed (from host vault render)"
else
  log "no host env file found — assuming the service manager supplies env"
fi

# -----------------------------------------------------------------------------
# 3. Atomic switch + restart
# -----------------------------------------------------------------------------
PREVIOUS=""
if [[ -L "${CURRENT_LINK}" ]]; then
  PREVIOUS="$(readlink -f "${CURRENT_LINK}")"
fi

ln -sfn "${RELEASE_DIR}" "${CURRENT_LINK}.tmp" && mv -Tf "${CURRENT_LINK}.tmp" "${CURRENT_LINK}"
log "current → ${RELEASE_DIR}"

case "${SERVICE_MANAGER}" in
  pm2)      pm2 restart "${SERVICE_NAME}" --update-env ;;
  docker)   docker restart "${SERVICE_NAME}" ;;
  systemd)  systemctl restart "${SERVICE_NAME}" ;;
  *)        fail "unknown SERVICE_MANAGER: ${SERVICE_MANAGER}" ;;
esac

# -----------------------------------------------------------------------------
# 4. Verify: health check + smoke test
# -----------------------------------------------------------------------------
log "health check: ${HEALTH_URL}"
HEALTHY=0
STATUS="000"
for _ in $(seq 1 15); do
  STATUS="$(curl -s -o /tmp/deploy-health.json -w '%{http_code}' "${HEALTH_URL}" || echo 000)"
  if [[ "${STATUS}" == "200" ]]; then HEALTHY=1; break; fi
  sleep 2
done

if [[ "${HEALTHY}" -ne 1 ]]; then
  printf '\033[1;31m[deploy:FAIL]\033[0m health check failed (last status: %s) — rolling back\n' "${STATUS}" >&2
  "${APP_DIR}/scripts/rollback.sh" --to "${PREVIOUS}"
  exit 1
fi
cat /tmp/deploy-health.json; echo

log "smoke test: ${SMOKE_URL}"
SMOKE_BODY="$(curl -s "${SMOKE_URL}" || true)"
if ! echo "${SMOKE_BODY}" | grep -q "<title>"; then
  printf '\033[1;31m[deploy:FAIL]\033[0m smoke test failed: no <title> in home page — rolling back\n' >&2
  "${APP_DIR}/scripts/rollback.sh" --to "${PREVIOUS}"
  exit 1
fi

log "deploy ${TS} verified — monitoring window: watch dashboards for 2 hours (RULE)."

# -----------------------------------------------------------------------------
# 5. Prune old releases (keep N)
# -----------------------------------------------------------------------------
cd "${RELEASES_DIR}"
ls -1d */ 2>/dev/null | sort | head -n -"${KEEP_RELEASES}" | while read -r old; do
  log "pruning old release ${old}"
  rm -rf "${old}"
done

log "DONE — release ${TS} live (previous: ${PREVIOUS:-none})."
