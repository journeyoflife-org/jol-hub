#!/usr/bin/env python3
"""
JOL-HUB Compliance Test Runner

Runs automated GDPR, SOC2, and PCI-DSS compliance tests.
Generates compliance reports for entities.

Usage:
    python scripts/run_compliance_tests.py --country lt --all
    python scripts/run_compliance_tests.py --country lv --entity-type cathedral
    python scripts/run_compliance_tests.py --standard gdpr --output json
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Optional

# Add data module to path
sys.path.insert(0, str(Path(__file__).parent.parent / "data"))

from tests.test_compliance import (
    ComplianceReportGenerator,
    ComplianceReport,
    ComplianceLevel,
    TestGDPRCompliance,
    TestSOC2Compliance,
    TestPCIDSSCompliance,
    TestAuditLogIntegrity,
)


class ComplianceTestRunner:
    """Run compliance tests for JOL-HUB entities."""
    
    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.results = {
            "gdpr": [],
            "soc2": [],
            "pci_dss": [],
            "audit_integrity": [],
        }
    
    def run_all_tests(
        self,
        country: str = "lt",
        entity_types: Optional[List[str]] = None,
        output_format: str = "text",
    ) -> dict:
        """Run all compliance tests."""
        print(f"\n{'=' * 60}")
        print("JOL-HUB Compliance Test Suite")
        print(f"Country: {country.upper()}")
        print(f"{'=' * 60}\n")
        
        # Run test classes
        gdpr_results = self._run_test_class(TestGDPRCompliance)
        soc2_results = self._run_test_class(TestSOC2Compliance)
        pci_results = self._run_test_class(TestPCIDSSCompliance)
        audit_results = self._run_test_class(TestAuditLogIntegrity)
        
        # Compile results
        summary = {
            "timestamp": datetime.utcnow().isoformat(),
            "country": country,
            "gdpr": gdpr_results,
            "soc2": soc2_results,
            "pci_dss": pci_results,
            "audit_integrity": audit_results,
            "overall": self._calculate_overall(gdpr_results, soc2_results, pci_results, audit_results),
        }
        
        # Output results
        if output_format == "json":
            print(json.dumps(summary, indent=2))
        else:
            self._print_summary(summary)
        
        return summary
    
    def _run_test_class(self, test_class) -> dict:
        """Run a test class and return results."""
        import pytest
    
        # Run tests programmatically
        test_file = Path(__file__).parent.parent / "data" / "tests" / "test_compliance.py"
    
        # Collect results
        results = {
            "passed": 0,
            "failed": 0,
            "skipped": 0,
            "tests": [],
        }
    
        try:
            # Import and instantiate test class
            test_instance = test_class()
            test_instance.project_root = self.project_root
    
            # Run each test method
            for method_name in dir(test_instance):
                if method_name.startswith("test_"):
                    try:
                        method = getattr(test_instance, method_name)
                        # Check if method requires fixtures
                        import inspect
                        sig = inspect.signature(method)
                        params = list(sig.parameters.keys())
                            
                        # Prepare args based on parameter names
                        args = {}
                        if 'project_root' in params:
                            args['project_root'] = self.project_root
                        if 'compliance_config' in params:
                            args['compliance_config'] = {}
                            
                        method(**args)
                        results["passed"] += 1
                        results["tests"].append({
                            "name": method_name,
                            "status": "passed",
                        })
                    except AssertionError as e:
                        results["failed"] += 1
                        results["tests"].append({
                            "name": method_name,
                            "status": "failed",
                            "error": str(e),
                        })
                    except Exception as e:
                        results["skipped"] += 1
                        results["tests"].append({
                            "name": method_name,
                            "status": "skipped",
                            "error": str(e),
                        })
        except Exception as e:
            results["error"] = str(e)
    
        return results
    
    def _calculate_overall(self, *results) -> dict:
        """Calculate overall compliance score."""
        total_passed = sum(r.get("passed", 0) for r in results)
        total_failed = sum(r.get("failed", 0) for r in results)
        total_tests = total_passed + total_failed
            
        if total_tests == 0:
            return {"score": 0, "status": "no_tests", "passed": 0, "failed": 0}
    
        score = (total_passed / total_tests) * 100
    
        if score >= 90:
            status = "compliant"
        elif score >= 70:
            status = "partial"
        else:
            status = "non_compliant"
    
        return {
            "score": round(score, 2),
            "status": status,
            "passed": total_passed,
            "failed": total_failed,
        }
    
    def _print_summary(self, summary: dict):
        """Print text summary of results."""
        print("\n" + "=" * 60)
        print("COMPLIANCE TEST RESULTS")
        print("=" * 60)
        
        # GDPR Results
        print(f"\n📋 GDPR COMPLIANCE")
        print(f"   Passed: {summary['gdpr']['passed']}")
        print(f"   Failed: {summary['gdpr']['failed']}")
        
        # SOC2 Results
        print(f"\n🔒 SOC2 TYPE II")
        print(f"   Passed: {summary['soc2']['passed']}")
        print(f"   Failed: {summary['soc2']['failed']}")
        
        # PCI-DSS Results
        print(f"\n💳 PCI-DSS")
        print(f"   Passed: {summary['pci_dss']['passed']}")
        print(f"   Failed: {summary['pci_dss']['failed']}")
        
        # Audit Integrity Results
        print(f"\n🔐 AUDIT LOG INTEGRITY")
        print(f"   Passed: {summary['audit_integrity']['passed']}")
        print(f"   Failed: {summary['audit_integrity']['failed']}")
        
        # Overall
        print(f"\n{'=' * 60}")
        print("OVERALL COMPLIANCE SCORE")
        print("=" * 60)
        print(f"   Score: {summary['overall']['score']}%")
        print(f"   Status: {summary['overall']['status'].upper()}")
        print(f"   Tests: {summary['overall']['passed']} passed, {summary['overall']['failed']} failed")
        print(f"\n   Generated: {summary['timestamp']}")
        print("=" * 60)
    
    def generate_entity_report(
        self,
        entity_type: str,
        entity_id: str,
        country: str,
    ) -> ComplianceReport:
        """Generate compliance report for a specific entity."""
        generator = ComplianceReportGenerator(self.project_root)
        return generator.check_all(entity_type, entity_id, country)


def main():
    parser = argparse.ArgumentParser(
        description="JOL-HUB Compliance Test Runner",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Run all compliance tests for Lithuania
    python scripts/run_compliance_tests.py --country lt --all
    
    # Run only GDPR tests
    python scripts/run_compliance_tests.py --standard gdpr
    
    # Generate entity-specific report
    python scripts/run_compliance_tests.py --entity-type cathedral --entity-id lt-cathedral-kaunas
    
    # Output as JSON
    python scripts/run_compliance_tests.py --all --output json
        """,
    )
    
    parser.add_argument(
        "--country",
        choices=["lt", "lv", "ee"],
        default="lt",
        help="Country code (default: lt)",
    )
    
    parser.add_argument(
        "--all",
        action="store_true",
        help="Run all compliance tests",
    )
    
    parser.add_argument(
        "--standard",
        choices=["gdpr", "soc2", "pci_dss"],
        help="Run tests for specific compliance standard",
    )
    
    parser.add_argument(
        "--entity-type",
        help="Entity type for specific report",
    )
    
    parser.add_argument(
        "--entity-id",
        help="Entity ID for specific report",
    )
    
    parser.add_argument(
        "--output",
        choices=["text", "json"],
        default="text",
        help="Output format (default: text)",
    )
    
    args = parser.parse_args()
    
    # Determine project root
    project_root = Path(__file__).parent.parent
    
    # Create runner
    runner = ComplianceTestRunner(project_root)
    
    # Run tests
    if args.all or args.standard:
        results = runner.run_all_tests(
            country=args.country,
            output_format=args.output,
        )
        
        # Exit with error if any tests failed
        if results["overall"]["failed"] > 0:
            sys.exit(1)
        
    elif args.entity_type and args.entity_id:
        report = runner.generate_entity_report(
            entity_type=args.entity_type,
            entity_id=args.entity_id,
            country=args.country,
        )
        
        if args.output == "json":
            print(report.to_json())
        else:
            print(f"\nEntity Compliance Report")
            print(f"  Entity: {args.entity_id}")
            print(f"  Type: {args.entity_type}")
            print(f"  Score: {report.overall_score}%")
            print(f"  Checks: {len(report.checks)}")
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
