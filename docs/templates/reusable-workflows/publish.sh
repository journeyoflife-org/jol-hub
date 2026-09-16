#!/usr/bin/env bash
# =============================================================================
# Publish Reusable Workflows to org .github repo
# =============================================================================
# Copies the staged reusable workflows from jol-hub to the
# journeyoflife-org/.github repository.
#
# Prerequisites:
#   - journeyoflife-org/.github cloned at /opt/jol/repos/.github
#   - SSH access to the repo
#   - GPG signing configured
#
# Usage:
#   bash docs/templates/reusable-workflows/publish.sh
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HUB_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
ORG_REPO="/opt/jol/repos/.github"
WORKFLOW_DIR=".github/workflows"

WORKFLOWS=(
  "frontend-build.yml"
  "frontend-test.yml"
  "security-scan.yml"
  "payment-boundary-guard.yml"
  "compliance-check.yml"
)

echo "Publish reusable workflows to org .github"
echo "=========================================="
echo ""

# Check org repo exists
if [ ! -d "$ORG_REPO/.git" ]; then
  echo "ERROR: org .github repo not found at $ORG_REPO"
  echo ""
  echo "Clone it first:"
  echo "  git clone git@github.com:journeyoflife-org/.github.git $ORG_REPO"
  exit 1
fi

# Create workflow directory if needed
mkdir -p "$ORG_REPO/$WORKFLOW_DIR"

# Copy workflows
COPIED=0
for wf in "${WORKFLOWS[@]}"; do
  SRC="$SCRIPT_DIR/$wf"
  DST="$ORG_REPO/$WORKFLOW_DIR/$wf"

  if [ ! -f "$SRC" ]; then
    echo "  SKIP: $wf (source not found)"
    continue
  fi

  cp "$SRC" "$DST"
  echo "  COPY: $wf → $WORKFLOW_DIR/$wf"
  COPIED=$((COPIED + 1))
done

echo ""
echo "Copied $COPIED workflows."
echo ""

# Show diff
cd "$ORG_REPO"
CHANGES=$(git status --short)
if [ -z "$CHANGES" ]; then
  echo "No changes to commit (workflows are up to date)."
  exit 0
fi

echo "Changes in org .github repo:"
echo "$CHANGES"
echo ""

# Commit
git add -A
git commit -S -m "feat(workflows): update reusable CI workflows from jol-hub

Synced $COPIED reusable workflows from jol-hub@$(git -C "$HUB_ROOT" rev-parse --short HEAD):
$(for wf in "${WORKFLOWS[@]}"; do echo "  - $wf"; done)

These workflows are called by all 10 spoke repositories via workflow_call.
INV-6: spokes cannot silently skip a gate.

Refs: ADR-011 · INV-6 · Task 2.7"

echo ""
echo "Committed. Push when ready:"
echo "  cd $ORG_REPO && git push origin main"
