"""
DSAR Service - Data Subject Access Request Handler

GDPR Article 15 - Right of access by the data subject.
GDPR Article 17 - Right to erasure ('right to be forgotten').
GDPR Article 20 - Right to data portability.

This service coordinates DSAR requests across all data processors,
ensuring complete data retrieval and compliant deletion.

30-day response deadline per GDPR Art. 12(3).
"""

import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, field

from .processors import (
    DonationProcessor,
    UserdataProcessor,
    DSARResult,
    DeletionResult,
)
from .audit import AuditLogger, AuditEvent


logger = logging.getLogger(__name__)


@dataclass
class CompositeDSARResult:
    """Result of a complete DSAR across all data categories."""
    subject_id: str
    request_id: str
    requested_at: datetime
    completed_at: Optional[datetime] = None
    data_categories: Dict[str, Any] = field(default_factory=dict)
    total_records: int = 0
    export_url: Optional[str] = None
    status: str = "pending"


@dataclass
class CompositeDeletionResult:
    """Result of a complete erasure request across all data categories."""
    subject_id: str
    request_id: str
    requested_at: datetime
    completed_at: Optional[datetime] = None
    total_deleted: int = 0
    total_retained: int = 0
    retention_exempt: List[str] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
    status: str = "pending"


class DSARService:
    """
    Central service for handling Data Subject Access Requests.
    
    GDPR Compliance:
    - Art. 12(3): Respond within 30 days
    - Art. 15: Right of access
    - Art. 17: Right to erasure
    - Art. 20: Right to portability
    
    Usage:
        service = DSARService()
        
        # Data Subject Access Request
        result = service.get_all_data(user_id)
        
        # Data Subject Erasure Request
        result = service.delete_all_data(user_id, dry_run=True)
    """
    
    def __init__(self, audit_logger: Optional[AuditLogger] = None):
        self.audit_logger = audit_logger or AuditLogger()
        
        # Initialize all processors
        self.processors = {
            'user': UserdataProcessor(audit_logger=self.audit_logger),
            'donation': DonationProcessor(audit_logger=self.audit_logger),
        }
    
    def get_all_data(self, subject_id: str) -> Dict[str, Any]:
        """
        Retrieve all personal data for a data subject.
        
        GDPR Article 15 - Right of access.
        GDPR Article 20 - Right to data portability.
        
        Returns data in machine-readable JSON format.
        """
        request_id = f"dsar-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{subject_id[:8]}"
        result = CompositeDSARResult(
            subject_id=subject_id,
            request_id=request_id,
            requested_at=datetime.utcnow(),
        )
        
        logger.info(f"DSAR_STARTED: request={request_id} subject={subject_id}")
        
        # Audit log the request
        self.audit_logger.log(AuditEvent(
            action="dsar_request_started",
            resource_type="data_subject",
            resource_id=subject_id,
            legal_basis="GDPR Art. 15",
            metadata={'request_id': request_id},
        ))
        
        # Collect data from all processors
        for category, processor in self.processors.items():
            try:
                data = processor.get_data_subject_data(subject_id)
                result.data_categories[category] = data
                result.total_records += data.get('total_records', 0)
            except Exception as e:
                logger.exception(f"DSAR_PROCESSOR_ERROR: category={category} error={str(e)}")
                result.data_categories[category] = {'error': str(e)}
        
        result.completed_at = datetime.utcnow()
        result.status = "completed"
        
        # Audit log completion
        self.audit_logger.log(AuditEvent(
            action="dsar_request_completed",
            resource_type="data_subject",
            resource_id=subject_id,
            legal_basis="GDPR Art. 15",
            metadata={
                'request_id': request_id,
                'total_records': result.total_records,
                'duration_seconds': (result.completed_at - result.requested_at).total_seconds(),
            },
        ))
        
        logger.info(
            f"DSAR_COMPLETED: request={request_id} subject={subject_id} "
            f"records={result.total_records}"
        )
        
        return {
            'request_id': request_id,
            'subject_id': subject_id,
            'requested_at': result.requested_at.isoformat(),
            'completed_at': result.completed_at.isoformat(),
            'status': result.status,
            'total_records': result.total_records,
            'data': result.data_categories,
            'export_format': 'json',
            'legal_basis': 'GDPR Article 15 - Right of access',
            'legal_reference': 'https://gdpr-info.eu/art-15-gdpr/',
        }
    
    def delete_all_data(
        self,
        subject_id: str,
        dry_run: bool = False,
        skip_categories: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Delete all personal data for a data subject.
        
        GDPR Article 17 - Right to erasure.
        GDPR Article 17(3) - Exemptions for legal obligations.
        
        Args:
            subject_id: The data subject's unique identifier
            dry_run: If True, simulate without actual deletion
            skip_categories: Data categories to skip (e.g., ['donation'] for retention)
        
        Returns:
            Dict with deletion results per category and retention exemptions
        """
        request_id = f"del-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{subject_id[:8]}"
        result = CompositeDeletionResult(
            subject_id=subject_id,
            request_id=request_id,
            requested_at=datetime.utcnow(),
        )
        
        skip_categories = skip_categories or []
        
        logger.info(
            f"DSAR_ERASURE_STARTED: request={request_id} subject={subject_id} "
            f"dry_run={dry_run} skip={skip_categories}"
        )
        
        # Audit log the request
        self.audit_logger.log(AuditEvent(
            action="dsar_erasure_started",
            resource_type="data_subject",
            resource_id=subject_id,
            legal_basis="GDPR Art. 17",
            metadata={
                'request_id': request_id,
                'dry_run': dry_run,
                'skip_categories': skip_categories,
            },
        ))
        
        # Process deletion through all processors
        deletion_results = {}
        
        for category, processor in self.processors.items():
            if category in skip_categories:
                logger.info(f"DSAR_SKIP_CATEGORY: category={category}")
                continue
            
            try:
                deletion = processor.delete_data_subject_data(subject_id, dry_run=dry_run)
                deletion_results[category] = deletion
                
                result.total_deleted += deletion.get('deleted_records', 0)
                result.total_retained += deletion.get('retained_records', 0)
                result.retention_exempt.extend(deletion.get('retention_exempt', []))
                result.errors.extend(deletion.get('errors', []))
                
            except Exception as e:
                logger.exception(f"DSAR_ERASURE_ERROR: category={category} error={str(e)}")
                result.errors.append(f"{category}: {str(e)}")
                deletion_results[category] = {'error': str(e)}
        
        result.completed_at = datetime.utcnow()
        result.status = "completed" if not result.errors else "partial"
        
        # Audit log completion
        self.audit_logger.log(AuditEvent(
            action="dsar_erasure_completed",
            resource_type="data_subject",
            resource_id=subject_id,
            legal_basis="GDPR Art. 17",
            metadata={
                'request_id': request_id,
                'total_deleted': result.total_deleted,
                'total_retained': result.total_retained,
                'retention_exempt_count': len(result.retention_exempt),
                'errors_count': len(result.errors),
                'dry_run': dry_run,
            },
        ))
        
        logger.info(
            f"DSAR_ERASURE_COMPLETED: request={request_id} subject={subject_id} "
            f"deleted={result.total_deleted} retained={result.total_retained} "
            f"errors={len(result.errors)}"
        )
        
        return {
            'request_id': request_id,
            'subject_id': subject_id,
            'requested_at': result.requested_at.isoformat(),
            'completed_at': result.completed_at.isoformat(),
            'status': result.status,
            'dry_run': dry_run,
            'total_deleted': result.total_deleted,
            'total_retained': result.total_retained,
            'retention_exempt': result.retention_exempt,
            'errors': result.errors,
            'details': deletion_results,
            'legal_basis': 'GDPR Article 17 - Right to erasure',
            'legal_reference': 'https://gdpr-info.eu/art-17-gdpr/',
        }
    
    def export_to_json(self, subject_id: str, output_path: str) -> str:
        """
        Export all data to a JSON file for data portability.
        
        GDPR Article 20 - Right to data portability.
        
        Args:
            subject_id: The data subject's unique identifier
            output_path: Path to save the JSON export
        
        Returns:
            Path to the exported file
        """
        data = self.get_all_data(subject_id)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False, default=str)
        
        logger.info(f"DSAR_EXPORT: subject={subject_id} path={output_path}")
        
        return output_path


# Convenience function for direct DSAR handling
def handle_dsar_access(subject_id: str) -> Dict[str, Any]:
    """Handle a Data Subject Access Request (GDPR Art. 15)."""
    service = DSARService()
    return service.get_all_data(subject_id)


def handle_dsar_erasure(subject_id: str, dry_run: bool = False) -> Dict[str, Any]:
    """Handle a Data Subject Erasure Request (GDPR Art. 17)."""
    service = DSARService()
    return service.delete_all_data(subject_id, dry_run=dry_run)
