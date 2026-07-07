"""
CRM Observability Module

Provides metrics, health checks, and compliance monitoring for:
- GDPR compliance tracking
- Performance metrics
- Security event monitoring
- Audit trail integrity verification
"""

import logging
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Callable
from functools import wraps

from django.conf import settings
from django.core.cache import cache
from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone
from prometheus_client import Counter, Histogram, Gauge, Info

from apps.crm.middleware import get_current_tenant_id, get_current_tenant_context

logger = logging.getLogger('jolhub.crm.observability')


# =============================================================================
# PROMETHEUS METRICS
# =============================================================================

# Request metrics
CRM_REQUEST_COUNT = Counter(
    'jolhub_crm_requests_total',
    'Total CRM API requests',
    ['tenant_id', 'endpoint', 'method', 'status']
)

CRM_REQUEST_LATENCY = Histogram(
    'jolhub_crm_request_latency_seconds',
    'CRM API request latency',
    ['tenant_id', 'endpoint'],
    buckets=[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0]
)

# Data access metrics
CRM_DATA_ACCESS = Counter(
    'jolhub_crm_data_access_total',
    'CRM data access operations',
    ['tenant_id', 'entity_type', 'operation', 'data_classification']
)

# GDPR compliance metrics
GDPR_REQUEST_COUNT = Counter(
    'jolhub_gdpr_requests_total',
    'GDPR data subject requests',
    ['tenant_id', 'request_type', 'status']
)

GDPR_RESPONSE_TIME = Histogram(
    'jolhub_gdpr_response_time_days',
    'GDPR request response time in days',
    ['tenant_id', 'request_type'],
    buckets=[1, 3, 7, 14, 21, 30, 45, 60]
)

# Security metrics
SECURITY_EVENTS = Counter(
    'jolhub_security_events_total',
    'Security-related events',
    ['tenant_id', 'event_type', 'severity']
)

TENANT_ISOLATION_VIOLATIONS = Counter(
    'jolhub_tenant_isolation_violations_total',
    'Tenant isolation violation attempts',
    ['tenant_id', 'source_tenant', 'target_tenant']
)

# Audit metrics
AUDIT_ENTRIES = Counter(
    'jolhub_audit_entries_total',
    'Audit log entries',
    ['tenant_id', 'event_type']
)

AUDIT_INTEGRITY_CHECKS = Gauge(
    'jolhub_audit_integrity_checks',
    'Audit integrity check results',
    ['tenant_id']
)

# Bitrix24 sync metrics
BITRIX24_SYNC_OPERATIONS = Counter(
    'jolhub_bitrix24_sync_total',
    'Bitrix24 sync operations',
    ['tenant_id', 'entity_type', 'status']
)

BITRIX24_SYNC_LATENCY = Histogram(
    'jolhub_bitrix24_sync_latency_seconds',
    'Bitrix24 sync latency',
    ['tenant_id', 'entity_type'],
    buckets=[0.1, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0]
)

# Circuit breaker gauge
CIRCUIT_BREAKER_STATE = Gauge(
    'jolhub_circuit_breaker_state',
    'Circuit breaker state (0=closed, 1=open)',
    ['tenant_id', 'service']
)


def initialize_metrics():
    """Initialize metrics (called from apps.py)."""
    logger.info("CRM metrics initialized")


# =============================================================================
# COMPLIANCE MONITORING
# =============================================================================

@dataclass
class ComplianceReport:
    """Compliance status report for a tenant."""
    tenant_id: str
    generated_at: datetime
    
    # GDPR metrics
    pending_dsr_count: int = 0
    overdue_dsr_count: int = 0
    avg_dsr_response_days: float = 0.0
    
    # Consent metrics
    contacts_without_consent: int = 0
    consent_withdrawal_count: int = 0
    
    # Legal hold metrics
    active_legal_holds: int = 0
    
    # Audit metrics
    audit_integrity_status: str = 'ok'
    audit_entries_last_24h: int = 0
    
    # Security metrics
    failed_access_attempts: int = 0
    
    # Overall status
    compliance_score: float = 100.0
    issues: List[Dict[str, Any]] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'tenant_id': self.tenant_id,
            'generated_at': self.generated_at.isoformat(),
            'gdpr': {
                'pending_dsr_count': self.pending_dsr_count,
                'overdue_dsr_count': self.overdue_dsr_count,
                'avg_dsr_response_days': self.avg_dsr_response_days,
            },
            'consent': {
                'contacts_without_consent': self.contacts_without_consent,
                'consent_withdrawal_count': self.consent_withdrawal_count,
            },
            'legal_holds': {
                'active_count': self.active_legal_holds,
            },
            'audit': {
                'integrity_status': self.audit_integrity_status,
                'entries_last_24h': self.audit_entries_last_24h,
            },
            'security': {
                'failed_access_attempts': self.failed_access_attempts,
            },
            'compliance_score': self.compliance_score,
            'issues': self.issues,
        }


