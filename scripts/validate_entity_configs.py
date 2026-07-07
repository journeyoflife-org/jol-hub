#!/usr/bin/env python3
"""
Entity Configuration Validator for JOL-HUB

Validates entity.yml files against GDPR, Canon Law, and JOL-HUB standards.

Usage:
    python scripts/validate_entity_configs.py [--country lt] [--entity-type cathedral]

Checks:
- Required fields present
- GDPR compliance configuration
- Bitrix24 portal domain format
- Contact information completeness
- Payment provider configuration
- Canonical hierarchy for Catholic entities
"""

import json
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Set, Any
import yaml


# =============================================================================
# CONFIGURATION
# =============================================================================

ENTITY_TYPES = {
    'basilica',
    'cathedral', 
    'diocese',
    'deanery',
    'church',
    'protestant',
    'church_protestant',  # Alternative naming
    'orthodox',
    'church_orthodox',    # Alternative naming
    'greek_catholic',
    'funeral_home',
    'funeral_service',    # Alternative naming
    'cemetery',
    'cemetery_service',   # Alternative naming
}

CATHOLIC_ENTITY_TYPES = {'basilica', 'cathedral', 'diocese', 'deanery', 'church'}

REQUIRED_FIELDS = {
    'entity.id',
    'entity.name',
    'entity.name_en',
    'entity.type',
    'entity.country',
    'entity.address.street',
    'entity.address.city',
    'entity.contact.email',
}

CATHOLIC_REQUIRED_FIELDS = {
    'entity.canonical.rite',
    'entity.canonical.jurisdiction',
}

# Fields that require parent_diocese (not applicable to dioceses themselves)
HIERARCHY_REQUIRED_FIELDS = {
    'entity.hierarchy.parent_diocese',
}

PAYMENT_ENTITY_TYPES = {'basilica', 'cathedral', 'church', 'funeral_home', 'cemetery', 'funeral_service', 'cemetery_service', 'church_protestant', 'church_orthodox', 'greek_catholic', 'protestant', 'orthodox', 'deanery', 'diocese'}

BITRIX24_PORTAL_PATTERN = r'^[a-z0-9-]+\.bitrix24\.(eu|com|de|ru)$'


@dataclass
class ValidationResult:
    """Result of validating a single entity config."""
    file_path: str
    entity_id: str
    entity_type: str
    entity_name: str
    valid: bool
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        return {
            'file_path': self.file_path,
            'entity_id': self.entity_id,
            'entity_type': self.entity_type,
            'entity_name': self.entity_name,
            'valid': self.valid,
            'errors': self.errors,
            'warnings': self.warnings,
        }


@dataclass
class ValidationSummary:
    """Summary of all validation results."""
    total: int = 0
    valid: int = 0
    invalid: int = 0
    warnings: int = 0
    results: List[ValidationResult] = field(default_factory=list)
    
    def add_result(self, result: ValidationResult):
        self.total += 1
        self.results.append(result)
        if result.valid:
            self.valid += 1
        else:
            self.invalid += 1
        self.warnings += len(result.warnings)
    
    def to_dict(self) -> Dict:
        return {
            'total': self.total,
            'valid': self.valid,
            'invalid': self.invalid,
            'warnings': self.warnings,
            'results': [r.to_dict() for r in self.results],
        }


# =============================================================================
# VALIDATORS
# =============================================================================

def get_nested_value(data: Dict, path: str) -> Any:
    """Get a nested value from a dict using dot notation."""
    keys = path.split('.')
    value = data
    for key in keys:
        if isinstance(value, dict) and key in value:
            value = value[key]
        else:
            return None
    return value


def validate_required_fields(config: Dict, result: ValidationResult) -> bool:
    """Validate all required fields are present."""
    all_valid = True
    
    # Check standard required fields
    for field_path in REQUIRED_FIELDS:
        value = get_nested_value(config, field_path)
        if value is None:
            result.errors.append(f"Missing required field: {field_path}")
            all_valid = False
    
    # Check Catholic-specific required fields
    entity_type = get_nested_value(config, 'entity.type')
    if entity_type in CATHOLIC_ENTITY_TYPES:
        for field_path in CATHOLIC_REQUIRED_FIELDS:
            value = get_nested_value(config, field_path)
            if value is None:
                result.errors.append(f"Missing Catholic required field: {field_path}")
                all_valid = False
        
        # Check hierarchy required fields (not applicable to dioceses themselves)
        if entity_type != 'diocese':
            for field_path in HIERARCHY_REQUIRED_FIELDS:
                value = get_nested_value(config, field_path)
                if value is None:
                    result.errors.append(f"Missing hierarchy required field: {field_path}")
                    all_valid = False
    
    return all_valid


