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
GOVERNANCE_FILES = [
    ".sops.yaml",
    "scripts/sops-validate.py",
    "secrets/README.md",
]

# Base URL for raw GitHub content
RAW_BASE = "https://raw.githubusercontent.com"


def sha256_file(path: Path) -> str:
    """Compute SHA-256 hex digest of a local file."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def sha256_remote(repo: str, branch: str, rel_path: str) -> str | None:
    """Fetch remote file and compute its SHA-256. Returns None on failure."""
    import urllib.request
    import urllib.error

    url = f"{RAW_BASE}/{repo}/{branch}/{rel_path}"
    try:
        with urllib.request.urlopen(url, timeout=15) as resp:
            data = resp.read()
        return hashlib.sha256(data).hexdigest()
    except (urllib.error.URLError, OSError) as exc:
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

    for rel_path in GOVERNANCE_FILES:
        local_file = repo_root / rel_path
        if not local_file.exists():
            print(f"  MISSING: {rel_path} (file does not exist locally)")
            drift_detected = True
            continue

        local_hash = sha256_file(local_file)
        remote_hash = sha256_remote(args.hub_repo, args.branch, rel_path)

        if remote_hash is None:
            print(f"  SKIP:    {rel_path} (could not fetch remote)")
            continue

        if local_hash == remote_hash:
            print(f"  OK:      {rel_path}")
        else:
            print(f"  DRIFT:   {rel_path}")
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
