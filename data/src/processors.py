"""
Data Processors Module
ETL and data transformation utilities with GDPR compliance

GDPR Article 15 - Right of access by the data subject.
GDPR Article 17 - Right to erasure ('right to be forgotten').
GDPR Article 20 - Right to data portability.
"""

import logging
import os
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Callable
from decimal import Decimal
from enum import Enum

import psycopg2
from psycopg2.extras import RealDictCursor

from .config import DataClassification, RetentionPolicy, config
from .audit import AuditLogger, AuditEvent


logger = logging.getLogger(__name__)


def get_database_connection():
    """Get PostgreSQL database connection from environment."""
    return psycopg2.connect(
        host=os.environ.get('DB_HOST', 'localhost'),
        port=int(os.environ.get('DB_PORT', 5432)),
        database=os.environ.get('DB_NAME', 'jolhub'),
        user=os.environ.get('DB_USER', 'jolhub'),
        password=os.environ.get('DB_PASSWORD', ''),
    )


@dataclass
class DSARResult:
    """
    Result of a Data Subject Access Request (GDPR Art. 15).
    
    Contains all personal data for a data subject in portable format.
    """
    subject_id: str
    request_id: str
    requested_at: datetime
    completed_at: Optional[datetime] = None
    data_categories: Dict[str, Any] = field(default_factory=dict)
    total_records: int = 0
    export_format: str = "json"
    legal_basis: str = "GDPR Art. 15 - Right of access"


@dataclass
class DeletionResult:
    """
    Result of a Data Subject Erasure Request (GDPR Art. 17).
    
    Tracks what was deleted and any exemptions applied.
    """
    subject_id: str
    request_id: str
    requested_at: datetime
    completed_at: Optional[datetime] = None
    deleted_records: int = 0
    retained_records: int = 0
    retention_exempt: List[str] = field(default_factory=list)
    legal_basis: str = "GDPR Art. 17 - Right to erasure"
    errors: List[str] = field(default_factory=list)


@dataclass
class ProcessingResult:
    """Result of a data processing operation."""
    success: bool
    records_processed: int
    records_failed: int
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    started_at: datetime = field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    @property
    def duration_seconds(self) -> Optional[float]:
        if self.completed_at:
            return (self.completed_at - self.started_at).total_seconds()
        return None


class DataProcessor(ABC):
    """
    Abstract base class for data processors.
    
    All processors must implement GDPR-compliant handling:
    - Log all processing activities
    - Apply data classification rules
    - Support data subject rights (access, deletion)
    - Maintain audit trails
    """
    
    def __init__(
        self,
        name: str,
        classification: DataClassification = DataClassification.INTERNAL,
        audit_logger: Optional[AuditLogger] = None,
    ):
        self.name = name
        self.classification = classification
        self.audit_logger = audit_logger or AuditLogger()
        self._pre_hooks: List[Callable] = []
        self._post_hooks: List[Callable] = []
    
    def add_pre_hook(self, hook: Callable) -> None:
        """Add a pre-processing hook."""
        self._pre_hooks.append(hook)
    
    def add_post_hook(self, hook: Callable) -> None:
        """Add a post-processing hook."""
        self._post_hooks.append(hook)
    
    def _run_pre_hooks(self, data: Any) -> Any:
        """Execute all pre-processing hooks."""
        result = data
        for hook in self._pre_hooks:
            result = hook(result)
        return result
    
    def _run_post_hooks(self, result: ProcessingResult) -> ProcessingResult:
        """Execute all post-processing hooks."""
        for hook in self._post_hooks:
            hook(result)
        return result
    
    def process(self, data: Any, **kwargs) -> ProcessingResult:
        """
        Process data with full GDPR compliance.
        
        Steps:
        1. Log processing start (audit)
        2. Run pre-processing hooks
        3. Execute processing logic
        4. Run post-processing hooks
        5. Log processing completion (audit)
        """
        result = ProcessingResult(success=False, records_processed=0, records_failed=0)
        
        try:
            # Log start
            self.audit_logger.log(AuditEvent(
                action=f"{self.name}.start",
                resource_type="data_batch",
                metadata={"classification": self.classification.value}
            ))
            
            # Pre-hooks
            data = self._run_pre_hooks(data)
            
            # Process
            result = self._process(data, **kwargs)
            result.completed_at = datetime.utcnow()
            
            # Post-hooks
            result = self._run_post_hooks(result)
            
            # Log completion
            self.audit_logger.log(AuditEvent(
                action=f"{self.name}.complete",
                resource_type="data_batch",
                metadata={
                    "records_processed": result.records_processed,
                    "records_failed": result.records_failed,
                    "duration_seconds": result.duration_seconds,
                }
            ))
            
        except Exception as e:
            result.errors.append(str(e))
            result.completed_at = datetime.utcnow()
            
            self.audit_logger.log(AuditEvent(
                action=f"{self.name}.error",
                resource_type="data_batch",
                metadata={"error": str(e)}
            ))
            
            logger.exception(f"Processing failed in {self.name}")
        
        return result
    
    @abstractmethod
    def _process(self, data: Any, **kwargs) -> ProcessingResult:
        """Implement actual processing logic."""
        pass
    
    @abstractmethod
    def get_data_subject_data(self, subject_id: str) -> Dict[str, Any]:
        """
        Retrieve all data for a specific data subject.
        Implements GDPR Art. 15 - Right of access.
        """
        pass
    
    @abstractmethod
    def delete_data_subject_data(self, subject_id: str, dry_run: bool = False) -> Dict[str, Any]:
        """
        Delete all data for a specific data subject.
        Implements GDPR Art. 17 - Right to erasure.
        
        Args:
            subject_id: The data subject's unique identifier
            dry_run: If True, simulate deletion without actually deleting
        
        Returns:
            Dict with deletion results and any retention exemptions
        """
        pass


