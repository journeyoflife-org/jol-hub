"""
Data Module Configuration
GDPR Article 30 Compliance Settings
"""

from dataclasses import dataclass, field
from typing import List, Optional
from enum import Enum
from datetime import timedelta


class DataClassification(Enum):
    """Data classification levels per GDPR requirements."""
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    RESTRICTED = "restricted"  # Special category data (GDPR Art. 9)


class RetentionPolicy(Enum):
    """Data retention policies based on legal requirements."""
    FINANCIAL = timedelta(days=2555)  # 7 years for financial records
    USER_DATA = timedelta(days=730)   # 2 years for user activity
    DONATIONS = timedelta(days=2555)  # 7 years for donation records
    LOGS = timedelta(days=90)         # 90 days for operational logs
    BACKUP = timedelta(days=30)       # 30 days for backups


@dataclass
class DataProcessingActivity:
    """
    GDPR Article 30 - Record of Processing Activity
    
    Each processing activity must be documented with:
    - Purpose of processing
    - Categories of data subjects and personal data
    - Categories of recipients
    - Transfers to third countries
    - Retention periods
    - Security measures
    """
    name: str
    purpose: str
    data_controller: str
    data_categories: List[str]
    data_subjects: List[str]
    recipients: List[str]
    retention_period: timedelta
    classification: DataClassification
    third_country_transfers: Optional[List[str]] = None
    security_measures: List[str] = field(default_factory=list)
    legal_basis: str = ""  # GDPR Art. 6 basis
    

@dataclass  
class DataModuleConfig:
    """Configuration for the data processing module."""
    
    # Database connections
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_database: str = "jolhub"
    
    # Redis for caching
    redis_host: str = "localhost"
    redis_port: int = 6379
    
    # GDPR Compliance Settings
    enable_audit_logging: bool = True
    enable_data_masking: bool = True
    enable_encryption_at_rest: bool = True
    
    # Processing limits
    max_batch_size: int = 10000
    max_processing_time_minutes: int = 30
    
    # Default retention (can be overridden per data type)
    default_retention_days: int = 365


# Default configuration instance
config = DataModuleConfig()


# Processing activities registry (GDPR Art. 30)
PROCESSING_ACTIVITIES: List[DataProcessingActivity] = [
    DataProcessingActivity(
        name="donation_processing",
        purpose="Process and record charitable donations",
        data_controller="JOL-HUB",
        data_categories=["financial", "personal_identification"],
        data_subjects=["donors"],
        recipients=["payment_processors", "financial_authorities"],
        retention_period=RetentionPolicy.DONATIONS.value,
        classification=DataClassification.CONFIDENTIAL,
        security_measures=["encryption", "access_control", "audit_logging"],
        legal_basis="Contract performance (Art. 6(1)(b))",
    ),
    DataProcessingActivity(
        name="user_account_management",
        purpose="Manage user accounts and authentication",
        data_controller="JOL-HUB",
        data_categories=["personal_identification", "authentication"],
        data_subjects=["users", "administrators"],
        recipients=["none"],
        retention_period=RetentionPolicy.USER_DATA.value,
        classification=DataClassification.CONFIDENTIAL,
        security_measures=["encryption", "mfa", "access_control"],
        legal_basis="Contract performance (Art. 6(1)(b))",
    ),
    DataProcessingActivity(
        name="analytics_reporting",
        purpose="Generate anonymized analytics and reports",
        data_controller="JOL-HUB",
        data_categories=["behavioral", "usage_statistics"],
        data_subjects=["website_visitors"],
        recipients=["internal_analytics"],
        retention_period=RetentionPolicy.LOGS.value,
        classification=DataClassification.INTERNAL,
        security_measures=["pseudonymization", "access_control"],
        legal_basis="Legitimate interest (Art. 6(1)(f))",
    ),
]
