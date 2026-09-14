#!/usr/bin/env bash
# =============================================================================
# Spoke Workflow Meta-Check (INV-6)
# =============================================================================
# Verifies that a spoke repository's .github/workflows/ci.yml calls ALL
# required org reusable workflows. A spoke cannot silently skip a gate.
#
# Required workflow calls:
#   1. frontend-build.yml
#   2. frontend-test.yml
#   3. security-scan.yml
#   4. payment-boundary-guard.yml
#   5. compliance-check.yml
#
# Usage:
#   bash scripts/check-workflow-completeness.sh [path-to-ci.yml]
#
# Exit codes:
#   0 — all required workflows present
#   1 — one or more required workflows missing
# =============================================================================
set -euo pipefail

CI_FILE="${1:-.github/workflows/ci.yml}"

if [ ! -f "$CI_FILE" ]; then
  echo "FAIL: CI workflow file not found at $CI_FILE"
  exit 1
fi

REQUIRED_WORKFLOWS=(
  "frontend-build.yml"
  "frontend-test.yml"
  "security-scan.yml"
  "payment-boundary-guard.yml"
  "compliance-check.yml"
)

MISSING=0

echo "Workflow completeness check: $CI_FILE"
echo ""

for wf in "${REQUIRED_WORKFLOWS[@]}"; do
  if grep -q "$wf" "$CI_FILE"; then
    echo "  OK:   $wf"
  else
    echo "  MISS: $wf (REQUIRED)"
    MISSING=$((MISSING + 1))
  fi
done

echo ""

if [ "$MISSING" -gt 0 ]; then
  echo "FAIL: $MISSING required workflow(s) missing from $CI_FILE"
  echo ""
  echo "All spokes must call these org reusable workflows (INV-6)."
  echo "A spoke cannot silently skip a gate."
  exit 1
fi

echo "PASS: all required workflows present (INV-6 clean)."
exit 0
