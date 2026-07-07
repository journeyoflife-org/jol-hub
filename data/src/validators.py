"""
Data Validators Module
GDPR-compliant data validation and quality checks
"""

import re
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, date
from typing import Any, Dict, List, Optional, Tuple
from enum import Enum

from .config import DataClassification


class ValidationSeverity(Enum):
    """Validation issue severity levels."""
    ERROR = "error"      # Blocks processing
    WARNING = "warning"  # Can proceed but should be reviewed
    INFO = "info"        # Informational only


@dataclass
class ValidationIssue:
    """A single validation issue."""
    field: str
    message: str
    severity: ValidationSeverity
    value: Optional[Any] = None
    rule: Optional[str] = None


@dataclass
class ValidationResult:
    """Result of data validation."""
    is_valid: bool
    issues: List[ValidationIssue] = field(default_factory=list)
    
    @property
    def errors(self) -> List[ValidationIssue]:
        return [i for i in self.issues if i.severity == ValidationSeverity.ERROR]
    
    @property
    def warnings(self) -> List[ValidationIssue]:
        return [i for i in self.issues if i.severity == ValidationSeverity.WARNING]
    
    def add_error(self, field: str, message: str, value: Any = None, rule: str = None) -> None:
        self.issues.append(ValidationIssue(
            field=field,
            message=message,
            severity=ValidationSeverity.ERROR,
            value=value,
            rule=rule,
        ))
        self.is_valid = False
    
    def add_warning(self, field: str, message: str, value: Any = None, rule: str = None) -> None:
        self.issues.append(ValidationIssue(
            field=field,
            message=message,
            severity=ValidationSeverity.WARNING,
            value=value,
            rule=rule,
        ))


class BaseValidator(ABC):
    """Abstract base validator."""
    
    @abstractmethod
    def validate(self, data: Any) -> ValidationResult:
        pass


class DataValidator(BaseValidator):
    """
    Comprehensive data validator with GDPR compliance rules.
    """
    
    # GDPR sensitive data patterns (Art. 9)
    SENSITIVE_PATTERNS = {
        "health": re.compile(r"(?:diagnosis|medical|health|disease|treatment)", re.I),
        "religion": re.compile(r"(?:religion|faith|church|mosque|temple|synagogue)", re.I),
        "political": re.compile(r"(?:political|party|vote|election)", re.I),
        "sexual": re.compile(r"(?:sexual|orientation|gender_identity)", re.I),
        "biometric": re.compile(r"(?:fingerprint|retina|facial_recognition)", re.I),
        "genetic": re.compile(r"(?:dna|genetic|genome)", re.I),
    }
    
    # Personal data patterns
    PERSONAL_PATTERNS = {
        "email": re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"),
        "phone": re.compile(r"^\+?[1-9]\d{6,14}$"),
        "ip_v4": re.compile(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$"),
        "uuid": re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.I),
    }
    
    def __init__(self, strict_mode: bool = False):
        self.strict_mode = strict_mode
    
    def validate(self, data: Dict) -> ValidationResult:
        """
        Validate a data record.
        
        Checks:
        - Required fields
        - Data types
        - GDPR compliance
        - Data quality
        """
        result = ValidationResult(is_valid=True)
        
        # Run all validation checks
        self._validate_required_fields(data, result)
        self._validate_field_types(data, result)
        self._validate_gdpr_compliance(data, result)
        self._validate_data_quality(data, result)
        
        return result
    
    def _validate_required_fields(self, data: Dict, result: ValidationResult) -> None:
        """Check for required fields."""
        # Subclasses should override
        pass
    
    def _validate_field_types(self, data: Dict, result: ValidationResult) -> None:
        """Validate field data types."""
        for key, value in data.items():
            if value is not None:
                type_check = self._check_type(key, value)
                if type_check:
                    result.add_warning(
                        field=key,
                        message=f"Unexpected type: expected {type_check[0]}, got {type_check[1]}",
                        value=str(value)[:50],
                        rule="type_check",
                    )
    
    def _check_type(self, key: str, value: Any) -> Optional[Tuple[str, str]]:
        """Check if value matches expected type for key."""
        type_hints = {
            "id": str,
            "email": str,
            "created_at": (datetime, str),
            "updated_at": (datetime, str),
            "amount": (int, float),
            "is_active": bool,
        }
        
        if key in type_hints:
            expected = type_hints[key]
            if not isinstance(value, expected):
                return (str(expected), type(value).__name__)
        return None
    
    def _validate_gdpr_compliance(self, data: Dict, result: ValidationResult) -> None:
        """Check GDPR compliance issues."""
        # Check for sensitive data without explicit consent field
        for key, value in data.items():
            if isinstance(value, str):
                for category, pattern in self.SENSITIVE_PATTERNS.items():
                    if pattern.search(value):
                        result.add_warning(
                            field=key,
                            message=f"Potential {category} data detected - verify consent",
                            rule="gdpr_art9",
                        )
        
        # Check for personal data fields
        if "email" in data and not self.PERSONAL_PATTERNS["email"].match(data["email"]):
            result.add_error(
                field="email",
                message="Invalid email format",
                value=data["email"],
                rule="email_format",
            )
    
    def _validate_data_quality(self, data: Dict, result: ValidationResult) -> None:
        """Check data quality issues."""
        for key, value in data.items():
            if isinstance(value, str):
                # Check for empty strings
                if not value.strip():
                    result.add_warning(
                        field=key,
                        message="Empty string value",
                        rule="quality_empty",
                    )
                # Check for potential SQL injection (basic)
                dangerous_patterns = ["--", "/*", "*/", "xp_", "sp_"]
                for pattern in dangerous_patterns:
                    if pattern in value.lower():
                        result.add_error(
                            field=key,
                            message=f"Potential injection detected",
                            rule="security_injection",
                        )
                        break


