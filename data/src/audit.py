"""
Audit Logging Module
GDPR Article 30 - Records of Processing Activities

Provides comprehensive audit logging for all data processing operations.
"""

import json
import logging
import os
import hmac
import secrets
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple
from pathlib import Path
import hashlib

# SOC2 CC7.2, ISO 27001 A.12.4.2 - Audit log integrity constants
HASH_ALGORITHM = 'sha256'
SIGNATURE_ALGORITHM = 'sha256'
GENESIS_PREV_HASH = '0' * 64  # Genesis block has all-zero previous hash


logger = logging.getLogger(__name__)


class AuditAction(Enum):
    """Standard audit action types."""
    # Data operations
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    
    # Processing operations
    PROCESS_START = "process_start"
    PROCESS_COMPLETE = "process_complete"
    PROCESS_ERROR = "process_error"
    
    # GDPR-specific
    DATA_SUBJECT_ACCESS = "data_subject_access"      # Art. 15
    DATA_SUBJECT_ERASURE = "data_subject_erasure"    # Art. 17
    DATA_SUBJECT_PORTABILITY = "data_subject_portability"  # Art. 20
    DATA_SUBJECT_RECTIFICATION = "data_subject_rectification"  # Art. 16
    DATA_SUBJECT_RESTRICTION = "data_subject_restriction"  # Art. 18
    
    # Consent management
    CONSENT_GRANTED = "consent_granted"
    CONSENT_WITHDRAWN = "consent_withdrawn"
    
    # Security events
    ACCESS_GRANTED = "access_granted"
    ACCESS_REVOKED = "access_revoked"
    AUTHENTICATION_SUCCESS = "authentication_success"
    AUTHENTICATION_FAILURE = "authentication_failure"
    
    # Data transfer
    DATA_EXPORT = "data_export"
    DATA_IMPORT = "data_import"
    THIRD_PARTY_TRANSFER = "third_party_transfer"