def validate_entity_type(config: Dict, result: ValidationResult) -> bool:
    """Validate entity type is recognized."""
    entity_type = get_nested_value(config, 'entity.type')
    
    if entity_type is None:
        return False  # Already caught by required fields
    
    if entity_type not in ENTITY_TYPES:
        result.errors.append(f"Unknown entity type: {entity_type}. Valid types: {ENTITY_TYPES}")
        return False
    
    if entity_type == 'church':
        result.warnings.append("Entity type 'church' should be more specific if possible (basilica, cathedral)")
    
    return True


def validate_bitrix24(config: Dict, result: ValidationResult) -> bool:
    """Validate Bitrix24 configuration."""
    import re
    
    bitrix_config = get_nested_value(config, 'entity.bitrix24')
    
    if bitrix_config is None:
        result.warnings.append("No Bitrix24 configuration - CRM integration disabled")
        return True
    
    portal_domain = bitrix_config.get('portal_domain')
    if not portal_domain:
        result.errors.append("Bitrix24 configured but portal_domain missing")
        return False
    
    if not re.match(BITRIX24_PORTAL_PATTERN, portal_domain):
        result.errors.append(f"Invalid Bitrix24 portal domain format: {portal_domain}")
        return False
    
    # Check for EU portal (GDPR compliance)
    if not portal_domain.endswith('.bitrix24.eu'):
        result.warnings.append(f"Non-EU Bitrix24 portal: {portal_domain} - verify GDPR data processing agreement")
    
    return True


def validate_compliance(config: Dict, result: ValidationResult) -> bool:
    """Validate GDPR compliance configuration."""
    compliance = get_nested_value(config, 'entity.compliance')
    entity_type = get_nested_value(config, 'entity.type')
    
    if compliance is None:
        result.warnings.append("No compliance configuration - using defaults")
        return True
    
    # Check audit logging is enabled
    if not compliance.get('audit_logging', False):
        result.warnings.append("Audit logging not explicitly enabled")
    
    # Check legal basis for religious data
    if entity_type in CATHOLIC_ENTITY_TYPES:
        legal_basis = compliance.get('legal_basis')
        if legal_basis and 'Art. 9' not in legal_basis:
            result.warnings.append("Catholic entity should specify GDPR Art. 9(2)(d) for religious data")
    
    # Check retention periods
    retention = compliance.get('data_retention', {})
    if retention:
        sacramental = retention.get('sacramental_records')
        if sacramental and sacramental != 'permanent':
            result.warnings.append("Sacramental records should be retained permanently per Canon Law CIC 535")
    
    return True


def validate_payment_config(config: Dict, result: ValidationResult) -> bool:
    """Validate payment provider configuration."""
    entity_type = get_nested_value(config, 'entity.type')
    online_store = get_nested_value(config, 'entity.online_store')
    
    if online_store is None or not online_store.get('enabled', False):
        return True
    
    if entity_type not in PAYMENT_ENTITY_TYPES:
        result.warnings.append(f"Online store enabled for {entity_type} - verify payment compliance requirements")
    
    payment_methods = online_store.get('payment_methods', [])
    if not payment_methods:
        result.errors.append("Online store enabled but no payment methods configured")
        return False
    
    valid_methods = {'stripe', 'paypal', 'bank_link', 'cash', 'apple_pay', 'google_pay'}
    for method in payment_methods:
        if method not in valid_methods:
            result.warnings.append(f"Unknown payment method: {method}")
    
    return True


def validate_contact_info(config: Dict, result: ValidationResult) -> bool:
    """Validate contact information."""
    contact = get_nested_value(config, 'entity.contact')
    
    if contact is None:
        result.errors.append("No contact information")
        return False
    
    email = contact.get('email')
    if email:
        import re
        if not re.match(r'^[^@]+@[^@]+\.[^@]+$', email):
            result.errors.append(f"Invalid email format: {email}")
            return False
    
    phone = contact.get('phone')
    if phone:
        # Basic phone format check
        if not re.match(r'^\+?[0-9\s\-\(\)]{7,}$', phone):
            result.warnings.append(f"Phone format may be invalid: {phone}")
    
    return True


