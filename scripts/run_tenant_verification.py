#!/usr/bin/env python3
"""
JOL-HUB Multi-Tenant Isolation Verification Runner

Verifies tenant isolation across all layers:
- Database-level isolation
- API-level isolation  
- Thread-local context isolation
- Cache isolation
- Cross-tenant access prevention

SOC2 CC6.2 / GDPR Article 32 / ISO 27001 A.9.4

Usage:
    python scripts/run_tenant_verification.py
    python scripts/run_tenant_verification.py --organization-id <uuid>
    python scripts/run_tenant_verification.py --output json
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend" / "django"))

from apps.crm.tenant_verification import (
    TenantIsolationVerifier,
    VerificationStatus,
    verify_tenant_isolation,
    run_isolation_audit,
)


def run_verification(
    organization_id: Optional[str] = None,
    output_format: str = "text",
) -> int:
    """Run tenant isolation verification."""
    
    print("\n" + "=" * 60)
    print("JOL-HUB Multi-Tenant Isolation Verification")
    print("SOC2 CC6.2 / GDPR Article 32 / ISO 27001 A.9.4")
    print("=" * 60 + "\n")
    
    # Run verification
    verifier = TenantIsolationVerifier(organization_id)
    results = verifier.verify_all()
    
    # Count by status
    status_counts = {}
    for result in results:
        status = result.status.value
        status_counts[status] = status_counts.get(status, 0) + 1
    
    # Calculate score (exclude not_applicable from total)
    passed = status_counts.get("pass", 0)
    not_applicable = status_counts.get("not_applicable", 0)
    total = len(results) - not_applicable  # Exclude N/A from scoring
    score = (passed / total * 100) if total > 0 else 0
    
    # Output results
    if output_format == "json":
        output = {
            "timestamp": datetime.utcnow().isoformat(),
            "organization_id": organization_id,
            "total_checks": total,
            "score": round(score, 2),
            "status_counts": status_counts,
            "results": [r.to_dict() for r in results],
        }
        print(json.dumps(output, indent=2))
    else:
        # Text output
        print(f"Total Checks: {total}")
        print(f"Score: {score:.1f}%\n")
        
        # Print status counts
        print("Status Summary:")
        for status, count in sorted(status_counts.items()):
            emoji = {
                "pass": "✅",
                "fail": "❌",
                "warning": "⚠️",
                "error": "🔴",
                "not_applicable": "⏭️",
            }.get(status, "❓")
            print(f"  {emoji} {status}: {count}")
        
        # Print detailed results
        print("\n" + "-" * 60)
        print("Detailed Results:")
        print("-" * 60)
        
        for result in results:
            emoji = {
                VerificationStatus.PASS: "✅",
                VerificationStatus.FAIL: "❌",
                VerificationStatus.WARNING: "⚠️",
                VerificationStatus.ERROR: "🔴",
                VerificationStatus.NOT_APPLICABLE: "⏭️",
            }.get(result.status, "❓")
            
            print(f"\n{emoji} [{result.check_id}] {result.check_name}")
            print(f"   Status: {result.status.value}")
            print(f"   Message: {result.message}")
            
            if result.remediation:
                print(f"   Remediation: {result.remediation}")
    
    # Overall assessment
    print("\n" + "=" * 60)
    if score >= 90:
        print("✅ OVERALL: PASS - Tenant isolation is properly implemented")
        exit_code = 0
    elif score >= 70:
        print("⚠️  OVERALL: WARNING - Tenant isolation needs attention")
        exit_code = 1
    else:
        print("❌ OVERALL: FAIL - Tenant isolation requires immediate fixes")
        exit_code = 2
    
    print("=" * 60 + "\n")
    
    return exit_code


def main():
    parser = argparse.ArgumentParser(
        description="JOL-HUB Multi-Tenant Isolation Verification",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Run full verification
    python scripts/run_tenant_verification.py
    
    # Run for specific organization
    python scripts/run_tenant_verification.py --organization-id <uuid>
    
    # Output as JSON
    python scripts/run_tenant_verification.py --output json
        """,
    )
    
    parser.add_argument(
        "--organization-id",
        help="Run verification for specific organization",
    )
    
    parser.add_argument(
        "--output",
        choices=["text", "json"],
        default="text",
        help="Output format (default: text)",
    )
    
    args = parser.parse_args()
    
    # Configure Django
    import os
    import django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
    
    try:
        django.setup()
    except Exception as e:
        print(f"Warning: Could not configure Django: {e}")
        print("Running in standalone mode (limited functionality)\n")
    
    exit_code = run_verification(
        organization_id=args.organization_id,
        output_format=args.output,
    )
    
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
