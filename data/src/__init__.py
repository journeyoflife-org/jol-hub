"""
JOL-HUB Data Module
GDPR Article 30 - Records of Processing Activities

This module provides ETL pipelines, data processing utilities,
and compliance tooling for the JOL-HUB platform.

GDPR Compliance:
- Article 15 - Right of access (DSAR)
- Article 17 - Right to erasure
- Article 20 - Right to data portability
- Article 30 - Records of processing activities
"""

__version__ = "1.0.0"
__author__ = "JOL-HUB Team"

from .processors import DataProcessor, DonationProcessor, UserdataProcessor
from .validators import DataValidator
from .audit import AuditLogger
from .dsar_service import DSARService, handle_dsar_access, handle_dsar_erasure
from .encryption import (
    EncryptionService,
    EncryptionKey,
    KeyProvider,
    encrypt,
    decrypt,
    get_encryption_service,
)

__all__ = [
    "DataProcessor",
    "DonationProcessor",
    "UserdataProcessor", 
    "DataValidator",
    "AuditLogger",
    "DSARService",
    "handle_dsar_access",
    "handle_dsar_erasure",
    "EncryptionService",
    "EncryptionKey",
    "KeyProvider",
    "encrypt",
    "decrypt",
    "get_encryption_service",
]