def validate_hierarchy(config: Dict, result: ValidationResult) -> bool:
    """Validate entity hierarchy for Catholic entities."""
    entity_type = get_nested_value(config, 'entity.type')
    hierarchy = get_nested_value(config, 'entity.hierarchy')
    
    if entity_type not in CATHOLIC_ENTITY_TYPES:
        return True
    
    if hierarchy is None:
        result.warnings.append(f"Catholic entity type '{entity_type}' missing hierarchy configuration")
        return True
    
    parent_diocese = hierarchy.get('parent_diocese')
    if not parent_diocese:
        if entity_type != 'diocese':  # Dioceses don't have parent dioceses
            result.warnings.append("Missing parent_diocese in hierarchy")
    
    return True


# =============================================================================
# MAIN VALIDATION
# =============================================================================

def validate_entity_config(file_path: Path) -> ValidationResult:
    """Validate a single entity.yml file."""
    # Load YAML
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            config = yaml.safe_load(f)
    except yaml.YAMLError as e:
        return ValidationResult(
            file_path=str(file_path),
            entity_id='unknown',
            entity_type='unknown',
            entity_name='unknown',
            valid=False,
            errors=[f"YAML parse error: {e}"],
        )
    
    # Extract basic info
    entity_id = get_nested_value(config, 'entity.id') or 'unknown'
    entity_type = get_nested_value(config, 'entity.type') or 'unknown'
    entity_name = get_nested_value(config, 'entity.name_en') or get_nested_value(config, 'entity.name') or 'unknown'
    
    result = ValidationResult(
        file_path=str(file_path),
        entity_id=entity_id,
        entity_type=entity_type,
        entity_name=entity_name,
        valid=True,
    )
    
    # Run validators
    validators = [
        validate_required_fields,
        validate_entity_type,
        validate_bitrix24,
        validate_compliance,
        validate_payment_config,
        validate_contact_info,
        validate_hierarchy,
    ]
    
    for validator in validators:
        try:
            if not validator(config, result):
                result.valid = False
        except Exception as e:
            result.errors.append(f"Validator {validator.__name__} failed: {e}")
            result.valid = False
    
    return result


def validate_all_configs(
    base_path: Path,
    country: Optional[str] = None,
    entity_type: Optional[str] = None,
) -> ValidationSummary:
    """Validate all entity configs in the project."""
    summary = ValidationSummary()
    
    # Find all entity.yml files
    if country:
        search_path = base_path / 'countries' / country / 'examples'
    else:
        search_path = base_path / 'countries'
    
    for entity_file in search_path.rglob('entity.yml'):
        result = validate_entity_config(entity_file)
        
        # Filter by entity type if specified
        if entity_type and result.entity_type != entity_type:
            continue
        
        summary.add_result(result)
    
    return summary


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Validate JOL-HUB entity configurations')
    parser.add_argument('--country', '-c', help='Filter by country code (e.g., lt)')
    parser.add_argument('--entity-type', '-t', help='Filter by entity type')
    parser.add_argument('--format', '-f', choices=['json', 'text'], default='text', help='Output format')
    parser.add_argument('--base-path', default='.', help='Base path to search')
    
    args = parser.parse_args()
    
    base_path = Path(args.base_path)
    summary = validate_all_configs(base_path, args.country, args.entity_type)
    
    if args.format == 'json':
        print(json.dumps(summary.to_dict(), indent=2))
    else:
        # Text output
        print(f"\n{'='*60}")
        print("JOL-HUB Entity Configuration Validation Report")
        print(f"{'='*60}\n")
        
        for result in summary.results:
            status = "✓ PASS" if result.valid else "✗ FAIL"
            print(f"{status} [{result.entity_type}] {result.entity_name} ({result.entity_id})")
            
            for error in result.errors:
                print(f"  ERROR: {error}")
            for warning in result.warnings:
                print(f"  WARN: {warning}")
        
        print(f"\n{'='*60}")
        print(f"Summary: {summary.valid}/{summary.total} valid, {summary.invalid} invalid, {summary.warnings} warnings")
        print(f"{'='*60}\n")
    
    # Exit with error code if any invalid
    sys.exit(0 if summary.invalid == 0 else 1)


if __name__ == '__main__':
    main()
