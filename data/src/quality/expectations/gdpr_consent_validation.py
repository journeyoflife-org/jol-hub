"""
GDPR Consent Validation
GDPR Classification: CONFIDENTIAL
Purpose: Validate consent timestamps and records

Implements GDPR Article 7 consent requirements.
"""

from typing import Any, Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum


class ConsentType(Enum):
    """Types of consent under GDPR."""
    MARKETING = "marketing"
    ANALYTICS = "analytics"
    THIRD_PARTY = "third_party"
    DATA_PROCESSING = "data_processing"
    COOKIES = "cookies"


@dataclass
class ConsentRecord:
    """GDPR consent record."""
    subject_id: str
    consent_type: ConsentType
    granted_at: datetime
    source: str  # How consent was obtained
    ip_address: Optional[str] = None
    version: str = "1.0"  # Privacy policy version
    withdrawn_at: Optional[datetime] = None
    
    @property
    def is_active(self) -> bool:
        """Check if consent is currently active."""
        return self.granted_at is not None and self.withdrawn_at is None


@dataclass
class ConsentValidationResult:
    """Result of consent validation."""
    is_valid: bool
    subject_id: str
    active_consents: List[ConsentType]
    missing_consents: List[ConsentType]
    expired_consents: List[ConsentType]
    issues: List[str]


class GDPRConsentValidator:
    """
    Validates GDPR consent compliance.
    
    GDPR Article 7 Requirements:
    - Consent must be freely given, specific, informed, and unambiguous
    - Clear affirmative action required
    - Consent must be documented
    - Easy to withdraw
    """
    
    # Consent validity period (re-consent required after)
    CONSENT_VALIDITY_DAYS = 365  # 1 year
    
    # Required consents for different data processing
    REQUIRED_CONSENTS = {
        "marketing": [ConsentType.MARKETING],
        "analytics": [ConsentType.ANALYTICS],
        "third_party_sharing": [ConsentType.THIRD_PARTY],
        "basic_processing": [ConsentType.DATA_PROCESSING],
    }
    
    def __init__(self, validity_days: int = 365):
        self.validity_days = validity_days
    
    def validate(
        self,
        subject_id: str,
        consent_records: List[ConsentRecord],
        processing_type: str,
    ) -> ConsentValidationResult:
        """
        Validate consent for a specific processing type.
        
        Args:
            subject_id: Data subject identifier
            consent_records: List of consent records for the subject
            processing_type: Type of processing (marketing, analytics, etc.)
            
        Returns:
            ConsentValidationResult with validation details
        """
        required = self.REQUIRED_CONSENTS.get(processing_type, [])
        
        result = ConsentValidationResult(
            is_valid=True,
            subject_id=subject_id,
            active_consents=[],
            missing_consents=list(required),
            expired_consents=[],
            issues=[],
        )
        
        for consent in consent_records:
            if consent.subject_id != subject_id:
                continue
            
            if consent.consent_type not in required:
                continue
            
            # Check if withdrawn
            if not consent.is_active:
                result.issues.append(
                    f"Consent for {consent.consent_type.value} was withdrawn at {consent.withdrawn_at}"
                )
                continue
            
            # Check if expired
            if self._is_expired(consent):
                result.expired_consents.append(consent.consent_type)
                result.issues.append(
                    f"Consent for {consent.consent_type.value} expired (granted {consent.granted_at})"
                )
                continue
            
            # Consent is valid
            result.active_consents.append(consent.consent_type)
            if consent.consent_type in result.missing_consents:
                result.missing_consents.remove(consent.consent_type)
        
        # Check if all required consents are present
        if result.missing_consents:
            result.is_valid = False
            result.issues.append(
                f"Missing required consents: {[c.value for c in result.missing_consents]}"
            )
        
        if result.expired_consents:
            result.is_valid = False
        
        return result
    
    def _is_expired(self, consent: ConsentRecord) -> bool:
        """Check if consent has expired."""
        if not consent.granted_at:
            return True
        
        expiry = consent.granted_at + timedelta(days=self.validity_days)
        return datetime.utcnow() > expiry
    
    def validate_batch(
        self,
        subjects: Dict[str, List[ConsentRecord]],
        processing_type: str,
    ) -> Dict[str, ConsentValidationResult]:
        """
        Validate consent for multiple subjects.
        
        Returns:
            Dictionary mapping subject_id to validation result
        """
        results = {}
        
        for subject_id, records in subjects.items():
            results[subject_id] = self.validate(
                subject_id=subject_id,
                consent_records=records,
                processing_type=processing_type,
            )
        
        return results
    
    def get_compliance_stats(
        self,
        results: Dict[str, ConsentValidationResult],
    ) -> Dict[str, Any]:
        """Calculate compliance statistics from validation results."""
        total = len(results)
        valid = sum(1 for r in results.values() if r.is_valid)
        
        return {
            "total_subjects": total,
            "compliant_subjects": valid,
            "non_compliant_subjects": total - valid,
            "compliance_rate": valid / total if total > 0 else 0,
            "common_issues": self._get_common_issues(results),
        }
    
    def _get_common_issues(
        self,
        results: Dict[str, ConsentValidationResult],
    ) -> List[Dict[str, int]]:
        """Get most common consent issues."""
        issue_counts: Dict[str, int] = {}
        
        for result in results.values():
            for issue in result.issues:
                # Extract issue type from message
                issue_type = issue.split()[0] if issue else "unknown"
                issue_counts[issue_type] = issue_counts.get(issue_type, 0) + 1
        
        # Sort by frequency
        sorted_issues = sorted(
            [{"issue": k, "count": v} for k, v in issue_counts.items()],
            key=lambda x: x["count"],
            reverse=True,
        )
        
        return sorted_issues[:10]
