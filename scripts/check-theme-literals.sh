#!/usr/bin/env bash
# =============================================================================
# DS-THEME-01 gate — denomination literals in component trees
# (design-system-spec §1.2; O-022 remediation gave this assertion its
# canonical runnable form).
#
# Assertion: ZERO denomination string literals in component SOURCE
# (*.ts, *.tsx) under:
#   frontend/packages/ui/src/components/
#   frontend/apps/template-renderer/src/components/
#
# SCOPE CLARIFICATION (spec §1.2 note, 2026-08-28): the assertion governs
# COMPONENT code (branching/rendering logic). Vertical controlled-vocabulary
# references in the DATA/resolution layer are legitimate and live elsewhere:
#   - apps/template-renderer/src/lib/ (layout-families.ts, template-registry.ts)
#   - packages/seed-data (Vertical vocabulary itself)
#   - packages/ui/src/tokens/themes/ (profile ids)
# Documentation (*.md) is outside the assertion scope.
#
# FALSIFICATION: exit 1 when any hit; a planted literal MUST fail (verified
# in the O-022 record). Usage: check-theme-literals.sh [ROOT]
#   ROOT defaults to the repo root; point it at a /tmp tree copy to falsify.
# =============================================================================
set -euo pipefail

ROOT="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

# Denomination vocabulary — extend only via DS spec change control.
PATTERN='catholic|orthodox|protestant|lutheran|anglican|baptist|methodist'

SCAN_DIRS=()
[ -d "$ROOT/frontend/packages/ui/src/components" ] && SCAN_DIRS+=("$ROOT/frontend/packages/ui/src/components")
[ -d "$ROOT/frontend/apps/template-renderer/src/components" ] && SCAN_DIRS+=("$ROOT/frontend/apps/template-renderer/src/components")

if [ "${#SCAN_DIRS[@]}" -eq 0 ]; then
  echo "DS-THEME-01: no component trees found under $ROOT" >&2
  exit 2
fi

hits=0
for dir in "${SCAN_DIRS[@]}"; do
  found="$(grep -rniE "$PATTERN" "$dir" \
    --include='*.ts' --include='*.tsx' \
    --exclude-dir=node_modules --exclude-dir=.next 2>/dev/null || true)"
  if [ -n "$found" ]; then
    echo "$found"
    hits=$((hits + $(printf '%s\n' "$found" | wc -l)))
  fi
done

if [ "$hits" -gt 0 ]; then
  echo "DS-THEME-01 FAIL: $hits denomination literal(s) in component source." >&2
  exit 1
fi

echo "DS-THEME-01 OK: zero denomination literals in component source."