class ComplianceMonitor:
    """
    Compliance monitoring service.
    
    Provides:
    - GDPR compliance tracking
    - Consent status monitoring
    - Legal hold tracking
    - Audit integrity verification
    """
    
    CACHE_PREFIX = 'jolhub:compliance:'
    CACHE_TIMEOUT = 300  # 5 minutes
    
    @classmethod
    def generate_report(cls, tenant_id: Optional[str] = None) -> ComplianceReport:
        """Generate compliance report for tenant."""
        from apps.crm.models import Contact, Deal, AuditEntry, DataSubjectRequest, ConsentStatus
        
        tenant_id = tenant_id or get_current_tenant_id()
        if not tenant_id:
            raise ValueError("Tenant ID required")
        
        report = ComplianceReport(
            tenant_id=tenant_id,
            generated_at=timezone.now()
        )
        
        # Check cache
        cache_key = f"{cls.CACHE_PREFIX}report:{tenant_id}"
        cached = cache.get(cache_key)
        if cached:
            return ComplianceReport(**cached)
        
        # GDPR DSR metrics
        dsr_qs = DataSubjectRequest.objects.filter(organization_id=tenant_id)
        report.pending_dsr_count = dsr_qs.filter(
            status=DataSubjectRequest.Status.PENDING
        ).count()
        report.overdue_dsr_count = dsr_qs.filter(
            status=DataSubjectRequest.Status.PENDING,
            due_date__lt=timezone.now().date()
        ).count()
        
        completed_dsrs = dsr_qs.filter(
            status=DataSubjectRequest.Status.COMPLETED,
            completed_at__isnull=False
        )
        if completed_dsrs.exists():
            # Calculate average response time
            total_days = sum(
                (dsr.completed_at - dsr.created_at).days
                for dsr in completed_dsrs
            )
            report.avg_dsr_response_days = total_days / completed_dsrs.count()
        
        # Consent metrics
        contact_qs = Contact.objects.filter(organization_id=tenant_id)
        report.contacts_without_consent = contact_qs.filter(
            consent_status=ConsentStatus.PENDING
        ).count()
        report.consent_withdrawal_count = contact_qs.filter(
            consent_status=ConsentStatus.WITHDRAWN
        ).count()
        
        # Legal holds
        report.active_legal_holds = contact_qs.filter(
            legal_hold=True
        ).count()
        
        # Audit metrics
        audit_qs = AuditEntry.objects.filter(organization_id=tenant_id)
        integrity_result = AuditEntry.verify_chain(tenant_id)
        report.audit_integrity_status = 'ok' if integrity_result['valid'] else 'compromised'
        report.audit_entries_last_24h = audit_qs.filter(
            created_at__gte=timezone.now() - timedelta(hours=24)
        ).count()
        
        # Security metrics
        report.failed_access_attempts = audit_qs.filter(
            event_type=AuditEntry.EventType.ACCESS,
            details__success=False,
            created_at__gte=timezone.now() - timedelta(hours=24)
        ).count()
        
        # Calculate compliance score
        score = 100.0
        issues = []
        
        if report.overdue_dsr_count > 0:
            score -= 20 * min(report.overdue_dsr_count, 3)
            issues.append({
                'severity': 'critical',
                'message': f'{report.overdue_dsr_count} overdue GDPR requests',
                'code': 'OVERDUE_DSR'
            })
        
        if report.audit_integrity_status != 'ok':
            score -= 50
            issues.append({
                'severity': 'critical',
                'message': 'Audit log integrity compromised',
                'code': 'AUDIT_INTEGRITY'
            })
        
        if report.contacts_without_consent > 100:
            score -= 10
            issues.append({
                'severity': 'warning',
                'message': f'{report.contacts_without_consent} contacts without consent',
                'code': 'PENDING_CONSENT'
            })
        
        report.compliance_score = max(0, score)
        report.issues = issues
        
        # Cache the report
        cache.set(cache_key, report.__dict__, cls.CACHE_TIMEOUT)
        
        return report
    
    @classmethod
    def check_dsr_deadlines(cls) -> List[Dict[str, Any]]:
        """Check for DSR deadlines approaching or overdue."""
        from apps.crm.models import DataSubjectRequest
        
        now = timezone.now()
        warning_threshold = now + timedelta(days=7)
        
        dsrs = DataSubjectRequest.objects.filter(
            status=DataSubjectRequest.Status.PENDING,
            due_date__lte=warning_threshold.date()
        ).select_related('organization')
        
        alerts = []
        for dsr in dsrs:
            severity = 'critical' if dsr.due_date < now.date() else 'warning'
            alerts.append({
                'tenant_id': str(dsr.organization_id),
                'dsr_id': str(dsr.id),
                'request_type': dsr.request_type,
                'due_date': dsr.due_date.isoformat(),
                'days_remaining': (dsr.due_date - now.date()).days,
                'severity': severity,
            })
        
        return alerts


