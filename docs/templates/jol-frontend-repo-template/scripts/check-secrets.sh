#!/usr/bin/env bash
# Secret detection guard.
# Fails CI if potential secrets are found in source code.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# Patterns that indicate potential secrets
PATTERNS=(
  # API keys and tokens
  'API_KEY\s*=\s*["\x27][^"\x27]+'
  'SECRET_KEY\s*=\s*["\x27][^"\x27]+'
  'PRIVATE_KEY\s*=\s*["\x27][^"\x27]+'
  'ACCESS_TOKEN\s*=\s*["\x27][^"\x27]+'
  # AWS credentials
  'AKIA[0-9A-Z]\{16\}'
  # Generic high-entropy strings (base64-like, 40+ chars)
  'password\s*=\s*["\x27][^"\x27]\{20,\}'
  # Private key blocks
  '-----BEGIN.*PRIVATE KEY-----'
  # Database connection strings with credentials
  'postgresql://[^:]+:[^@]+@'
  'mysql://[^:]+:[^@]+@'
)

FOUND=0

for pattern in "${PATTERNS[@]}"; do
  MATCHES=$(grep -rn --include='*.{ts,tsx,js,jsx,json,yaml,yml}' \
    --exclude-dir=node_modules \
    --exclude-dir=.next \
    --exclude-dir=dist \
    --exclude-dir=.turbo \
    --exclude-dir=secrets \
    --exclude='.env.example' \
    -E "$pattern" \
    src/ 2>/dev/null || true)

  if [ -n "$MATCHES" ]; then
    echo "FAIL: Potential secret detected in source code:"
    echo "$MATCHES"
    echo ""
    FOUND=1
  fi
done

# Also check for unencrypted secret files
if find secrets/encrypted -name '*.yaml' ! -name '.gitkeep' 2>/dev/null | grep -q .; then
  UNENCRYPTED=$(find secrets/encrypted -name '*.yaml' ! -name '.gitkeep' -exec sh -c '
    if ! head -1 "$1" | grep -q "^\[ANSIBLE_VAULT\|^\s*sops:"; then
      echo "$1"
    fi
  ' _ {} \;)

  if [ -n "$UNENCRYPTED" ]; then
    echo "FAIL: Unencrypted YAML found in secrets/encrypted/:"
    echo "$UNENCRYPTED"
    echo ""
    FOUND=1
  fi
fi

if [ "$FOUND" -eq 1 ]; then
  echo ""
  echo "Secrets must never be committed in plaintext."
  echo "Use SOPS/age encryption for all secrets at rest."
  echo "See secrets/README.md for the workflow."
  exit 1
fi

echo "PASS: no plaintext secrets detected."
exit 0
