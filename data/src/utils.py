"""
JOL-HUB ETL Utilities
Common utilities for data pipelines
"""

import os
import json
from datetime import datetime, date
from decimal import Decimal
from typing import Any, Dict, List, Optional
from pathlib import Path


class DateTimeEncoder(json.JSONEncoder):
    """Custom JSON encoder for datetime and decimal types."""
    
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        if isinstance(obj, Decimal):
            return float(obj)
        if hasattr(obj, '__dict__'):
            return obj.__dict__
        return super().default(obj)


def load_config(config_path: Optional[str] = None) -> Dict[str, Any]:
    """Load configuration from environment and optional config file."""
    config = {
        "database": {
            "host": os.environ.get("DB_HOST", "localhost"),
            "port": int(os.environ.get("DB_PORT", "5432")),
            "name": os.environ.get("DB_NAME", "jolhub"),
            "user": os.environ.get("DB_USER", "jolhub"),
            "password": os.environ.get("DB_PASSWORD", ""),
        },
        "redis": {
            "host": os.environ.get("REDIS_HOST", "localhost"),
            "port": int(os.environ.get("REDIS_PORT", "6379")),
        },
        "audit_log_dir": os.environ.get("AUDIT_LOG_DIR", "/var/log/jol-hub/audit"),
    }
    
    if config_path and Path(config_path).exists():
        with open(config_path, "r") as f:
            file_config = json.load(f)
            config.update(file_config)
    
    return config


def mask_pii(value: str, visible_chars: int = 2) -> str:
    """Mask personally identifiable information."""
    if not value or len(value) <= visible_chars:
        return "***"
    
    return value[:visible_chars] + "*" * (len(value) - visible_chars)


def mask_email(email: str) -> str:
    """Mask email address while keeping domain visible."""
    if not email or "@" not in email:
        return "***@***"
    
    local, domain = email.rsplit("@", 1)
    masked_local = local[:2] + "***" if len(local) > 2 else "***"
    
    return f"{masked_local}@{domain}"


def mask_ip(ip: str) -> str:
    """Mask IP address for privacy."""
    if not ip:
        return "xxx.xxx.xxx.xxx"
    
    parts = ip.split(".")
    if len(parts) == 4:
        return f"{parts[0]}.{parts[1]}.xxx.xxx"
    
    return "xxx.xxx.xxx.xxx"


def calculate_retention_date(
    created_at: datetime,
    retention_days: int,
) -> datetime:
    """Calculate when data should be deleted based on retention policy."""
    from datetime import timedelta
    return created_at + timedelta(days=retention_days)


def is_data_expired(
    created_at: datetime,
    retention_days: int,
    reference_date: Optional[datetime] = None,
) -> bool:
    """Check if data has exceeded retention period."""
    if reference_date is None:
        reference_date = datetime.utcnow()
    
    expiry_date = calculate_retention_date(created_at, retention_days)
    return reference_date > expiry_date


def generate_data_subject_export(
    user_id: str,
    include_donations: bool = True,
    include_activity: bool = False,
) -> Dict[str, Any]:
    """
    Generate a data export for GDPR Art. 20 compliance.
    
    Returns all personal data associated with a data subject.
    """
    # This is a template - implement with actual database queries
    export = {
        "export_metadata": {
            "user_id": user_id,
            "exported_at": datetime.utcnow().isoformat(),
            "format_version": "1.0",
            "gdpr_legal_basis": "Article 20 - Right to data portability",
        },
        "personal_data": {
            # Populated from actual database
        },
        "donations": [] if include_donations else None,
        "activity_log": [] if include_activity else None,
    }
    
    return export
