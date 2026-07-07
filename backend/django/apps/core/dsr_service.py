"""
GDPR Data Subject Request (DSR) Service
Handles GDPR Articles 15-22: Access, Rectification, Erasure, Restriction, Portability, Objection

Compliance: GDPR, SOC2, ISO 27001
"""

import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from django.db import transaction
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

from apps.core.models import AuditLog
from apps.organizations.models import Organization

User = get_user_model()


class DataSubjectRequestError(Exception):
    """Exception raised for DSR processing errors."""
    pass


class LegalHoldActiveError(DataSubjectRequestError):
    """Raised when erasure cannot proceed due to legal hold."""
    pass


class CanonicalRecordError(DataSubjectRequestError):
    """Raised when erasure cannot proceed due to canonical records."""
    pass


class DataSubjectRequestService:
    """
    Service for handling GDPR Data Subject Requests (DSRs).
    
    Implements:
    - Art. 15: Right of access by the data subject
    - Art. 16: Right to rectification
    - Art. 17: Right to erasure ('right to be forgotten')
    - Art. 18: Right to restriction of processing
    - Art. 20: Right to data portability
    - Art. 21: Right to object
    - Art. 22: Automated individual decision-making
    """
    
    # Request types
    REQUEST_ACCESS = 'access'
    REQUEST_RECTIFY = 'rectify'
    REQUEST_ERASE = 'erase'
    REQUEST_RESTRICT = 'restrict'
    REQUEST_PORTABILITY = 'portability'
    REQUEST_OBJECT = 'object'
    
    REQUEST_TYPES = [
        (REQUEST_ACCESS, 'Access Request'),
        (REQUEST_RECTIFY, 'Rectification Request'),
        (REQUEST_ERASE, 'Erasure Request'),
        (REQUEST_RESTRICT, 'Restriction Request'),
        (REQUEST_PORTABILITY, 'Portability Request'),
        (REQUEST_OBJECT, 'Objection'),
    ]
    
    # Statuses
    STATUS_PENDING = 'pending'
    STATUS_VERIFYING = 'verifying'
    STATUS_PROCESSING = 'processing'
    STATUS_COMPLETED = 'completed'
    STATUS_REJECTED = 'rejected'
    
    # Response deadline (GDPR Art. 12(3))
    RESPONSE_DEADLINE_DAYS = 30
    EXTENSION_DAYS = 60
    
    def __init__(self, organization: Organization):
        self.organization = organization
    
    def create_request(
        self,
        request_type: str,
        data_subject_id: str,
        requester_email: str,
        requester_name: str,
        details: Optional[Dict[str, Any]] = None,
        identity_verified: bool = False,
    ) -> Dict[str, Any]:
        """
        Create a new Data Subject Request.
        
        Returns request metadata for tracking.
        """
        from uuid import uuid4
        
        request_id = str(uuid4())
        now = datetime.now()
        deadline = now + timedelta(days=self.RESPONSE_DEADLINE_DAYS)
        
        request_data = {
            'id': request_id,
            'type': request_type,
            'status': self.STATUS_PENDING,
            'data_subject_id': data_subject_id,
            'requester_email': requester_email,
            'requester_name': requester_name,
            'organization_id': str(self.organization.id),
            'created_at': now.isoformat(),
            'deadline': deadline.isoformat(),
            'identity_verified': identity_verified,
            'details': details or {},
        }
        
        # Log the request creation
        AuditLog.log_dsr(
            action=AuditLog.ACTION_DSR_ACCESS if request_type == self.REQUEST_ACCESS
                   else AuditLog.ACTION_DSR_ERASE if request_type == self.REQUEST_ERASE
                   else AuditLog.ACTION_DSR_RECTIFY if request_type == self.REQUEST_RECTIFY
                   else AuditLog.ACTION_DSR_RESTRICT if request_type == self.REQUEST_RESTRICT
                   else AuditLog.ACTION_DSR_PORTABILITY if request_type == self.REQUEST_PORTABILITY
                   else AuditLog.ACTION_DSR_OBJECT,
            data_subject_id=data_subject_id,
            organization_id=str(self.organization.id),
            extra={'request_id': request_id, 'request_type': request_type},
        )
        
        return request_data
    
    def process_access_request(
        self,
        data_subject_id: str,
        request_id: str,
    ) -> Dict[str, Any]:
        """
        Process Art. 15 - Right of access.
        
        Returns all personal data about the data subject.
        """
        # Collect data from all relevant models
        collected_data = self._collect_personal_data(data_subject_id)
        
        AuditLog.log_dsr(
            action=AuditLog.ACTION_DSR_ACCESS,
            data_subject_id=data_subject_id,
            organization_id=str(self.organization.id),
            extra={'request_id': request_id, 'record_count': len(collected_data)},
        )
        
        return {
            'request_id': request_id,
            'status': self.STATUS_COMPLETED,
            'data': collected_data,
            'format': 'json',
            'generated_at': datetime.now().isoformat(),
        }
    
    def process_rectification_request(
        self,
        data_subject_id: str,
        request_id: str,
        corrections: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Process Art. 16 - Right to rectification.
        
        Updates inaccurate personal data.
        """
        # Apply corrections
        updated_fields = []
        
        for field, new_value in corrections.items():
            # Field update logic would go here
            updated_fields.append({
                'field': field,
                'old_value': '[REDACTED]',  # Don't log old values
                'new_value': '[UPDATED]',
            })
        
        AuditLog.log_dsr(
            action=AuditLog.ACTION_DSR_RECTIFY,
            data_subject_id=data_subject_id,
            organization_id=str(self.organization.id),
            extra={'request_id': request_id, 'fields_updated': [f['field'] for f in updated_fields]},
        )
        
        return {
            'request_id': request_id,
            'status': self.STATUS_COMPLETED,
            'updated_fields': [f['field'] for f in updated_fields],
            'completed_at': datetime.now().isoformat(),
        }
    
    @transaction.atomic
    def process_erasure_request(
        self,
        data_subject_id: str,
        request_id: str,
        force: bool = False,
    ) -> Dict[str, Any]:
        """
        Process Art. 17 - Right to erasure.
        
        Exceptions (Art. 17(3)):
        - Legal hold active
        - Canonical records (Canon 535)
        - Legal obligation
        - Public interest
        """
        # Check for legal hold
        if self.organization.is_legal_hold_active():
            raise LegalHoldActiveError(
                "Cannot process erasure request: legal hold is active on organization."
            )
        
        # Check for canonical records exception
        if self.organization.requires_canonical_compliance() and not force:
            raise CanonicalRecordError(
                "Organization maintains canonical records (Canon 535). "
                "Sacramental records cannot be erased."
            )
        
        # Perform erasure
        erased_count = 0
        retained_records = []
        
        # Determine what can be erased vs retained
        if self.organization.canonical_records:
            # Retain sacramental records but remove non-canonical PII
            retained_records = self._get_canonical_records(data_subject_id)
            erased_count = self._erase_non_canonical_data(data_subject_id)
        else:
            erased_count = self._erase_all_data(data_subject_id)
        
        AuditLog.log_dsr(
            action=AuditLog.ACTION_DSR_ERASE,
            data_subject_id=data_subject_id,
            organization_id=str(self.organization.id),
            extra={
                'request_id': request_id,
                'erased_count': erased_count,
                'retained_records': retained_records,
            },
        )
        
        return {
            'request_id': request_id,
            'status': self.STATUS_COMPLETED,
            'erased_records': erased_count,
            'retained_records': retained_records,
            'completed_at': datetime.now().isoformat(),
        }
    
    def process_restriction_request(
        self,
        data_subject_id: str,
        request_id: str,
        reason: str,
    ) -> Dict[str, Any]:
        """
        Process Art. 18 - Right to restriction of processing.
        
        Marks data as restricted (processing paused).
        """
        # Apply restriction marker
        self._apply_restriction(data_subject_id, reason)
        
        AuditLog.log_dsr(
            action=AuditLog.ACTION_DSR_RESTRICT,
            data_subject_id=data_subject_id,
            organization_id=str(self.organization.id),
            extra={'request_id': request_id, 'reason': reason},
        )
        
        return {
            'request_id': request_id,
            'status': self.STATUS_COMPLETED,
            'restriction_applied': True,
            'completed_at': datetime.now().isoformat(),
        }
    
    def process_portability_request(
        self,
        data_subject_id: str,
        request_id: str,
        format: str = 'json',
    ) -> Dict[str, Any]:
        """
        Process Art. 20 - Right to data portability.
        
        Exports data in machine-readable format.
        """
        # Collect data
        data = self._collect_personal_data(data_subject_id)
        
        # Format for export
        export_data = {
            'metadata': {
                'export_date': datetime.now().isoformat(),
                'organization': self.organization.name,
                'format': format,
                'request_id': request_id,
            },
            'data': data,
        }
        
        AuditLog.log_dsr(
            action=AuditLog.ACTION_DSR_PORTABILITY,
            data_subject_id=data_subject_id,
            organization_id=str(self.organization.id),
            extra={'request_id': request_id, 'format': format},
        )
        
        return export_data
    
    def process_objection_request(
        self,
        data_subject_id: str,
        request_id: str,
        processing_type: str,
        reason: str,
    ) -> Dict[str, Any]:
        """
        Process Art. 21 - Right to object.
        
        Stops specific processing (e.g., direct marketing).
        """
        # Apply objection
        self._apply_objection(data_subject_id, processing_type)
        
        AuditLog.log_dsr(
            action=AuditLog.ACTION_DSR_OBJECT,
            data_subject_id=data_subject_id,
            organization_id=str(self.organization.id),
            extra={
                'request_id': request_id,
                'processing_type': processing_type,
                'reason': reason,
            },
        )
        
        return {
            'request_id': request_id,
            'status': self.STATUS_COMPLETED,
            'objection_applied': processing_type,
            'completed_at': datetime.now().isoformat(),
        }
    
    # Private helper methods
    
    def _collect_personal_data(self, data_subject_id: str) -> List[Dict[str, Any]]:
        """Collect all personal data for a data subject."""
        # This would query all relevant models
        return []
    
    def _erase_all_data(self, data_subject_id: str) -> int:
        """Erase all data for a data subject."""
        # This would delete/anonymize all records
        return 0
    
    def _erase_non_canonical_data(self, data_subject_id: str) -> int:
        """Erase non-canonical data, retaining sacramental records."""
        return 0
    
    def _get_canonical_records(self, data_subject_id: str) -> List[str]:
        """Get list of canonical record types for a data subject."""
        return []
    
    def _apply_restriction(self, data_subject_id: str, reason: str) -> None:
        """Apply processing restriction marker."""
        pass
    
    def _apply_objection(self, data_subject_id: str, processing_type: str) -> None:
        """Apply processing objection marker."""
        pass


class ConsentService:
    """
    Service for managing GDPR consent (Art. 7).
    
    Handles:
    - Consent collection
    - Consent withdrawal
    - Consent verification
    - Consent audit trail
    """
    
    CONSENT_VERSION = '1.0'
    
    @staticmethod
    def record_consent(
        user_id: str,
        organization_id: str,
        consent_types: List[str],
        ip_address: str,
        user_agent: str,
        consent_text_shown: str,
    ) -> Dict[str, Any]:
        """
        Record user consent for specified processing types.
        
        Returns consent record with reference ID.
        """
        from uuid import uuid4
        
        consent_id = str(uuid4())
        now = datetime.now()
        
        consent_record = {
            'id': consent_id,
            'user_id': user_id,
            'organization_id': organization_id,
            'consent_types': consent_types,
            'ip_address': ip_address,
            'user_agent': user_agent,
            'consent_text_shown': consent_text_shown,
            'version': ConsentService.CONSENT_VERSION,
            'timestamp': now.isoformat(),
        }
        
        AuditLog.objects.create(
            action=AuditLog.ACTION_CONSENT_GIVEN,
            entity_type='consent',
            entity_id=consent_id,
            user_id=user_id,
            organization_id=organization_id,
            consent_reference=consent_id,
            ip_address=ip_address,
            user_agent=user_agent,
            legal_basis='consent',
            extra=consent_record,
        )
        
        return consent_record
    
    @staticmethod
    def withdraw_consent(
        consent_id: str,
        user_id: str,
        organization_id: str,
    ) -> Dict[str, Any]:
        """
        Withdraw previously given consent.
        
        Returns withdrawal record.
        """
        now = datetime.now()
        
        AuditLog.objects.create(
            action=AuditLog.ACTION_CONSENT_WITHDRAWN,
            entity_type='consent',
            entity_id=consent_id,
            user_id=user_id,
            organization_id=organization_id,
            consent_reference=consent_id,
            legal_basis='withdrawal',
            extra={'withdrawn_at': now.isoformat()},
        )
        
        return {
            'consent_id': consent_id,
            'withdrawn_at': now.isoformat(),
            'status': 'withdrawn',
        }
    
    @staticmethod
    def verify_consent(
        user_id: str,
        organization_id: str,
        consent_type: str,
    ) -> bool:
        """
        Verify if user has given valid consent for a specific type.
        """
        # Check for valid, non-withdrawn consent
        recent_consent = AuditLog.objects.filter(
            entity_type='consent',
            user_id=user_id,
            organization_id=organization_id,
            action=AuditLog.ACTION_CONSENT_GIVEN,
        ).first()
        
        if not recent_consent:
            return False
        
        # Check for withdrawal
        withdrawn = AuditLog.objects.filter(
            entity_type='consent',
            entity_id=recent_consent.entity_id,
            action=AuditLog.ACTION_CONSENT_WITHDRAWN,
            created_at__gt=recent_consent.created_at,
        ).exists()
        
        return not withdrawn
