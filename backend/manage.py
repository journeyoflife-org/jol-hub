#!/usr/bin/env python
"""Convenience wrapper for host-side use.

The real Django project root is backend/django/ (that is also the Docker
image WORKDIR). This wrapper re-executes the inner manage.py from that
directory so import roots ('core', 'apps') and env-file discovery match
the container exactly.

IMPORTANT: never put THIS directory on sys.path — the local 'django/'
folder would shadow the Django framework package.
"""
import os
import sys
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent / "django"

os.chdir(PROJECT_DIR)
sys.argv[0] = str(PROJECT_DIR / "manage.py")
sys.path[0] = str(PROJECT_DIR)  # replace the wrapper dir with the project root

script = PROJECT_DIR / "manage.py"
with open(script, "rb") as fh:
    code = compile(fh.read(), str(script), "exec")

globals_ = {"__name__": "__main__", "__file__": str(script)}
exec(code, globals_)