# =============================================================================
# PERFORMANCE MONITORING
# =============================================================================

class PerformanceMonitor:
    """
    Performance monitoring for CRM operations.
    
    Provides:
    - Request timing
    - Database query tracking
    - Cache hit/miss tracking
    """
    
    @staticmethod
    def track_request(endpoint: str):
        """Decorator to track request performance."""
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            def wrapper(*args, **kwargs):
                tenant_id = get_current_tenant_id() or 'unknown'
                start_time = time.time()
                status = 'success'
                
                try:
                    result = func(*args, **kwargs)
                    return result
                except Exception as e:
                    status = 'error'
                    raise
                finally:
                    latency = time.time() - start_time
                    CRM_REQUEST_LATENCY.labels(
                        tenant_id=tenant_id,
                        endpoint=endpoint
                    ).observe(latency)
                    CRM_REQUEST_COUNT.labels(
                        tenant_id=tenant_id,
                        endpoint=endpoint,
                        method='UNKNOWN',
                        status=status
                    ).labels()
            
            return wrapper
        return decorator
    
    @staticmethod
    def track_data_access(entity_type: str, operation: str, data_classification: str):
        """Track data access for compliance."""
        tenant_id = get_current_tenant_id() or 'unknown'
        CRM_DATA_ACCESS.labels(
            tenant_id=tenant_id,
            entity_type=entity_type,
            operation=operation,
            data_classification=data_classification
        ).inc()


# =============================================================================
# HEALTH CHECKS
# =============================================================================

class HealthChecker:
    """
    Health check service for CRM module.
    
    Provides:
    - Database connectivity check
    - Audit system health
    - Bitrix24 connectivity
    """
    
    @staticmethod
    def check_database() -> Dict[str, Any]:
        """Check database connectivity."""
        from django.db import connection
        from apps.crm.models import Contact
        
        try:
            # Simple query to test database
            count = Contact.objects.count()
            return {
                'status': 'healthy',
                'contacts_count': count,
            }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e),
            }
    
    @staticmethod
    def check_audit_integrity(tenant_id: Optional[str] = None) -> Dict[str, Any]:
        """Check audit log integrity."""
        from apps.crm.models import AuditEntry
        
        tenant_id = tenant_id or get_current_tenant_id()
        if not tenant_id:
            return {'status': 'unknown', 'message': 'No tenant context'}
        
        result = AuditEntry.verify_chain(tenant_id)
        
        return {
            'status': 'healthy' if result['valid'] else 'compromised',
            'entries_checked': result['entries_checked'],
            'errors': result['errors'],
        }
    
    @staticmethod
    def check_bitrix24(tenant_id: Optional[str] = None) -> Dict[str, Any]:
        """Check Bitrix24 connectivity."""
        from apps.crm.bitrix24_service import Bitrix24ClientFactory
        
        tenant_id = tenant_id or get_current_tenant_id()
        if not tenant_id:
            return {'status': 'unknown', 'message': 'No tenant context'}
        
        circuit_breaker = Bitrix24ClientFactory.get_circuit_breaker(tenant_id)
        
        if circuit_breaker.is_open:
            return {
                'status': 'degraded',
                'message': 'Circuit breaker open',
                'next_retry': circuit_breaker.next_retry_time.isoformat() if circuit_breaker.next_retry_time else None,
            }
        
        client = Bitrix24ClientFactory.get_client(tenant_id)
        if not client:
            return {
                'status': 'not_configured',
                'message': 'Bitrix24 not configured for this tenant',
            }
        
        return {
            'status': 'healthy',
            'message': 'Bitrix24 client available',
        }
    
    @classmethod
    def full_health_check(cls, tenant_id: Optional[str] = None) -> Dict[str, Any]:
        """Run full health check."""
        return {
            'database': cls.check_database(),
            'audit_integrity': cls.check_audit_integrity(tenant_id),
            'bitrix24': cls.check_bitrix24(tenant_id),
            'timestamp': timezone.now().isoformat(),
        }
