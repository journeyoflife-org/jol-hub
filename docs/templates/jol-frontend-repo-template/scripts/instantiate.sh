#!/usr/bin/env bash
# =============================================================================
# Template Instantiation Script
# =============================================================================
# Creates a new JOL vertical site from this template by replacing
# __VERTICAL__ and __VERTICAL_NAME__ placeholders.
#
# Usage:
#   bash scripts/instantiate.sh <vertical-slug> <vertical-name>
#
# Example:
#   bash scripts/instantiate.sh basilica "Basilica of Vilnius"
#
# This script:
# 1. Replaces all __VERTICAL__ and __VERTICAL_NAME__ placeholders
# 2. Removes itself (one-shot instantiation)
# 3. Initializes a fresh git repository
# =============================================================================
set -euo pipefail

if [ $# -ne 2 ]; then
  echo "Usage: $0 <vertical-slug> <vertical-name>"
  echo ""
  echo "Example: $0 basilica \"Basilica of Vilnius\""
  echo ""
  echo "Arguments:"
  echo "  vertical-slug   Machine name (e.g., basilica, cathedral, parish)"
  echo "  vertical-name   Human-readable name (e.g., \"Basilica of Vilnius\")"
  exit 1
fi

VERTICAL="$1"
VERTICAL_NAME="$2"
REPO_NAME="jol-site-${VERTICAL}"

echo "Instantiating JOL vertical site:"
echo "  Slug:   ${VERTICAL}"
echo "  Name:   ${VERTICAL_NAME}"
echo "  Repo:   ${REPO_NAME}"
echo ""

# Validate slug format
if ! echo "$VERTICAL" | grep -qE '^[a-z][a-z0-9-]*$'; then
  echo "ERROR: vertical-slug must be lowercase alphanumeric with hyphens."
  exit 1
fi

# Find all files to process (exclude binary files, node_modules, .git)
FILES=$(find . -type f \
  -not -path './.git/*' \
  -not -path './node_modules/*' \
  -not -name '*.png' \
  -not -name '*.jpg' \
  -not -name '*.jpeg' \
  -not -name '*.gif' \
  -not -name '*.ico' \
  -not -name '*.woff' \
  -not -name '*.woff2' \
  -not -name '*.ttf' \
  -not -name '*.eot' \
  -not -name 'instantiate.sh' \
  -not -name 'TEMPLATE-README.md' \
  2>/dev/null)

COUNT=0
for file in $FILES; do
  # Check if file contains placeholders (skip binary)
  if grep -ql '__VERTICAL__\|__VERTICAL_NAME__' "$file" 2>/dev/null; then
    # Use sed for replacement (macOS and Linux compatible)
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s/__VERTICAL__/${VERTICAL}/g" "$file"
      sed -i '' "s/__VERTICAL_NAME__/${VERTICAL_NAME}/g" "$file"
    else
      sed -i "s/__VERTICAL__/${VERTICAL}/g" "$file"
      sed -i "s/__VERTICAL_NAME__/${VERTICAL_NAME}/g" "$file"
    fi
    COUNT=$((COUNT + 1))
    echo "  Updated: ${file}"
  fi
done

echo ""
echo "Updated ${COUNT} files with vertical placeholders."

# Update package name
if [ -f "package.json" ]; then
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/jol-site-__VERTICAL__/${REPO_NAME}/g" package.json
  else
    sed -i "s/jol-site-__VERTICAL__/${REPO_NAME}/g" package.json
  fi
  echo "  Updated package name to: ${REPO_NAME}"
fi

# Remove the instantiation script (one-shot)
rm -f scripts/instantiate.sh
rm -f TEMPLATE-README.md
echo ""
echo "Removed instantiation scripts (one-shot)."

# Initialize fresh git repository
echo ""
echo "Initializing git repository..."
rm -rf .git
git init
git add -A
git commit -m "feat: initial scaffold from jol-frontend-repo-template

Vertical: ${VERTICAL}
Name: ${VERTICAL_NAME}
Repository: ${REPO_NAME}

Generated from jol-frontend-repo-template.
Satellite kit embedded byte-identical to jol-hub@main."

echo ""
echo "============================================"
echo "Instantiation complete!"
echo ""
echo "Next steps:"
echo "  1. pnpm install"
echo "  2. cp .env.example .env.local  # fill in secrets"
echo "  3. pnpm dev"
echo "  4. Implement vertical-specific pages"
echo "  5. pnpm verify  # full gate battery"
echo "============================================"
