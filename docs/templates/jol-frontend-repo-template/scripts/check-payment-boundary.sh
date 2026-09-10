#!/usr/bin/env bash
# Payment boundary guard — INV-3 enforcement.
# Fails CI if any PSP SDK import is detected in the codebase.
# Model A (ADR-009): no payment SDK imports in front-end code.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# Known PSP SDK patterns that must never appear in import/require statements
PATTERNS=(
  'from ["@]stripe'
  'require(["]@stripe'
  'from ["]paypal'
  'require(["]paypal'
  'from ["]@adyen'
  'require(["]@adyen'
  'from ["]square'
  'import.*stripe\.js'
  'import.*paypal.*sdk'
  'import.*adyen.*web'
)

FOUND=0

for pattern in "${PATTERNS[@]}"; do
  # Search only source files, not node_modules or build output
  MATCHES=$(grep -rn --include='*.{ts,tsx,js,jsx}' \
    --exclude-dir=node_modules \
    --exclude-dir=.next \
    --exclude-dir=dist \
    --exclude-dir=.turbo \
    -E "$pattern" \
    src/ 2>/dev/null || true)

  if [ -n "$MATCHES" ]; then
    echo "FAIL: Payment boundary violation detected (INV-3, ADR-009):"
    echo "$MATCHES"
    echo ""
    FOUND=1
  fi
done

if [ "$FOUND" -eq 1 ]; then
  echo ""
  echo "Payment SDK imports are prohibited in spoke repositories (Model A)."
  echo "See ADR-009 and D-052. Payment is handled by the hub backend only."
  exit 1
fi

echo "PASS: no PSP SDK imports detected (INV-3 clean)."
exit 0
