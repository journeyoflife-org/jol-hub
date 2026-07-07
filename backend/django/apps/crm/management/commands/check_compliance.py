"""
Compliance Check Management Command

Usage:
    python manage.py check_compliance --tenant=<tenant_id>
    python manage.py check_compliance --all-tenants
    python manage.py check_compliance --tenant=<tenant_id> --alert-thresholds
"""

import logging
from typing import Optional

from django.core.management.base import BaseCommand, CommandError
from django.db.models import Q
from django.utils import timezone

from apps.crm.models import Contact, Deal, AuditEntry, DataSubjectRequest, ConsentStatus
from apps.crm.observability import ComplianceMonitor, ComplianceReport

logger = logging.getLogger('jolhub.crm.management')


class Command(BaseCommand):
    help = 'Check GDPR compliance status for CRM data'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--tenant',
            type=str,
            help='Specific tenant/organization ID to check',
        )
        parser.add_argument(
            '--all-tenants',
            action='store_true',
            help='Check all tenants',
        )
        parser.add_argument(
            '--alert-thresholds',
            action='store_true',
            help='Only show issues that exceed alert thresholds',
        )
        parser.add_argument(
            '--output',
            type=str,
            choices=['text', 'json'],
            default='text',
            help='Output format',
        )
    
    def handle(self, *args, **options):
        tenant_id = options.get('tenant')
        all_tenants = options['all_tenants']
        alert_thresholds = options['alert_thresholds']
        output_format = options['output']
        
        if all_tenants:
            self._check_all_tenants(alert_thresholds, output_format)
        elif tenant_id:
            self._check_tenant(tenant_id, alert_thresholds, output_format)
        else:
            raise CommandError("Specify --tenant or --all-tenants")
    
    def _check_all_tenants(self, alert_thresholds: bool, output_format: str):
        """Check compliance for all tenants."""
        from apps.organizations.models import Organization
        
        orgs = Organization.objects.filter(status=Organization.STATUS_ACTIVE)
        
        issues_found = 0
        for org in orgs:
            report = ComplianceMonitor.generate_report(str(org.id))
            
            if alert_thresholds and report.compliance_score >= 80:
                continue
            
            if output_format == 'json':
                self.stdout.write(report.to_json())
            else:
                self._print_report(report)
            
            issues_found += len(report.issues)
        
        if issues_found > 0:
            self.stdout.write(
                self.style.WARNING(f"\nTotal issues found across all tenants: {issues_found}")
            )
    
    def _check_tenant(self, tenant_id: str, alert_thresholds: bool, output_format: str):
        """Check compliance for a single tenant."""
        report = ComplianceMonitor.generate_report(tenant_id)
        
        if output_format == 'json':
            import json
            self.stdout.write(json.dumps(report.to_dict(), indent=2))
        else:
            self._print_report(report)
        
        # Exit with error code if compliance score is too low
        if report.compliance_score < 50:
            raise CommandError(f"Critical compliance issues detected (score: {report.compliance_score})")
    
    def _print_report(self, report: ComplianceReport):
        """Print compliance report in text format."""
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write("GDPR COMPLIANCE REPORT")
        self.stdout.write("=" * 60)
        self.stdout.write(f"Tenant ID:    {report.tenant_id}")
        self.stdout.write(f"Generated at: {report.generated_at}")
        self.stdout.write(f"Score:        {report.compliance_score:.1f}/100")
        
        # GDPR section
        self.stdout.write("\n" + "-" * 40)
        self.stdout.write("GDPR Data Subject Requests")
        self.stdout.write("-" * 40)
        self.stdout.write(f"  Pending requests:     {report.pending_dsr_count}")
        self.stdout.write(f"  Overdue requests:     {report.overdue_dsr_count}")
        self.stdout.write(f"  Avg response time:    {report.avg_dsr_response_days:.1f} days")
        
        if report.overdue_dsr_count > 0:
            self.stdout.write(
                self.style.ERROR(f"  ⚠️  {report.overdue_dsr_count} OVERDUE REQUESTS!")
            )
        
        # Consent section
        self.stdout.write("\n" + "-" * 40)
        self.stdout.write("Consent Status")
        self.stdout.write("-" * 40)
        self.stdout.write(f"  Without consent:      {report.contacts_without_consent}")
        self.stdout.write(f"  Withdrawn consent:    {report.consent_withdrawal_count}")
        
        # Legal holds
        self.stdout.write("\n" + "-" * 40)
        self.stdout.write("Legal Holds")
        self.stdout.write("-" * 40)
        self.stdout.write(f"  Active legal holds:   {report.active_legal_holds}")
        
        # Audit
        self.stdout.write("\n" + "-" * 40)
        self.stdout.write("Audit Trail")
        self.stdout.write("-" * 40)
        self.stdout.write(f"  Integrity status:     {report.audit_integrity_status}")
        self.stdout.write(f"  Entries (24h):        {report.audit_entries_last_24h}")
        
        if report.audit_integrity_status != 'ok':
            self.stdout.write(
                self.style.ERROR("  ⚠️  AUDIT LOG INTEGRITY COMPROMISED!")
            )
        
        # Security
        self.stdout.write("\n" + "-" * 40)
        self.stdout.write("Security")
        self.stdout.write("-" * 40)
        self.stdout.write(f"  Failed access (24h):  {report.failed_access_attempts}")
        
        # Issues
        if report.issues:
            self.stdout.write("\n" + "-" * 40)
            self.stdout.write("ISSUES DETECTED")
            self.stdout.write("-" * 40)
            
            for issue in report.issues:
                severity = issue.get('severity', 'info')
                message = issue.get('message', '')
                code = issue.get('code', '')
                
                if severity == 'critical':
                    style = self.style.ERROR
                elif severity == 'warning':
                    style = self.style.WARNING
                else:
                    style = self.style.NOTICE
                
                self.stdout.write(style(f"  [{severity.upper()}] {message} ({code})"))
        
        # Summary
        self.stdout.write("\n" + "=" * 60)
        if report.compliance_score >= 90:
            self.stdout.write(self.style.SUCCESS(f"STATUS: EXCELLENT ({report.compliance_score:.0f}%)"))
        elif report.compliance_score >= 70:
            self.stdout.write(self.style.SUCCESS(f"STATUS: GOOD ({report.compliance_score:.0f}%)"))
        elif report.compliance_score >= 50:
            self.stdout.write(self.style.WARNING(f"STATUS: NEEDS ATTENTION ({report.compliance_score:.0f}%)"))
        else:
            self.stdout.write(self.style.ERROR(f"STATUS: CRITICAL ({report.compliance_score:.0f}%)"))
        self.stdout.write("=" * 60 + "\n")
