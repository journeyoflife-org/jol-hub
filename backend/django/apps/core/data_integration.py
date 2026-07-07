"""
Data Module Integration for Django Backend.

This module provides a clean integration layer between the Django backend
and the data module (data/src), handling import path resolution and
providing Django-specific adapters.

GDPR Compliance:
- Article 15 - Right of access (DSAR)
- Article 17 - Right to erasure
- Article 20 - Right to data portability
- Article 30 - Records of processing activities

SOC2 CC6.1 - Logical and physical access controls.
ISO 27001 A.12.4.1 - Event logging.
"""

import logging
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

from django.conf import settings

logger = logging.getLogger(__name__)

# Add data module to Python path if not already present
_DATA_MODULE_PATH = Path(settings.BASE_DIR).parent.parent / "data" / "src"
if str(_DATA_MODULE_PATH) not in sys.path:
    sys.path.insert(0, str(_DATA_MODULE_PATH))


class DataModuleIntegration:
    """
    Central integration point for data module services.
    
    Provides lazy loading and graceful degradation when data module
    components are unavailable.
    
    Usage:
        integration = DataModuleIntegration()
        
        # K-anonymity for analytics
        anonymizer = integration.get_anonymizer(country_code='lt')
        safe_data = anonymizer.anonymize(user_data)
        
        # Retention management
        retention = integration.get_retention_manager()
        result = retention.delete_subject_data(subject_id)
        
        # Audit logging
        audit = integration.get_audit_logger()
        audit.log_gdpr_request('access', subject_id, 'user')
    """
    
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if DataModuleIntegration._initialized:
            return
            
        self._anonymizer = None
        self._retention_manager = None
        self._audit_logger = None
        self._dsar_service = None
        self._encryption_service = None
        
        DataModuleIntegration._initialized = True
    
    # -------------------------------------------------------------------------
    # GDPR K-Anonymity
    # -------------------------------------------------------------------------
    
    def get_anonymizer(
        self,
        k: Optional[int] = None,
        country_code: Optional[str] = None,
    ):
        """
        Get k-anonymizer instance with country-specific defaults.
        
        GDPR Art. 8(1) - Member states may set specific protections.
        
        Args:
            k: Minimum group size (overrides country default)
            country_code: ISO 3166-1 alpha-2 code (lt, lv, ee, etc.)
            
        Returns:
            KAnonymizer instance or None if unavailable
        """
        try:
            from gdpr import KAnonymizer, AnonymizationConfig
            
            config = AnonymizationConfig(k=k, country_code=country_code)
            return KAnonymizer(config=config)
        except ImportError as e:
            logger.warning(f"KAnonymizer unavailable: {e}")
            return None
    
    def anonymize_data(
        self,
        records: List[Dict[str, Any]],
        country_code: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Anonymize records using k-anonymity.
        
        Convenience method for quick anonymization.
        
        Args:
            records: List of records to anonymize
            country_code: Country for k-value lookup
            
        Returns:
            Anonymized records (or original if anonymizer unavailable)
        """
        try:
            from gdpr import k_anonymize
            return k_anonymize(records, country_code=country_code)
        except ImportError:
            logger.warning("k_anonymize unavailable, returning original records")
            return records
    
    # -------------------------------------------------------------------------
    # Retention Management
    # -------------------------------------------------------------------------
    
    def get_retention_manager(self):
        """
        Get retention manager for GDPR-compliant data lifecycle.
        
        GDPR Art. 5(1)(e) - Storage limitation principle.
        GDPR Art. 17(3)(e) - Legal hold exemption.
        
        Returns:
            RetentionManager instance or None if unavailable
        """
        if self._retention_manager is None:
            try:
                from gdpr import RetentionManager
                from audit import AuditLogger
                
                audit_logger = self.get_audit_logger()
                self._retention_manager = RetentionManager(audit_logger=audit_logger)
            except ImportError as e:
                logger.warning(f"RetentionManager unavailable: {e}")
                
        return self._retention_manager
    
    def check_legal_hold(self, subject_id: str) -> Dict[str, Any]:
        """
        Check if subject has active legal holds.
        
        CRITICAL: Must be called before any deletion operation.
        
        GDPR Art. 17(3)(e) - Erasure does not apply for legal claims.
        
        Args:
            subject_id: Data subject identifier
            
        Returns:
            Dict with 'has_holds', 'hold_count', 'allowed' keys
        """
        try:
            from gdpr.retention_manager import get_legal_hold_registry
            
            registry = get_legal_hold_registry()
            
            if registry.has_legal_hold(subject_id):
                details = registry.get_hold_details(subject_id)
                return {
                    'has_holds': True,
                    'hold_count': details.get('hold_count', 0),
                    'allowed': False,
                    'details': details,
                }
            
            return {
                'has_holds': False,
                'hold_count': 0,
                'allowed': True,
            }
            
        except ImportError:
            logger.warning("Legal hold registry unavailable")
            return {
                'has_holds': False,
                'hold_count': 0,
                'allowed': True,
                'note': 'Registry unavailable - proceed with caution',
            }
    
    # -------------------------------------------------------------------------
    # Audit Logging
    # -------------------------------------------------------------------------
    
    def get_audit_logger(self):
        """
        Get audit logger for compliance tracking.
        
        SOC2 CC6.1 - Access controls and logging.
        ISO 27001 A.12.4.1 - Event logging.
        
        Returns:
            AuditLogger instance or None if unavailable
        """
        if self._audit_logger is None:
            try:
                from audit import AuditLogger
                self._audit_logger = AuditLogger()
            except ImportError as e:
                logger.warning(f"AuditLogger unavailable: {e}")
                
        return self._audit_logger
    
    def log_gdpr_request(
        self,
        request_type: str,
        subject_id: str,
        actor: str,
        details: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """
        Log a GDPR request for compliance tracking.
        
        Args:
            request_type: 'access', 'erasure', 'portability', etc.
            subject_id: Data subject identifier
            actor: Who initiated the request
            details: Additional request details
            
        Returns:
            True if logged successfully, False otherwise
        """
        audit_logger = self.get_audit_logger()
        
        if audit_logger is None:
            logger.info(
                f"GDPR_REQUEST: type={request_type} subject={subject_id} "
                f"actor={actor} details={details}"
            )
            return False
        
        try:
            audit_logger.log_gdpr_request(
                request_type=request_type,
                data_subject_id=subject_id,
                actor=actor,
                details=details or {},
            )
            return True
        except Exception as e:
            logger.error(f"Failed to log GDPR request: {e}")
            return False
    
    # -------------------------------------------------------------------------
    # DSAR Service
    # -------------------------------------------------------------------------
    
    def get_dsar_service(self):
        """
        Get DSAR service for handling data subject requests.
        
        GDPR Art. 15 - Right of access.
        GDPR Art. 17 - Right to erasure.
        GDPR Art. 20 - Right to portability.
        
        Returns:
            DSARService instance or None if unavailable
        """
        if self._dsar_service is None:
            try:
                from dsar_service import DSARService
                audit_logger = self.get_audit_logger()
                self._dsar_service = DSARService(audit_logger=audit_logger)
            except ImportError as e:
                logger.warning(f"DSARService unavailable: {e}")
                
        return self._dsar_service
    
    def handle_data_access_request(self, subject_id: str) -> Dict[str, Any]:
        """
        Handle a data subject access request (GDPR Art. 15).
        
        Args:
            subject_id: Data subject identifier
            
        Returns:
            Complete data export or error response
        """
        try:
            from dsar_service import handle_dsar_access
            return handle_dsar_access(subject_id)
        except ImportError:
            return {
                'error': 'DSAR service unavailable',
                'subject_id': subject_id,
                'status': 'service_unavailable',
            }
    
    def handle_data_erasure_request(
        self,
        subject_id: str,
        dry_run: bool = False,
    ) -> Dict[str, Any]:
        """
        Handle a data subject erasure request (GDPR Art. 17).
        
        CRITICAL: Checks for legal holds before proceeding.
        
        Args:
            subject_id: Data subject identifier
            dry_run: If True, simulate without actual deletion
            
        Returns:
            Deletion result or error response
        """
        # Check legal holds first
        hold_status = self.check_legal_hold(subject_id)
        
        if hold_status['has_holds']:
            return {
                'error': 'LEGAL_HOLD_ACTIVE',
                'subject_id': subject_id,
                'status': 'blocked',
                'hold_count': hold_status['hold_count'],
                'legal_basis': 'GDPR Art. 17(3)(e)',
            }
        
        try:
            from dsar_service import handle_dsar_erasure
            return handle_dsar_erasure(subject_id, dry_run=dry_run)
        except ImportError:
            return {
                'error': 'DSAR service unavailable',
                'subject_id': subject_id,
                'status': 'service_unavailable',
            }
    
    # -------------------------------------------------------------------------
    # Encryption
    # -------------------------------------------------------------------------
    
    def get_encryption_service(self):
        """
        Get encryption service for PII protection.
        
        ISO 27001 A.10.1.2 - Cryptographic controls.
        SOC2 CC6.1 - Protection of sensitive data.
        
        Returns:
            EncryptionService instance or None if unavailable
        """
        if self._encryption_service is None:
            try:
                from encryption import get_encryption_service
                self._encryption_service = get_encryption_service()
            except ImportError as e:
                logger.warning(f"EncryptionService unavailable: {e}")
                
        return self._encryption_service
    
    def encrypt_pii(self, plaintext: str) -> Optional[str]:
        """
        Encrypt PII data.
        
        Args:
            plaintext: Data to encrypt
            
        Returns:
            Encrypted data or None if encryption unavailable
        """
        try:
            from encryption import encrypt
            return encrypt(plaintext)
        except ImportError:
            logger.warning("Encryption unavailable")
            return None
    
    def decrypt_pii(self, ciphertext: str) -> Optional[str]:
        """
        Decrypt PII data.
        
        Args:
            ciphertext: Data to decrypt
            
        Returns:
            Decrypted data or None if decryption unavailable
        """
        try:
            from encryption import decrypt
            return decrypt(ciphertext)
        except ImportError:
            logger.warning("Decryption unavailable")
            return None


# Singleton instance for convenience
_integration: Optional[DataModuleIntegration] = None


def get_data_integration() -> DataModuleIntegration:
    """Get the singleton data module integration instance."""
    global _integration
    if _integration is None:
        _integration = DataModuleIntegration()
    return _integration


# Convenience functions for common operations
def anonymize_for_analytics(
    records: List[Dict[str, Any]],
    country_code: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Anonymize records for analytics dashboard.
    
    GDPR-compliant k-anonymity for admin dashboard queries.
    """
    return get_data_integration().anonymize_data(records, country_code)


def check_deletion_allowed(subject_id: str) -> Dict[str, Any]:
    """
    Check if deletion is allowed for a data subject.
    
    Pre-check before any deletion operation.
    """
    return get_data_integration().check_legal_hold(subject_id)


def log_gdpr_event(
    event_type: str,
    subject_id: str,
    actor: str,
    details: Optional[Dict[str, Any]] = None,
) -> bool:
    """Log a GDPR-related event for compliance tracking."""
    return get_data_integration().log_gdpr_request(
        event_type, subject_id, actor, details
    )