@dataclass
class AuditEvent:
    """
    A single audit event record.
    
    GDPR Article 30(1)(c) requires recording:
    - Name and contact details of controller
    - Purposes of processing
    - Description of categories of data subjects and personal data
    - Categories of recipients
    - Transfers to third countries
    - Retention periods
    - Security measures
    
    SOC2 CC7.2, ISO 27001 A.12.4.2 - Integrity protection:
    - Hash chain linking to previous event
    - HMAC signature for tamper detection
    - Sequence number for ordering verification
    """
    action: str
    resource_type: str
    timestamp: datetime = field(default_factory=datetime.utcnow)
    actor: str = "system"
    actor_ip: Optional[str] = None
    resource_id: Optional[str] = None
    resource_name: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    # GDPR compliance fields
    legal_basis: Optional[str] = None
    data_categories: List[str] = field(default_factory=list)
    retention_period_days: Optional[int] = None
    
    # SOC2 CC7.2, ISO 27001 A.12.4.2 - Integrity fields
    sequence_number: int = 0
    prev_hash: str = GENESIS_PREV_HASH
    event_hash: Optional[str] = None
    signature: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "action": self.action,
            "resource_type": self.resource_type,
            "timestamp": self.timestamp.isoformat(),
            "actor": self.actor,
            "actor_ip": self.actor_ip,
            "resource_id": self.resource_id,
            "resource_name": self.resource_name,
            "metadata": self.metadata,
            "legal_basis": self.legal_basis,
            "data_categories": self.data_categories,
            "retention_period_days": self.retention_period_days,
            "sequence_number": self.sequence_number,
            "prev_hash": self.prev_hash,
            "event_hash": self.event_hash,
            "signature": self.signature,
        }
    
    def to_json(self) -> str:
        """Convert to JSON string."""
        return json.dumps(self.to_dict())
    
    @property
    def event_id(self) -> str:
        """Generate unique event ID based on content hash."""
        content = f"{self.action}{self.timestamp.isoformat()}{self.resource_type}{self.resource_id}"
        return hashlib.sha256(content.encode()).hexdigest()[:16]
    
    def compute_hash(self) -> str:
        """
        SOC2 CC7.2, ISO 27001 A.12.4.2 - Compute event hash for chain integrity.
        
        The hash includes all event data plus the previous event's hash,
        creating an immutable chain where any tampering breaks the chain.
        """
        # Create canonical representation for hashing (exclude signature to prevent circular dependency)
        hash_payload = {
            "action": self.action,
            "resource_type": self.resource_type,
            "timestamp": self.timestamp.isoformat() if isinstance(self.timestamp, datetime) else self.timestamp,
            "actor": self.actor,
            "actor_ip": self.actor_ip,
            "resource_id": self.resource_id,
            "resource_name": self.resource_name,
            "metadata": self.metadata,
            "legal_basis": self.legal_basis,
            "data_categories": self.data_categories,
            "retention_period_days": self.retention_period_days,
            "sequence_number": self.sequence_number,
            "prev_hash": self.prev_hash,
        }
        canonical = json.dumps(hash_payload, sort_keys=True, separators=(',', ':'))
        return hashlib.sha256(canonical.encode()).hexdigest()
    
    def compute_signature(self, secret_key: bytes) -> str:
        """
        SOC2 CC7.2, ISO 27001 A.12.4.2 - Compute HMAC signature for tamper detection.
        
        Uses HMAC-SHA256 with a secret key known only to the logging system.
        This ensures that even if an attacker modifies logs, they cannot forge valid signatures.
        """
        if self.event_hash is None:
            self.event_hash = self.compute_hash()
        return hmac.new(secret_key, self.event_hash.encode(), hashlib.sha256).hexdigest()
    
    def seal(self, prev_hash: str, sequence_number: int, secret_key: bytes) -> 'AuditEvent':
        """
        Seal the event with hash chain and signature.
        
        This makes the event immutable - any modification will break the chain.
        
        Args:
            prev_hash: Hash of the previous event in the chain
            sequence_number: Monotonically increasing sequence number
            secret_key: HMAC signing key
            
        Returns:
            self (for method chaining)
        """
        self.prev_hash = prev_hash
        self.sequence_number = sequence_number
        self.event_hash = self.compute_hash()
        self.signature = self.compute_signature(secret_key)
        return self
    
    def verify_hash(self) -> bool:
        """Verify that the event hash is consistent with its content."""
        if not self.event_hash:
            return False
        return self.compute_hash() == self.event_hash
    
    def verify_signature(self, secret_key: bytes) -> bool:
        """Verify the HMAC signature of this event."""
        if not self.signature or not self.event_hash:
            return False
        expected = self.compute_signature(secret_key)
        return hmac.compare_digest(self.signature, expected)