class DonationProcessor(DataProcessor):
    """Process donation records with financial compliance."""
    
    def __init__(self, audit_logger: Optional[AuditLogger] = None):
        super().__init__(
            name="donation_processor",
            classification=DataClassification.CONFIDENTIAL,
            audit_logger=audit_logger,
        )
    
    def _process(self, donations: List[Dict], **kwargs) -> ProcessingResult:
        """Process donation records."""
        result = ProcessingResult(
            success=True,
            records_processed=0,
            records_failed=0,
        )
        
        for donation in donations:
            try:
                # Validate required fields
                self._validate_donation(donation)
                
                # Apply data transformations
                processed = self._transform_donation(donation)
                
                # Store processed record
                self._store_donation(processed)
                
                result.records_processed += 1
                
            except Exception as e:
                result.records_failed += 1
                result.errors.append(f"Donation {donation.get('id', 'unknown')}: {str(e)}")
        
        return result
    
    def _validate_donation(self, donation: Dict) -> None:
        """Validate donation record."""
        required_fields = ["donor_id", "amount", "currency", "date"]
        for field in required_fields:
            if field not in donation:
                raise ValueError(f"Missing required field: {field}")
        
        if Decimal(donation["amount"]) <= 0:
            raise ValueError("Donation amount must be positive")
    
    def _transform_donation(self, donation: Dict) -> Dict:
        """Transform donation for storage."""
        return {
            **donation,
            "processed_at": datetime.utcnow().isoformat(),
            "processor_version": "1.0.0",
        }
    
    def _store_donation(self, donation: Dict) -> None:
        """Store processed donation (implement with actual storage)."""
        logger.info(f"Storing donation: {donation.get('id')}")
    
    def get_data_subject_data(self, subject_id: str) -> Dict[str, Any]:
        """
        Retrieve all donations for a donor.
        
        GDPR Article 15 - Right of access.
        GDPR Article 20 - Right to data portability.
        
        Returns all personal data in machine-readable format.
        """
        request_id = f"dsar-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{subject_id[:8]}"
        result = DSARResult(
            subject_id=subject_id,
            request_id=request_id,
            requested_at=datetime.utcnow(),
        )
        
        try:
            conn = get_database_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            # Fetch donations
            cursor.execute("""
                SELECT 
                    id, organization_id, amount, currency, status,
                    payment_method, transaction_id, donor_email, donor_name,
                    is_anonymous, is_recurring, frequency, gift_aid,
                    dedicated_to, message, processed_at, created_at, updated_at
                FROM apps_donation
                WHERE donor_id = %s AND is_deleted = false
                ORDER BY created_at DESC
            """, (subject_id,))
            
            donations = [dict(row) for row in cursor.fetchall()]
            
            # Convert UUID and datetime to string for JSON serialization
            for donation in donations:
                donation['id'] = str(donation['id'])
                donation['organization_id'] = str(donation['organization_id'])
                if donation.get('processed_at'):
                    donation['processed_at'] = donation['processed_at'].isoformat()
                donation['created_at'] = donation['created_at'].isoformat()
                donation['updated_at'] = donation['updated_at'].isoformat()
            
            # Fetch related organization names
            if donations:
                org_ids = [d['organization_id'] for d in donations]
                cursor.execute("""
                    SELECT id, name, country
                    FROM apps_organization
                    WHERE id = ANY(%s)
                """, (org_ids,))
                org_map = {str(row['id']): row for row in cursor.fetchall()}
                
                for donation in donations:
                    org = org_map.get(donation['organization_id'], {})
                    donation['organization_name'] = org.get('name', 'Unknown')
                    donation['organization_country'] = org.get('country', 'XX')
            
            cursor.close()
            conn.close()
            
            result.data_categories = {
                'donations': donations,
                'summary': {
                    'total_donations': len(donations),
                    'total_amount': sum(float(d['amount'] or 0) for d in donations),
                    'currencies': list(set(d['currency'] for d in donations if d.get('currency'))),
                }
            }
            result.total_records = len(donations)
            result.completed_at = datetime.utcnow()
            
            # Audit log the DSAR
            self.audit_logger.log(AuditEvent(
                action="dsar_access",
                resource_type="donation_data",
                resource_id=subject_id,
                legal_basis="GDPR Art. 15",
                metadata={
                    'request_id': request_id,
                    'records_returned': result.total_records,
                }
            ))
            
            logger.info(f"DSAR_COMPLETED: request={request_id} subject={subject_id} records={result.total_records}")
            
        except Exception as e:
            logger.exception(f"DSAR_FAILED: subject={subject_id} error={str(e)}")
            result.data_categories = {'error': str(e)}
        
        return {
            'subject_id': subject_id,
            'request_id': request_id,
            'requested_at': result.requested_at.isoformat(),
            'completed_at': result.completed_at.isoformat() if result.completed_at else None,
            'data': result.data_categories,
            'total_records': result.total_records,
        }
    
    def delete_data_subject_data(self, subject_id: str, dry_run: bool = False) -> Dict[str, Any]:
        """
        Delete all donations for a donor (with retention checks).
        
        GDPR Article 17 - Right to erasure.
        GDPR Article 17(3)(c) - Exemption for legal claims/obligations.
        
        Financial records have 7-year retention (Canon Law 1287 + legal requirement).
        """
        request_id = f"del-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{subject_id[:8]}"
        result = DeletionResult(
            subject_id=subject_id,
            request_id=request_id,
            requested_at=datetime.utcnow(),
        )
        
        try:
            conn = get_database_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            # Check for donations within retention period (7 years)
            retention_cutoff = datetime.utcnow() - timedelta(days=2555)
            
            cursor.execute("""
                SELECT id, created_at, amount, currency, status
                FROM apps_donation
                WHERE donor_id = %s AND is_deleted = false
            """, (subject_id,))
            
            all_donations = cursor.fetchall()
            
            # Separate into deletable and retention-exempt
            deletable = []
            retained = []
            
            for donation in all_donations:
                if donation['created_at'] < retention_cutoff:
                    deletable.append(donation)
                else:
                    retained.append(donation)
            
            if not dry_run:
                # Soft-delete records past retention
                if deletable:
                    deletable_ids = [d['id'] for d in deletable]
                    cursor.execute("""
                        UPDATE apps_donation
                        SET is_deleted = true,
                            deleted_at = %s,
                            donor_email = 'REDACTED@erasure.local',
                            donor_name = 'REDACTED'
                        WHERE id = ANY(%s)
                    """, (datetime.utcnow(), deletable_ids))
                    
                    result.deleted_records = len(deletable)
                
                
                # For retained records, anonymize PII but keep financial data
                if retained:
                    retained_ids = [r['id'] for r in retained]
                    cursor.execute("""
                        UPDATE apps_donation
                        SET donor_email = 'ANONYMIZED@retention.local',
                            donor_name = 'DONOR_ANONYMIZED'
                        WHERE id = ANY(%s)
                    """, (retained_ids,))
                    
                    result.retained_records = len(retained)
                    result.retention_exempt = [
                        f"Donation {r['id']}: created {r['created_at'].date()}, retained for 7-year financial record requirement"
                        for r in retained[:10]  # Limit for readability
                    ]
                
                
                conn.commit()
            else:
                # Dry run - just report what would happen
                result.deleted_records = len(deletable)
                result.retained_records = len(retained)
                result.retention_exempt = [
                    f"Would retain: Donation {r['id']} ({r['amount']} {r['currency']})"
                    for r in retained[:10]
                ]
            
            cursor.close()
            conn.close()
            
            result.completed_at = datetime.utcnow()
            
            # Audit log the deletion
            self.audit_logger.log(AuditEvent(
                action="dsar_erasure",
                resource_type="donation_data",
                resource_id=subject_id,
                legal_basis="GDPR Art. 17",
                metadata={
                    'request_id': request_id,
                    'deleted_records': result.deleted_records,
                    'retained_records': result.retained_records,
                    'dry_run': dry_run,
                }
            ))
            
            logger.info(
                f"DSAR_ERASURE: request={request_id} subject={subject_id} "
                f"deleted={result.deleted_records} retained={result.retained_records}"
            )
            
        except Exception as e:
            logger.exception(f"DSAR_ERASURE_FAILED: subject={subject_id} error={str(e)}")
            result.errors.append(str(e))
        
        return {
            'subject_id': subject_id,
            'request_id': request_id,
            'requested_at': result.requested_at.isoformat(),
            'completed_at': result.completed_at.isoformat() if result.completed_at else None,
            'deleted_records': result.deleted_records,
            'retained_records': result.retained_records,
            'retention_exempt': result.retention_exempt,
            'errors': result.errors,
            'dry_run': dry_run,
        }


