"""Dependency guard — Model A (ADR-0005) E2 enforcement.

jol-hub must NEVER depend on the Stripe SDK: the marketplace payment
boundary is the sole Stripe integrator, and hub consumes it through the
internal payment API only. This test is the CI twin of the manifest scan
in scripts/check-payment-boundary.sh (record copy: jol-m-infrastructure).

It fails if:
  1. a `stripe` distribution is installed in the active environment, or
  2. any requirements manifest declares the `stripe` package.

Adding the SDK back requires an ADR amending ADR-0005 — not a PR.
"""

import re
from pathlib import Path

import pytest

try:
    from importlib.metadata import distributions
except ImportError:  # pragma: no cover — py<3.8 fallback not needed
    distributions = None

PROJECT_ROOT = Path(__file__).parent.parent.parent
MANIFESTS = [
    PROJECT_ROOT / "backend" / "requirements.txt",
    PROJECT_ROOT / "backend" / "django" / "requirements.txt",
]
# A declared dependency line: "stripe", "stripe==x", "stripe>=x", quoted
# names in toml/cfg lists. Browser-side @stripe/stripe-js is frontend
# scope (SAQ-A Elements include) and intentionally NOT matched here.
DEP_LINE = re.compile(r'^\s*"?stripe"?\s*([=<>!~\[ ]|$)', re.IGNORECASE)


def test_stripe_distribution_not_installed():
    """The SDK must not be importable from the hub runtime environment."""
    installed = {
        (d.metadata["Name"] or "").lower()
        for d in (distributions() or [])
    }
    assert "stripe" not in installed, (
        "Model A violation (ADR-0005): the 'stripe' distribution is "
        "installed in hub's environment. Remove it; the payment boundary "
        "is the sole Stripe integrator."
    )


def test_stripe_not_declared_in_manifests():
    """No requirements manifest may declare the stripe package."""
    offenders = []
    for manifest in MANIFESTS:
        if not manifest.exists():
            continue
        for lineno, line in enumerate(manifest.read_text().splitlines(), 1):
            if DEP_LINE.match(line):
                offenders.append(f"{manifest}:{lineno}: {line.strip()}")
    assert not offenders, (
        "Model A violation (ADR-0005): stripe declared in manifests: "
        + "; ".join(offenders)
    )


def test_stripe_import_raises():
    """Direct import must fail — belt and braces over the metadata check."""
    with pytest.raises(ImportError):
        import stripe  # noqa: F401