class AuditLogger:
    """
    GDPR-compliant audit logger with integrity protection.
    
    SOC2 CC7.2, ISO 27001 A.12.4.2 - Audit log integrity:
    - Hash chain linking all events (blockchain-style)
    - HMAC signatures for tamper detection
    - Sequence numbers for ordering verification
    - Chain verification for forensic integrity
    
    Features:
    - Writes to append-only log files
    - Supports structured JSON output
    - Includes all required GDPR fields
    - Automatic rotation and archival
    """
    
    # Chain state file name
    CHAIN_STATE_FILE = "chain-state.json"
    
    def __init__(
        self,
        log_dir: Optional[str] = None,
        app_name: str = "jol-hub-data",
        retention_days: int = 90,
        secret_key: Optional[bytes] = None,
    ):
        self.log_dir = Path(log_dir or os.environ.get("AUDIT_LOG_DIR", "/var/log/jol-hub/audit"))
        self.app_name = app_name
        self.retention_days = retention_days
        
        # SOC2 CC7.2, ISO 27001 A.12.4.2 - Secret key for HMAC signatures
        # Load from environment or generate a new one
        if secret_key:
            self._secret_key = secret_key
        else:
            env_key = os.environ.get("AUDIT_LOG_SECRET_KEY")
            if env_key:
                self._secret_key = env_key.encode() if isinstance(env_key, str) else env_key
            else:
                # Generate a persistent key stored in the log directory
                self._secret_key = self._load_or_generate_secret_key()
        
        
        # Ensure log directory exists
        try:
            self.log_dir.mkdir(parents=True, exist_ok=True)
        except PermissionError:
            # Use temp directory if default is not writable
            import tempfile
            self.log_dir = Path(tempfile.gettempdir()) / "jol-hub" / "audit"
            self.log_dir.mkdir(parents=True, exist_ok=True)
        
        
        # Current log file
        self._current_log_file = None
        self._log_date = None
        
        # SOC2 CC7.2, ISO 27001 A.12.4.2 - Chain state
        self._chain_state = self._load_chain_state()
    
    def _load_or_generate_secret_key(self) -> bytes:
        """Load or generate HMAC signing key for audit log integrity."""
        key_file = self.log_dir / ".audit-key"
        
        if key_file.exists():
            try:
                return key_file.read_bytes()
            except Exception:
                pass
        
        # Generate new key
        key = secrets.token_bytes(32)
        try:
            self.log_dir.mkdir(parents=True, exist_ok=True)
            key_file.write_bytes(key)
            # Set restrictive permissions (readable only by owner)
            os.chmod(key_file, 0o400)
        except Exception:
            # If we can't persist the key, use an in-memory one
            pass
        return key
    
    def _load_chain_state(self) -> Dict[str, Any]:
        """
        SOC2 CC7.2, ISO 27001 A.12.4.2 - Load chain state for continuity.
        
        Chain state includes:
        - Last event hash (for linking next event)
        - Last sequence number (for monotonically increasing IDs)
        """
        state_file = self.log_dir / self.CHAIN_STATE_FILE
        
        if state_file.exists():
            try:
                return json.loads(state_file.read_text())
            except Exception:
                pass
        
        # Initialize new chain state
        return {
            "last_hash": GENESIS_PREV_HASH,
            "last_sequence": 0,
            "chain_id": secrets.token_hex(16),
            "created_at": datetime.utcnow().isoformat(),
        }
    
    def _save_chain_state(self) -> None:
        """Persist chain state for next session."""
        state_file = self.log_dir / self.CHAIN_STATE_FILE
        try:
            state_file.write_text(json.dumps(self._chain_state, indent=2))
        except Exception as e:
            logger.warning(f"Could not save chain state: {e}")
    
    def _get_log_file(self) -> Path:
        """Get the current log file path (daily rotation)."""
        today = datetime.utcnow().date()
        
        if self._log_date != today:
            self._log_date = today
            self._current_log_file = self.log_dir / f"audit-{today.isoformat()}.jsonl"
        
        return self._current_log_file
    
    def log(self, event: AuditEvent) -> str:
        """
        Log an audit event with hash chain and signature.
        
        SOC2 CC7.2, ISO 27001 A.12.4.2 - Each event is:
        1. Linked to previous event via hash chain
        2. Signed with HMAC for tamper detection
        3. Assigned a monotonically increasing sequence number
        
        Args:
            event: The audit event to log
            
        Returns:
            The event ID
        """
        # SOC2 CC7.2, ISO 27001 A.12.4.2 - Seal event with chain integrity
        prev_hash = self._chain_state["last_hash"]
        next_sequence = self._chain_state["last_sequence"] + 1
        
        # Seal the event (adds hash chain and signature)
        event.seal(prev_hash, next_sequence, self._secret_key)
        
        # Update chain state
        self._chain_state["last_hash"] = event.event_hash
        self._chain_state["last_sequence"] = next_sequence
        self._chain_state["last_event_at"] = datetime.utcnow().isoformat()
        
        log_file = self._get_log_file()
        
        # Append to log file (append-only for integrity)
        with open(log_file, "a") as f:
            f.write(event.to_json() + "\n")
        
        # Persist chain state
        self._save_chain_state()
        
        # Also log to Python logger for real-time monitoring
        logger.info(f"AUDIT: {event.action} on {event.resource_type} by {event.actor} [seq={next_sequence}]")
        
        return event.event_id
    
    def log_data_access(
        self,
        action: str,
        resource_type: str,
        resource_id: str,
        actor: str = "system",
        legal_basis: str = None,
        data_categories: List[str] = None,
    ) -> str:
        """Convenience method for logging data access."""
        event = AuditEvent(
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            actor=actor,
            legal_basis=legal_basis,
            data_categories=data_categories or [],
        )
        return self.log(event)
    
    def log_gdpr_request(
        self,
        request_type: str,
        data_subject_id: str,
        actor: str,
        details: Dict[str, Any] = None,
    ) -> str:
        """Log a GDPR data subject request."""
        event = AuditEvent(
            action=f"gdpr_{request_type}",
            resource_type="data_subject_request",
            resource_id=data_subject_id,
            actor=actor,
            metadata=details or {},
            legal_basis="GDPR Article 15-22",
        )
        return self.log(event)
    
    def query_events(
        self,
        start_date: datetime = None,
        end_date: datetime = None,
        action: str = None,
        resource_type: str = None,
        actor: str = None,
    ) -> List[AuditEvent]:
        """
        Query audit events with filters.
        
        Useful for compliance reporting and investigations.
        """
        events = []
        
        # Determine date range to search
        if start_date and end_date:
            date_range = [(start_date + timedelta(days=i)).date() 
                          for i in range((end_date - start_date).days + 1)]
        else:
            date_range = [datetime.utcnow().date()]
        
        for date in date_range:
            log_file = self.log_dir / f"audit-{date.isoformat()}.jsonl"
            
            if not log_file.exists():
                continue
            
            with open(log_file, "r") as f:
                for line in f:
                    try:
                        data = json.loads(line)
                        event = AuditEvent(
                            action=data["action"],
                            resource_type=data["resource_type"],
                            timestamp=datetime.fromisoformat(data["timestamp"]),
                            actor=data["actor"],
                            actor_ip=data.get("actor_ip"),
                            resource_id=data.get("resource_id"),
                            resource_name=data.get("resource_name"),
                            metadata=data.get("metadata", {}),
                            legal_basis=data.get("legal_basis"),
                            data_categories=data.get("data_categories", []),
                            retention_period_days=data.get("retention_period_days"),
                            # SOC2 CC7.2, ISO 27001 A.12.4.2 - Integrity fields
                            sequence_number=data.get("sequence_number", 0),
                            prev_hash=data.get("prev_hash", GENESIS_PREV_HASH),
                            event_hash=data.get("event_hash"),
                            signature=data.get("signature"),
                        )
                        
                        # Apply filters
                        if action and event.action != action:
                            continue
                        if resource_type and event.resource_type != resource_type:
                            continue
                        if actor and event.actor != actor:
                            continue
                        
                        events.append(event)
                        
                    except (json.JSONDecodeError, KeyError):
                        logger.warning(f"Invalid audit log entry: {line[:100]}")
        
        return events
    
    def generate_compliance_report(
        self,
        start_date: datetime,
        end_date: datetime,
    ) -> Dict[str, Any]:
        """
        Generate a GDPR compliance report.
        
        Returns summary statistics for the period.
        """
        events = self.query_events(start_date=start_date, end_date=end_date)
        
        # Aggregate statistics
        total_events = len(events)
        
        actions_count = {}
        resource_types_count = {}
        gdpr_requests = 0
        
        for event in events:
            actions_count[event.action] = actions_count.get(event.action, 0) + 1
            resource_types_count[event.resource_type] = resource_types_count.get(event.resource_type, 0) + 1
            
            if event.action.startswith("gdpr_"):
                gdpr_requests += 1
        
        return {
            "report_period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat(),
            },
            "total_events": total_events,
            "actions_breakdown": actions_count,
            "resource_types_breakdown": resource_types_count,
            "gdpr_requests": gdpr_requests,
            "generated_at": datetime.utcnow().isoformat(),
        }
    
    def verify_chain(
        self,
        start_date: datetime = None,
        end_date: datetime = None,
    ) -> Dict[str, Any]:
        """
        SOC2 CC7.2, ISO 27001 A.12.4.2 - Verify audit log chain integrity.
        
        Checks:
        1. Hash chain continuity (each event references previous)
        2. HMAC signature validity (no tampering)
        3. Sequence number monotonicity (no gaps or reorderings)
        
        Returns:
            Verification result with any integrity issues found
        """
        events = self.query_events(start_date=start_date, end_date=end_date)
        
        # Sort by sequence number for chain verification
        events.sort(key=lambda e: e.sequence_number)
        
        issues = []
        prev_hash = GENESIS_PREV_HASH
        prev_sequence = 0
        
        for event in events:
            # Check hash chain continuity
            if event.prev_hash != prev_hash:
                issues.append({
                    "type": "chain_break",
                    "sequence": event.sequence_number,
                    "expected_prev_hash": prev_hash[:16] + "...",
                    "actual_prev_hash": event.prev_hash[:16] + "...",
                    "message": "Hash chain broken - possible insertion or modification",
                })
            
            
            # Check sequence monotonicity
            if event.sequence_number != prev_sequence + 1:
                issues.append({
                    "type": "sequence_gap",
                    "sequence": event.sequence_number,
                    "expected": prev_sequence + 1,
                    "message": f"Sequence gap detected: expected {prev_sequence + 1}, got {event.sequence_number}",
                })
            
            
            # Check event hash consistency
            if not event.verify_hash():
                issues.append({
                    "type": "hash_mismatch",
                    "sequence": event.sequence_number,
                    "message": "Event hash does not match content - possible modification",
                })
            
            
            # Check HMAC signature
            if not event.verify_signature(self._secret_key):
                issues.append({
                    "type": "signature_invalid",
                    "sequence": event.sequence_number,
                    "message": "HMAC signature verification failed - possible tampering",
                })
            
            
            prev_hash = event.event_hash
            prev_sequence = event.sequence_number
        
        
        return {
            "valid": len(issues) == 0,
            "events_checked": len(events),
            "chain_head": prev_hash[:16] + "..." if events else None,
            "last_sequence": prev_sequence,
            "issues": issues,
            "verified_at": datetime.utcnow().isoformat(),
        }
    
    def verify_event(self, event: AuditEvent) -> Dict[str, Any]:
        """
        Verify integrity of a single audit event.
        
        Returns verification status with details.
        """
        issues = []
        
        if not event.verify_hash():
            issues.append("event_hash_invalid")
        
        if not event.verify_signature(self._secret_key):
            issues.append("signature_invalid")
        
        return {
            "valid": len(issues) == 0,
            "event_id": event.event_id,
            "sequence_number": event.sequence_number,
            "issues": issues,
        }
    
    def get_chain_info(self) -> Dict[str, Any]:
        """
        Get current chain state information.
        
        Useful for compliance reporting and monitoring.
        """
        return {
            "chain_id": self._chain_state.get("chain_id"),
            "last_sequence": self._chain_state.get("last_sequence"),
            "last_event_at": self._chain_state.get("last_event_at"),
            "created_at": self._chain_state.get("created_at"),
            "log_directory": str(self.log_dir),
        }


# Global audit logger instance
_audit_logger: Optional[AuditLogger] = None


def get_audit_logger() -> AuditLogger:
    """Get the global audit logger instance."""
    global _audit_logger
    if _audit_logger is None:
        _audit_logger = AuditLogger()
    return _audit_logger


def configure_audit_logger(**kwargs) -> AuditLogger:
    """Configure the global audit logger."""
    global _audit_logger
    _audit_logger = AuditLogger(**kwargs)
    return _audit_logger