class DonationValidator(DataValidator):
    """Validator for donation records."""
    
    REQUIRED_FIELDS = ["donor_id", "amount", "currency", "date"]
    VALID_CURRENCIES = ["EUR", "USD", "GBP", "SEK", "NOK", "DKK", "PLN", "CZK"]
    
    def _validate_required_fields(self, data: Dict, result: ValidationResult) -> None:
        for field in self.REQUIRED_FIELDS:
            if field not in data or data[field] is None:
                result.add_error(
                    field=field,
                    message="Required field is missing",
                    rule="required_field",
                )
    
    def validate(self, data: Dict) -> ValidationResult:
        result = super().validate(data)
        
        # Additional donation-specific validations
        if "amount" in data and data["amount"] is not None:
            try:
                amount = float(data["amount"])
                if amount <= 0:
                    result.add_error("amount", "Amount must be positive", rule="positive_amount")
                if amount > 1000000:  # Suspicious large donation
                    result.add_warning("amount", "Large donation - verify compliance", rule="aml_check")
            except (ValueError, TypeError):
                result.add_error("amount", "Invalid amount format", rule="numeric_amount")
        
        if "currency" in data and data["currency"] not in self.VALID_CURRENCIES:
            result.add_warning("currency", f"Unusual currency: {data['currency']}", rule="currency_check")
        
        return result


class UserValidator(DataValidator):
    """Validator for user records."""
    
    REQUIRED_FIELDS = ["email"]
    
    def _validate_required_fields(self, data: Dict, result: ValidationResult) -> None:
        for field in self.REQUIRED_FIELDS:
            if field not in data or data[field] is None:
                result.add_error(
                    field=field,
                    message="Required field is missing",
                    rule="required_field",
                )
    
    def validate(self, data: Dict) -> ValidationResult:
        result = super().validate(data)
        
        # Check consent fields for GDPR
        consent_fields = [
            "consent_marketing",
            "consent_analytics", 
            "consent_third_party",
        ]
        
        has_any_consent = any(data.get(f) for f in consent_fields)
        
        if not has_any_consent:
            result.add_warning(
                field="consent",
                message="No explicit consent recorded",
                rule="gdpr_consent",
            )
        
        return result


def validate_batch(records: List[Dict], validator: DataValidator) -> Tuple[int, int, List[ValidationIssue]]:
    """
    Validate a batch of records.
    
    Returns:
        Tuple of (valid_count, invalid_count, all_issues)
    """
    valid = 0
    invalid = 0
    all_issues = []
    
    for record in records:
        result = validator.validate(record)
        if result.is_valid:
            valid += 1
        else:
            invalid += 1
        
        all_issues.extend(result.issues)
    
    return valid, invalid, all_issues
