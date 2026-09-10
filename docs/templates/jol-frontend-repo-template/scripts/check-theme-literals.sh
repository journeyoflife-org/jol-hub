#!/usr/bin/env bash
# Theme literal guard — INV-7 enforcement.
# Fails CI if denomination or country literals are found in component code.
# Spokes must consume themes from @jol-hub/ui tokens, not define their own.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# Patterns that indicate theme/vertical logic is being defined locally
# instead of being consumed from @jol-hub/* platform packages
PATTERNS=(
  # Denomination literals in component code
  'catholic'
  'orthodox'
  'protestant'
  'greek.catholic'
  'lutheran'
  'methodist'
  'baptist'
  # Country literals used as branching logic (not in data/fixture files)
  "country === 'lt'"
  'country === "lt"'
  "country === 'lv'"
  'country === "lv"'
  "country === 'ee'"
  'country === "ee"'
  # Hardcoded accent/theme colors (must use design tokens)
  '#[0-9a-fA-F]\{6\}'
)

# Only check component and page source files
FOUND=0

for pattern in "${PATTERNS[@]}"; do
  MATCHES=$(grep -rn --include='*.{ts,tsx}' \
    --exclude-dir=node_modules \
    --exclude-dir=.next \
    --exclude-dir=dist \
    --exclude-dir=fixtures \
    --exclude-dir=data \
    -i -E "$pattern" \
    src/components/ src/app/ 2>/dev/null || true)

  if [ -n "$MATCHES" ]; then
    echo "WARN: Possible theme/vertical literal in component code (INV-7):"
    echo "$MATCHES"
    echo ""
    FOUND=1
  fi
done

if [ "$FOUND" -eq 1 ]; then
  echo ""
  echo "Denomination and country literals in component code suggest"
  echo "vertical-specific logic that should be consumed from @jol-hub/* packages."
  echo "See INV-7: spokes must not define their own theme logic."
  exit 1
fi

echo "PASS: no theme/vertical literals in component code (INV-7 clean)."
exit 0
