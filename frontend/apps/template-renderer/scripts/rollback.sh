#!/usr/bin/env bash
# =============================================================================
# template-renderer rollback — STEP 17 (Wave 0).
# =============================================================================
# Restores the previous release via the `current` symlink, restarts the
# service, verifies /api/health and fires the incident alert hook.
#
# Usage:
#   ./scripts/rollback.sh                 # newest release before `current`
#   ./scripts/rollback.sh --to <release>  # explicit release directory
#
# RULE: a rollback is an INCIDENT — the alert hook always fires.
# =============================================================================
set -euo pipefail

DEPLOY_ROOT="${DEPLOY_ROOT:-/opt/jol/apps/template-renderer}"
RELEASES_DIR="${DEPLOY_ROOT}/releases"
CURRENT_LINK="${DEPLOY_ROOT}/current"
SERVICE_MANAGER="${SERVICE_MANAGER:-pm2}"
SERVICE_NAME="${SERVICE_NAME:-template-renderer}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:${APP_PORT:-3000}/api/health}"
ALERT_WEBHOOK_URL="${ALERT_WEBHOOK_URL:-}"   # Slack/Discord/Mattermost webhook

log()  { printf '\033[1;33m[rollback]\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31m[rollback:FAIL]\033[0m %s\n' "$*" >&2; exit 1; }

TARGET=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --to) TARGET="$2"; shift 2 ;;
    *) fail "unknown argument: $1" ;;
  esac
done

[[ -d "${RELEASES_DIR}" ]] || fail "no releases directory at ${RELEASES_DIR}"

CURRENT_RESOLVED=""
if [[ -L "${CURRENT_LINK}" ]]; then
  CURRENT_RESOLVED="$(readlink -f "${CURRENT_LINK}")"
fi

if [[ -z "${TARGET}" ]]; then
  # Newest release strictly older than the current one.
  TARGET="$(ls -1d "${RELEASES_DIR}"/*/ 2>/dev/null | sort \
    | grep -v "^${CURRENT_RESOLVED}/\$" | tail -n 1)"
fi
TARGET="${TARGET%/}"
[[ -d "${TARGET}" ]] || fail "rollback target not found: ${TARGET:-<none>}"
[[ "${TARGET}" != "${CURRENT_RESOLVED}" ]] || fail "target equals the current release — nothing to roll back"

log "rolling back: ${CURRENT_RESOLVED:-<none>} → ${TARGET}"

ln -sfn "${TARGET}" "${CURRENT_LINK}.tmp" && mv -Tf "${CURRENT_LINK}.tmp" "${CURRENT_LINK}"

case "${SERVICE_MANAGER}" in
  pm2)      pm2 restart "${SERVICE_NAME}" --update-env ;;
  docker)   docker restart "${SERVICE_NAME}" ;;
  systemd)  systemctl restart "${SERVICE_NAME}" ;;
  *)        fail "unknown SERVICE_MANAGER: ${SERVICE_MANAGER}" ;;
esac

log "verifying ${HEALTH_URL}…"
HEALTHY=0
for _ in $(seq 1 15); do
  STATUS="$(curl -s -o /dev/null -w '%{http_code}' "${HEALTH_URL}" || echo 000)"
  if [[ "${STATUS}" == "200" ]]; then HEALTHY=1; break; fi
  sleep 2
done

# RULE: ALWAYS alert on rollback (incident channel + runbook link).
ALERT_MSG="🔁 JOL template-renderer ROLLBACK executed. target=${TARGET} healthy=${HEALTHY}. Runbook: jol-infrastructure/runbooks/frontend-rollback.md"
if [[ -n "${ALERT_WEBHOOK_URL}" ]]; then
  curl -s -o /dev/null -X POST -H 'Content-Type: application/json' \
    -d "{\"text\": \"${ALERT_MSG}\"}" "${ALERT_WEBHOOK_URL}" || true
fi
log "${ALERT_MSG}"

if [[ "${HEALTHY}" -ne 1 ]]; then
  fail "rollback completed but health check FAILED — restore the VM snapshot NOW (escalate to ops)."
fi

log "rollback verified — release ${TARGET} is live."