class UserdataProcessor(DataProcessor):
    """Process user data with privacy compliance."""
    
    def __init__(self, audit_logger: Optional[AuditLogger] = None):
        super().__init__(
            name="userdata_processor",
            classification=DataClassification.CONFIDENTIAL,
            audit_logger=audit_logger,
        )
    
    def _process(self, users: List[Dict], **kwargs) -> ProcessingResult:
        """Process user records."""
        result = ProcessingResult(
            success=True,
            records_processed=0,
            records_failed=0,
        )
        
        for user in users:
            try:
                # Validate user data
                self._validate_user(user)
                
                # Apply privacy transformations
                processed = self._apply_privacy_rules(user)
                
                # Store
                self._store_user(processed)
                
                result.records_processed += 1
                
            except Exception as e:
                result.records_failed += 1
                result.errors.append(f"User {user.get('id', 'unknown')}: {str(e)}")
        
        return result
    
    def _validate_user(self, user: Dict) -> None:
        """Validate user record."""
        if "email" not in user:
            raise ValueError("Email is required")
    
    def _apply_privacy_rules(self, user: Dict) -> Dict:
        """Apply GDPR privacy rules."""
        # Mask sensitive fields
        if "password" in user:
            user["password"] = "***REDACTED***"
        
        if "ip_address" in user and not user.get("consent_analytics"):
            user["ip_address"] = self._mask_ip(user["ip_address"])
        
        return user
    
    def _mask_ip(self, ip: str) -> str:
        """Mask IP address for privacy."""
        parts = ip.split(".")
        if len(parts) == 4:
            return f"{parts[0]}.{parts[1]}.xxx.xxx"
        return "xxx.xxx.xxx.xxx"
    
    def _store_user(self, user: Dict) -> None:
        """Store processed user."""
        logger.info(f"Storing user: {user.get('id')}")
    
    def get_data_subject_data(self, subject_id: str) -> Dict[str, Any]:
        """
        Retrieve all personal data for a user.
        
        GDPR Article 15 - Right of access.
        GDPR Article 20 - Right to data portability.
        
        Returns all personal data in machine-readable format.
        """
        request_id = f"dsar-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{subject_id[:8]}"
        result = DSARResult(
            subject_id=subject_id,
            request_id=request_id,
            requested_at=datetime.utcnow(),
        )
        
        try:
            conn = get_database_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            # Fetch user profile
            cursor.execute("""
                SELECT 
                    id, email, first_name, last_name, role, country,
                    preferred_language, timezone, is_active, is_staff, is_superuser,
                    mfa_enabled, gdpr_consent, marketing_consent,
                    created_at, updated_at, last_login
                FROM users_user
                WHERE id = %s
            """, (subject_id,))
            
            user_row = cursor.fetchone()
            
            if user_row:
                user_data = dict(user_row)
                user_data['id'] = str(user_data['id'])
                user_data['created_at'] = user_data['created_at'].isoformat() if user_data.get('created_at') else None
                user_data['updated_at'] = user_data['updated_at'].isoformat() if user_data.get('updated_at') else None
                user_data['last_login'] = user_data['last_login'].isoformat() if user_data.get('last_login') else None
            else:
                user_data = None
            
            # Fetch organization memberships
            cursor.execute("""
                SELECT
                    om.organization_id, om.role, om.joined_at,
                    o.name as organization_name, o.country as organization_country
                FROM apps_organizationmember om
                JOIN apps_organization o ON o.id = om.organization_id
                WHERE om.user_id = %s AND om.is_deleted = false
            """, (subject_id,))
            
            memberships = [dict(row) for row in cursor.fetchall()]
            for m in memberships:
                m['organization_id'] = str(m['organization_id'])
                m['joined_at'] = m['joined_at'].isoformat() if m.get('joined_at') else None
            
            cursor.close()
            conn.close()
            
            result.data_categories = {
                'profile': user_data,
                'organization_memberships': memberships,
                'summary': {
                    'total_organizations': len(memberships),
                    'roles': list(set(m['role'] for m in memberships)),
                }
            }
            result.total_records = 1 + len(memberships)
            result.completed_at = datetime.utcnow()
            
            # Audit log the DSAR
            self.audit_logger.log(AuditEvent(
                action="dsar_access",
                resource_type="user_data",
                resource_id=subject_id,
                legal_basis="GDPR Art. 15",
                metadata={
                    'request_id': request_id,
                    'records_returned': result.total_records,
                }
            ))
            
            logger.info(f"DSAR_COMPLETED: request={request_id} subject={subject_id} records={result.total_records}")
            
        except Exception as e:
            logger.exception(f"DSAR_FAILED: subject={subject_id} error={str(e)}")
            result.data_categories = {'error': str(e)}
        
        return {
            'subject_id': subject_id,
            'request_id': request_id,
            'requested_at': result.requested_at.isoformat(),
            'completed_at': result.completed_at.isoformat() if result.completed_at else None,
            'data': result.data_categories,
            'total_records': result.total_records,
        }
    
    def delete_data_subject_data(self, subject_id: str, dry_run: bool = False) -> Dict[str, Any]:
        """
        Delete user data (right to erasure).
        
        GDPR Article 17 - Right to erasure.
        GDPR Article 17(3)(a) - Exemption for legal obligations.
        
        User data retention: 2 years (GDPR Art. 5(1)(e)).
        """
        request_id = f"del-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{subject_id[:8]}"
        result = DeletionResult(
            subject_id=subject_id,
            request_id=request_id,
            requested_at=datetime.utcnow(),
        )
        
        try:
            conn = get_database_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            # Check for legal holds or active organization memberships
            cursor.execute("""
                SELECT COUNT(*) as count
                FROM apps_organizationmember
                WHERE user_id = %s AND is_deleted = false
            """, (subject_id,))
            
            membership_count = cursor.fetchone()['count']
            
            if membership_count > 0:
                # Cannot delete - user has active memberships
                result.retained_records = membership_count
                result.retention_exempt.append(
                    f"User has {membership_count} active organization memberships. "
                    "Remove memberships before deletion or transfer ownership."
                )
                result.errors.append("ACTIVE_MEMBERSHIPS: Transfer ownership or remove memberships first.")
            else:
                if not dry_run:
                    # Soft-delete user account
                    cursor.execute("""
                        UPDATE users_user
                        SET is_deleted = true,
                            is_active = false,
                            deleted_at = %s,
                            email = %s,
                            name = 'REDACTED'
                        WHERE id = %s
                    """, (datetime.utcnow(), f'deleted-{subject_id[:8]}@erasure.local', subject_id))
                    
                    result.deleted_records = 1
                    conn.commit()
                else:
                    result.deleted_records = 1
            
            cursor.close()
            conn.close()
            
            result.completed_at = datetime.utcnow()
            
            # Audit log the deletion
            self.audit_logger.log(AuditEvent(
                action="dsar_erasure",
                resource_type="user_data",
                resource_id=subject_id,
                legal_basis="GDPR Art. 17",
                metadata={
                    'request_id': request_id,
                    'deleted_records': result.deleted_records,
                    'retained_records': result.retained_records,
                    'dry_run': dry_run,
                }
            ))
            
            logger.info(
                f"DSAR_ERASURE: request={request_id} subject={subject_id} "
                f"deleted={result.deleted_records} retained={result.retained_records}"
            )
            
        except Exception as e:
            logger.exception(f"DSAR_ERASURE_FAILED: subject={subject_id} error={str(e)}")
            result.errors.append(str(e))
        
        return {
            'subject_id': subject_id,
            'request_id': request_id,
            'requested_at': result.requested_at.isoformat(),
            'completed_at': result.completed_at.isoformat() if result.completed_at else None,
            'deleted_records': result.deleted_records,
            'retained_records': result.retained_records,
            'retention_exempt': result.retention_exempt,
            'errors': result.errors,
            'dry_run': dry_run,
        }
