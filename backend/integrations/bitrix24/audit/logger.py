"""
Compliance Audit Logger for Bitrix24 SDK
Provides tamper-evident audit logging for GDPR and PCI-DSS compliance.

Features:
- Hash chain for tamper detection
- Timestamp anchoring
- GDPR Art. 30 compliance
- PCI-DSS Requirement 10 compliance
"""

import hashlib
import json
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


@dataclass
class AuditEntry:
    """A single audit log entry."""
    id: str
    timestamp: str
    event_type: str
    entity_type: str
    entity_id: str
    operation: str
    status: str
    details: Dict[str, Any]
    previous_hash: str
    hash: str
    actor: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "id": self.id,
            "timestamp": self.timestamp,
            "event_type": self.event_type,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "operation": self.operation,
            "status": self.status,
            "details": self.details,
            "previous_hash": self.previous_hash,
            "hash": self.hash,
            "actor": self.actor,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
        }


class ComplianceAuditLogger:
    """
    Tamper-evident audit logger for GDPR and PCI-DSS compliance.
    
    Uses hash chain to detect tampering:
    - Each entry includes hash of previous entry
    - Hash covers all fields including previous hash
    - Periodic anchoring to detect chain manipulation
    
    Usage:
        logger = ComplianceAuditLogger()
        await logger.log_financial_transaction(
            transaction_type="donation",
            entity_id="deal-123",
            amount=100.00,
            currency="EUR",
        )
    """
    
    # Anchoring interval - create anchor every N entries
    ANCHOR_INTERVAL = 1000
    
    def __init__(self):
        self._entries: List[AuditEntry] = []
        self._last_hash = "0" * 64  # Genesis block
        self._entry_count = 0
        self._anchors: List[Dict[str, Any]] = []
    
    @property
    def last_hash(self) -> str:
        """Get the hash of the last entry."""
        return self._last_hash
    
    @property
    def entry_count(self) -> int:
        """Get the total number of entries."""
        return self._entry_count
    
    def _generate_hash(self, entry_data: Dict[str, Any]) -> str:
        """Generate SHA-256 hash of entry data."""
        # Sort keys for consistent hashing
        canonical = json.dumps(entry_data, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(canonical.encode("utf-8")).hexdigest()
    
    def _create_entry(
        self,
        event_type: str,
        entity_type: str,
        entity_id: str,
        operation: str,
        status: str,
        details: Dict[str, Any],
        actor: Optional[str] = None,
    ) -> AuditEntry:
        """Create a new audit entry."""
        timestamp = datetime.now(timezone.utc).isoformat()
        entry_id = f"{self._entry_count:08d}-{timestamp}"
        
        entry_data = {
            "id": entry_id,
            "timestamp": timestamp,
            "event_type": event_type,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "operation": operation,
            "status": status,
            "details": details,
            "previous_hash": self._last_hash,
        }
        
        entry_hash = self._generate_hash(entry_data)
        
        entry = AuditEntry(
            id=entry_id,
            timestamp=timestamp,
            event_type=event_type,
            entity_type=entity_type,
            entity_id=entity_id,
            operation=operation,
            status=status,
            details=details,
            previous_hash=self._last_hash,
            hash=entry_hash,
            actor=actor,
        )
        
        self._entries.append(entry)
        self._last_hash = entry_hash
        self._entry_count += 1
        
        # Check if we need to create an anchor
        if self._entry_count % self.ANCHOR_INTERVAL == 0:
            self._create_anchor()
        
        return entry
    
    def _create_anchor(self):
        """Create an anchor point in the hash chain."""
        anchor = {
            "sequence": len(self._anchors),
            "entry_count": self._entry_count,
            "last_hash": self._last_hash,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "entry_ids": [e.id for e in self._entries[-self.ANCHOR_INTERVAL:]],
        }
        
        # Hash the anchor itself
        anchor["hash"] = self._generate_hash({
            "sequence": anchor["sequence"],
            "entry_count": anchor["entry_count"],
            "last_hash": anchor["last_hash"],
            "timestamp": anchor["timestamp"],
        })
        
        self._anchors.append(anchor)
        
        logger.info(f"Created audit anchor #{anchor['sequence']} at entry {self._entry_count}")
    
    async def log_api_call(
        self,
        method: str,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        status: str = "success",
        error: Optional[str] = None,
    ) -> AuditEntry:
        """Log an API call to Bitrix24."""
        details = {"method": method}
        if error:
            details["error"] = error
        
        return self._create_entry(
            event_type="api_call",
            entity_type=entity_type or "api",
            entity_id=entity_id or "n/a",
            operation=method,
            status=status,
            details=details,
        )
    
    async def log_data_operation(
        self,
        operation: str,
        entity_type: str,
        entity_id: str,
        status: str = "success",
        details: Optional[Dict[str, Any]] = None,
        actor: Optional[str] = None,
    ) -> AuditEntry:
        """
        Log a data operation (GDPR Art. 30).
        
        Args:
            operation: Type of operation (create, read, update, delete)
            entity_type: Type of entity (contact, deal, event)
            entity_id: ID of the entity
            status: Operation status (success, failed)
            details: Additional operation details
            actor: User or system performing the operation
        """
        entry = self._create_entry(
            event_type="data_operation",
            entity_type=entity_type,
            entity_id=entity_id,
            operation=operation,
            status=status,
            details=details or {},
            actor=actor,
        )
        
        # Log for GDPR compliance
        logger.info(
            f"[AUDIT] {operation} on {entity_type}:{entity_id} "
            f"by {actor or 'system'} - {status}"
        )
        
        return entry
    
    async def log_financial_transaction(
        self,
        transaction_type: str,
        entity_type: str,
        entity_id: str,
        amount: float,
        currency: str,
        payment_method: str,
        status: str = "success",
        details: Optional[Dict[str, Any]] = None,
    ) -> AuditEntry:
        """
        Log a financial transaction (PCI-DSS Requirement 10).
        
        All financial transactions must be logged for PCI-DSS compliance.
        Logs must be retained for at least 1 year.
        
        Args:
            transaction_type: Type (donation, refund, payment)
            entity_type: Related entity type
            entity_id: Related entity ID
            amount: Transaction amount
            currency: Currency code
            payment_method: Payment method used
            status: Transaction status
            details: Additional transaction details
        """
        transaction_details = {
            "amount": amount,
            "currency": currency,
            "payment_method": payment_method,
            **(details or {}),
        }
        
        entry = self._create_entry(
            event_type="financial_transaction",
            entity_type=entity_type,
            entity_id=entity_id,
            operation=transaction_type,
            status=status,
            details=transaction_details,
        )
        
        # Critical log for PCI-DSS
        logger.info(
            f"[PCI-DSS AUDIT] {transaction_type}: {currency}{amount} "
            f"via {payment_method} - {entity_type}:{entity_id} - {status}"
        )
        
        return entry
    
    async def log_gdpr_request(
        self,
        request_type: str,
        data_subject_id: str,
        status: str,
        details: Optional[Dict[str, Any]] = None,
    ) -> AuditEntry:
        """
        Log a GDPR data subject request.
        
        Args:
            request_type: Type of request (access, rectification, erasure, portability)
            data_subject_id: ID of the data subject
            status: Request status
            details: Additional request details
        """
        entry = self._create_entry(
            event_type="gdpr_request",
            entity_type="data_subject",
            entity_id=data_subject_id,
            operation=request_type,
            status=status,
            details=details or {},
        )
        
        logger.info(
            f"[GDPR] {request_type} request from {data_subject_id} - {status}"
        )
        
        return entry
    
    async def log_consent_change(
        self,
        contact_id: str,
        consent_type: str,
        granted: bool,
        details: Optional[Dict[str, Any]] = None,
    ) -> AuditEntry:
        """
        Log a consent change (GDPR Art. 7).
        
        Args:
            contact_id: ID of the contact
            consent_type: Type of consent (marketing, processing, etc.)
            granted: Whether consent was granted or withdrawn
            details: Additional consent details
        """
        consent_details = {
            "consent_type": consent_type,
            "granted": granted,
            **(details or {}),
        }
        
        entry = self._create_entry(
            event_type="consent_change",
            entity_type="contact",
            entity_id=contact_id,
            operation="consent_granted" if granted else "consent_withdrawn",
            status="success",
            details=consent_details,
        )
        
        logger.info(
            f"[GDPR] Consent {consent_type} {'granted' if granted else 'withdrawn'} "
            f"for contact {contact_id}"
        )
        
        return entry
    
    def verify_chain(self) -> Dict[str, Any]:
        """
        Verify the integrity of the hash chain.
        
        Returns:
            Dict with verification results
        """
        errors = []
        
        for i, entry in enumerate(self._entries):
            # Verify hash
            entry_data = {
                "id": entry.id,
                "timestamp": entry.timestamp,
                "event_type": entry.event_type,
                "entity_type": entry.entity_type,
                "entity_id": entry.entity_id,
                "operation": entry.operation,
                "status": entry.status,
                "details": entry.details,
                "previous_hash": entry.previous_hash,
            }
            
            expected_hash = self._generate_hash(entry_data)
            if entry.hash != expected_hash:
                errors.append({
                    "entry_id": entry.id,
                    "error": "hash_mismatch",
                    "expected": expected_hash,
                    "actual": entry.hash,
                })
            
            # Verify chain link
            if i > 0 and entry.previous_hash != self._entries[i - 1].hash:
                errors.append({
                    "entry_id": entry.id,
                    "error": "chain_broken",
                    "expected_previous": self._entries[i - 1].hash,
                    "actual_previous": entry.previous_hash,
                })
        
        return {
            "valid": len(errors) == 0,
            "entry_count": self._entry_count,
            "anchor_count": len(self._anchors),
            "last_hash": self._last_hash,
            "errors": errors,
        }
    
    def export_entries(
        self,
        start: Optional[int] = None,
        end: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """Export entries for archival or analysis."""
        entries = self._entries[start:end]
        return [e.to_dict() for e in entries]
    
    def get_entries_by_entity(
        self,
        entity_type: str,
        entity_id: str,
    ) -> List[AuditEntry]:
        """Get all entries for a specific entity."""
        return [
            e for e in self._entries
            if e.entity_type == entity_type and e.entity_id == entity_id
        ]
    
    def get_entries_by_type(
        self,
        event_type: str,
        limit: int = 100,
    ) -> List[AuditEntry]:
        """Get entries by event type."""
        entries = [e for e in self._entries if e.event_type == event_type]
        return entries[-limit:]
