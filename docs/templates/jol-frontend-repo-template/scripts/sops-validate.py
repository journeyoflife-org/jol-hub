#!/usr/bin/env python3
"""
Satellite kit drift checker.

Validates that governance-critical files in this spoke repository
match the canonical versions in jol-hub@main. Any mismatch fails
the CI pipeline, preventing silent drift from platform standards.

Usage:
    python3 scripts/sops-validate.py [--hub-repo journeyoflife-org/jol-hub] [--branch main]

Exit codes:
    0 — all files match
    1 — one or more files drifted
    2 — network/tooling error
"""

from __future__ import annotations

import argparse
import hashlib
import sys
from pathlib import Path

# Files that must remain byte-identical to jol-hub@main
# Local paths (in spoke repo) -> remote paths (in jol-hub)
GOVERNANCE_FILES = {
    ".sops.yaml": "docs/templates/jol-frontend-repo-template/.sops.yaml",
    "scripts/sops-validate.py": "docs/templates/jol-frontend-repo-template/scripts/sops-validate.py",
    "secrets/README.md": "docs/templates/jol-frontend-repo-template/secrets/README.md",
}

# Base URL for GitHub API (no CDN caching issues)
API_BASE = "https://api.github.com"


def sha256_file(path: Path) -> str:
    """Compute SHA-256 hex digest of a local file."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def sha256_remote(repo: str, branch: str, rel_path: str) -> str | None:
    """Fetch remote file via GitHub API and compute its SHA-256. Returns None on failure."""
    import base64
    import json
    import urllib.request
    import urllib.error

    url = f"{API_BASE}/repos/{repo}/contents/{rel_path}?ref={branch}"
    try:
        req = urllib.request.Request(url, headers={"Accept": "application/vnd.github.v3+json"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            payload = json.loads(resp.read())
        data = base64.b64decode(payload["content"])
        return hashlib.sha256(data).hexdigest()
    except (urllib.error.URLError, OSError, KeyError, json.JSONDecodeError) as exc:
        print(f"  WARN: could not fetch {url}: {exc}", file=sys.stderr)
        return None


def main() -> int:
    parser = argparse.ArgumentParser(description="Satellite kit drift check")
    parser.add_argument(
        "--hub-repo",
        default="journeyoflife-org/jol-hub",
        help="GitHub org/repo for the canonical hub (default: %(default)s)",
    )
    parser.add_argument(
        "--branch",
        default="main",
        help="Branch to compare against (default: %(default)s)",
    )
    parser.add_argument(
        "--repo-root",
        default=".",
        help="Local repository root (default: %(default)s)",
    )
    args = parser.parse_args()

    repo_root = Path(args.repo_root).resolve()
    drift_detected = False

    print(f"Satellite kit drift check against {args.hub_repo}@{args.branch}")
    print(f"Repository root: {repo_root}")
    print()

    for local_rel, remote_rel in GOVERNANCE_FILES.items():
        local_file = repo_root / local_rel
        if not local_file.exists():
            print(f"  MISSING: {local_rel} (file does not exist locally)")
            drift_detected = True
            continue

        local_hash = sha256_file(local_file)
        remote_hash = sha256_remote(args.hub_repo, args.branch, remote_rel)

        if remote_hash is None:
            print(f"  SKIP:    {local_rel} (could not fetch remote)")
            continue

        if local_hash == remote_hash:
            print(f"  OK:      {local_rel}")
        else:
            print(f"  DRIFT:   {local_rel}")
            print(f"           local:  {local_hash[:16]}…")
            print(f"           remote: {remote_hash[:16]}…")
            drift_detected = True

    print()
    if drift_detected:
        print("FAIL: satellite kit drift detected.")
        print("Run: sync the listed files from jol-hub@main.")
        return 1
    else:
        print("PASS: satellite kit is byte-identical to hub.")
        return 0


if __name__ == "__main__":
    sys.exit(main())
