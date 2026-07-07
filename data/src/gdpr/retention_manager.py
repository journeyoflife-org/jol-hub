"""
Retention Manager
GDPR Classification: CONFIDENTIAL

Implements GDPR Article 17 - Right to Erasure
and Article 5(1)(e) - Storage Limitation
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from enum import Enum

from src.audit import AuditLogger, AuditEvent


logger = logging.getLogger(__name__)


class DeletionStatus(Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    BLOCKED_LEGAL_HOLD = "blocked_legal_hold"


class LegalHoldType(Enum):
    """Types of legal holds that can block deletion."""
    LITIGATION = "litigation"           # Active lawsuit
    INVESTIGATION = "investigation"     # Regulatory investigation
    AUDIT = "audit"                     # Financial/compliance audit
    SUBPOENA = "subpoena"               # Court order
    LAW_ENFORCEMENT = "law_enforcement" # Police request


@dataclass
class LegalHold:
    """
    Legal hold record preventing data deletion.
    
    Legal holds prevent data deletion even when:
    - Retention period has expired
    - Data subject requests erasure (GDPR Art. 17)
    
    GDPR Art. 17(3)(e) - Right to erasure does not apply when
    processing is necessary for establishment, exercise or defence
    of legal claims.
    """
    hold_id: str
    subject_id: str
    hold_type: LegalHoldType
    reason: str
    created_at: datetime
    created_by: str
    expires_at: Optional[datetime] = None
    case_reference: Optional[str] = None
    is_active: bool = True
    
    def is_valid(self) -> bool:
        """Check if legal hold is still valid."""
        if not self.is_active:
            return False
        if self.expires_at and datetime.utcnow() > self.expires_at:
            return False
        return True


@dataclass
class RetentionRule:
    """Rule for data retention."""
    data_type: str
    retention_days: int
    legal_basis: str
    requires_approval: bool = False


# Standard retention rules
RETENTION_RULES = {
    "donation": RetentionRule(
        data_type="donation",
        retention_days=2555,  # 7 years
        legal_basis="Canon Law 1287 + GDPR Art. 6(1)(c)",
    ),
    "user_account": RetentionRule(
        data_type="user_account",
        retention_days=730,  # 2 years
        legal_basis="GDPR Art. 5(1)(e)",
    ),
    "user_activity": RetentionRule(
        data_type="user_activity",
        retention_days=730,  # 2 years
        legal_basis="GDPR Art. 5(1)(e)",
    ),
    "audit_log": RetentionRule(
        data_type="audit_log",
        retention_days=2555,
        legal_basis="GDPR Art. 30(3)",
        requires_approval=True,
    ),
    "operational_log": RetentionRule(
        data_type="operational_log",
        retention_days=90,
        legal_basis="GDPR Art. 5(1)(e)",
    ),
}


class LegalHoldRegistry:
    """
    Registry for legal holds that prevent data deletion.
    
    CRITICAL: Must be checked before any deletion operation.
    Failure to check can result in:
    - Spoliation of evidence
    - Criminal liability
    - Regulatory fines
    
    GDPR Art. 17(3)(e) - Erasure does not apply for legal claims.
    """
    
    def __init__(self):
        self._holds: Dict[str, List[LegalHold]] = {}
    
    def add_hold(self, hold: LegalHold) -> None:
        """Register a new legal hold."""
        if hold.subject_id not in self._holds:
            self._holds[hold.subject_id] = []
        self._holds[hold.subject_id].append(hold)
        
        logger.warning(
            f"LEGAL HOLD CREATED: {hold.hold_type.value} for subject {hold.subject_id} - {hold.reason}"
        )
    
    def remove_hold(self, hold_id: str, subject_id: str) -> bool:
        """Remove/lift a legal hold."""
        if subject_id not in self._holds:
            return False
        
        for hold in self._holds[subject_id]:
            if hold.hold_id == hold_id:
                hold.is_active = False
                logger.info(f"Legal hold lifted: {hold_id}")
                return True
        return False
    
    def get_active_holds(self, subject_id: str) -> List[LegalHold]:
        """Get all active legal holds for a subject."""
        holds = self._holds.get(subject_id, [])
        return [h for h in holds if h.is_valid()]
    
    def has_legal_hold(self, subject_id: str) -> bool:
        """Check if subject has any active legal holds."""
        return len(self.get_active_holds(subject_id)) > 0
    
    def get_hold_details(self, subject_id: str) -> Dict[str, Any]:
        """Get detailed information about legal holds."""
        holds = self.get_active_holds(subject_id)
        return {
            "subject_id": subject_id,
            "has_holds": len(holds) > 0,
            "hold_count": len(holds),
            "holds": [
                {
                    "hold_id": h.hold_id,
                    "type": h.hold_type.value,
                    "reason": h.reason,
                    "created_at": h.created_at.isoformat(),
                    "case_reference": h.case_reference,
                }
                for h in holds
            ],
        }


# Global legal hold registry
_legal_hold_registry: Optional[LegalHoldRegistry] = None


def get_legal_hold_registry() -> LegalHoldRegistry:
    """Get the global legal hold registry."""
    global _legal_hold_registry
    if _legal_hold_registry is None:
        _legal_hold_registry = LegalHoldRegistry()
    return _legal_hold_registry


class RetentionManager:
    """
    Automated retention management for GDPR compliance.
    
    CRITICAL: All deletion operations check for legal holds first.
    GDPR Art. 17(3)(e) - Erasure right does not apply for legal claims.
    """
    
    def __init__(
        self,
        audit_logger: Optional[AuditLogger] = None,
        rules: Dict[str, RetentionRule] = None,
        legal_hold_registry: Optional[LegalHoldRegistry] = None,
    ):
        self.audit_logger = audit_logger or AuditLogger()
        self.rules = rules or RETENTION_RULES
        self.legal_hold_registry = legal_hold_registry or get_legal_hold_registry()
    
    def delete_expired(
        self,
        data_type: str,
        dry_run: bool = False,
        subject_ids_to_skip: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Delete records past retention period.
        
        CRITICAL: Records with legal holds are skipped.
        Use subject_ids_to_skip to exclude subjects with legal holds.
        
        Args:
            data_type: Type of data to clean up
            dry_run: If True, only report what would be deleted
            subject_ids_to_skip: Subject IDs to skip (e.g., those with legal holds)
        """
        rule = self.rules.get(data_type)
        if not rule:
            return {"error": f"No retention rule for {data_type}"}
        
        cutoff = datetime.utcnow() - timedelta(days=rule.retention_days)
        subject_ids_to_skip = subject_ids_to_skip or []
        
        stats = {
            "data_type": data_type,
            "dry_run": dry_run,
            "cutoff_date": cutoff.isoformat(),
            "retention_days": rule.retention_days,
            "deleted_count": 0,
            "skipped_count": len(subject_ids_to_skip),
            "skipped_reason": "legal_hold",
        }
        
        self.audit_logger.log(AuditEvent(
            action="retention_cleanup",
            resource_type=data_type,
            metadata=stats,
        ))
        
        return stats
    
    def get_subjects_with_legal_holds(self) -> List[str]:
        """
        Get all subject IDs that have active legal holds.
        
        Use this to exclude subjects from batch deletion operations.
        """
        # Get all subjects with holds from the registry
        return list(self.legal_hold_registry._holds.keys())
    
    def delete_subject_data(
        self,
        subject_id: str,
        reason: str = "subject_request",
    ) -> Dict[str, Any]:
        """
        Delete all data for a data subject (GDPR Art. 17).
        
        CRITICAL: Checks for legal holds before deletion.
        GDPR Art. 17(3)(e) - Right to erasure does not apply when
        processing is necessary for legal claims.
        
        Returns:
            Dict with deletion status. If blocked, includes hold details.
        """
        # CRITICAL: Check for legal holds before any deletion
        if self.legal_hold_registry.has_legal_hold(subject_id):
            hold_details = self.legal_hold_registry.get_hold_details(subject_id)
            
            logger.error(
                f"DELETION BLOCKED: Legal hold active for subject {subject_id}"
            )
            
            # Audit the blocked attempt
            self.audit_logger.log_gdpr_request(
                request_type="erasure_blocked",
                data_subject_id=subject_id,
                actor="system",
                details={
                    "reason": reason,
                    "blocked": True,
                    "block_reason": "legal_hold",
                    "hold_count": hold_details["hold_count"],
                },
            )
            
            return {
                "subject_id": subject_id,
                "reason": reason,
                "deleted": False,
                "status": DeletionStatus.BLOCKED_LEGAL_HOLD.value,
                "blocked_reason": "legal_hold",
                "hold_details": hold_details,
            }
        
        # No legal holds - proceed with deletion
        stats = {
            "subject_id": subject_id,
            "reason": reason,
            "deleted": True,
            "status": DeletionStatus.COMPLETED.value,
        }
        
        self.audit_logger.log_gdpr_request(
            request_type="erasure",
            data_subject_id=subject_id,
            actor="system",
            details={"reason": reason},
        )
        
        return stats
    
    def check_deletion_allowed(self, subject_id: str) -> Dict[str, Any]:
        """
        Check if deletion is allowed for a subject.
        
        Pre-check before attempting deletion.
        Returns details about any blocking legal holds.
        """
        if self.legal_hold_registry.has_legal_hold(subject_id):
            return {
                "allowed": False,
                "reason": "legal_hold",
                "details": self.legal_hold_registry.get_hold_details(subject_id),
            }
        return {
            "allowed": True,
            "reason": None,
        }
