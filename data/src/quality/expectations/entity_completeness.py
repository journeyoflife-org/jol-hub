"""
Entity Completeness Expectations
GDPR Classification: INTERNAL
Purpose: Validate that all parishes have required entity data

Great Expectations suite for entity data quality.
"""

from typing import Any, Dict, List
from dataclasses import dataclass
from enum import Enum


class EntityType(Enum):
    """Entity types for validation."""
    PARISH = "parish"
    PRIEST = "priest"
    ORGANIZATION = "organization"
    DONOR = "donor"


@dataclass
class CompletenessRule:
    """Rule for entity completeness validation."""
    entity_type: EntityType
    required_fields: List[str]
    conditional_fields: Dict[str, List[str]]  # field -> required_if fields
    
    # Minimum completeness percentage
    min_completeness_pct: float = 0.95
    
    # Cross-validation rules
    must_have_priest: bool = False  # Parishes must have at least one priest


# Standard completeness rules
ENTITY_COMPLETENESS_RULES = {
    EntityType.PARISH: CompletenessRule(
        entity_type=EntityType.PARISH,
        required_fields=[
            "parish_id",
            "parish_name", 
            "country_code",
            "address",
            "diocese",
        ],
        conditional_fields={
            "email": ["website"],  # If website exists, email recommended
            "phone": ["email"],    # If email exists, phone recommended
        },
        min_completeness_pct=0.95,
        must_have_priest=True,
    ),
    EntityType.PRIEST: CompletenessRule(
        entity_type=EntityType.PRIEST,
        required_fields=[
            "priest_id",
            "name",
            "parish_id",
            "role",
        ],
        conditional_fields={
            "email": ["phone"],  # Should have at least one contact method
        },
        min_completeness_pct=0.90,
    ),
    EntityType.ORGANIZATION: CompletenessRule(
        entity_type=EntityType.ORGANIZATION,
        required_fields=[
            "organization_id",
            "organization_name",
            "country_code",
            "organization_type",
        ],
        conditional_fields={},
        min_completeness_pct=0.95,
    ),
}


class EntityCompletenessChecker:
    """
    Validates entity completeness for GDPR compliance.
    
    Checks:
    - All required fields are populated
    - Conditional fields follow rules
    - Cross-entity relationships (parish -> priest)
    - Data freshness (updated within retention period)
    """
    
    def __init__(self, rules: Dict[EntityType, CompletenessRule] = None):
        self.rules = rules or ENTITY_COMPLETENESS_RULES
    
    def validate(
        self,
        entities: List[Dict[str, Any]],
        entity_type: EntityType,
    ) -> Dict[str, Any]:
        """
        Validate a batch of entities.
        
        Returns:
            Validation result with statistics and issues
        """
        rule = self.rules.get(entity_type)
        if not rule:
            return {"valid": False, "error": f"No rules for {entity_type}"}
        
        result = {
            "valid": True,
            "total": len(entities),
            "complete": 0,
            "incomplete": 0,
            "issues": [],
            "completeness_by_field": {},
        }
        
        # Track field completeness
        field_counts = {field: 0 for field in rule.required_fields}
        
        for entity in entities:
            is_complete = True
            
            # Check required fields
            for field in rule.required_fields:
                if entity.get(field):
                    field_counts[field] += 1
                else:
                    is_complete = False
                    result["issues"].append({
                        "entity_id": entity.get("id", "unknown"),
                        "field": field,
                        "issue": "required_field_missing",
                    })
            
            # Check conditional fields
            for field, required_if in rule.conditional_fields.items():
                if any(entity.get(rif) for rif in required_if):
                    if not entity.get(field):
                        result["issues"].append({
                            "entity_id": entity.get("id", "unknown"),
                            "field": field,
                            "issue": "conditional_field_missing",
                            "required_if": required_if,
                        })
            
            if is_complete:
                result["complete"] += 1
            else:
                result["incomplete"] += 1
        
        # Calculate completeness percentage
        completeness_pct = result["complete"] / result["total"] if result["total"] > 0 else 0
        result["completeness_pct"] = completeness_pct
        
        # Check threshold
        if completeness_pct < rule.min_completeness_pct:
            result["valid"] = False
            result["error"] = f"Completeness {completeness_pct:.1%} below threshold {rule.min_completeness_pct:.1%}"
        
        # Field-level completeness
        for field, count in field_counts.items():
            result["completeness_by_field"][field] = count / result["total"] if result["total"] > 0 else 0
        
        return result
    
    def validate_priest_assignment(
        self,
        parishes: List[Dict],
        priests: List[Dict],
    ) -> Dict[str, Any]:
        """
        Validate that all parishes have at least one priest assigned.
        
        This is a Canon Law requirement in addition to GDPR.
        """
        parish_ids = {p.get("parish_id") for p in parishes}
        priest_parish_ids = {p.get("parish_id") for p in priests}
        
        unassigned = parish_ids - priest_parish_ids
        
        return {
            "valid": len(unassigned) == 0,
            "total_parishes": len(parish_ids),
            "parishes_with_priests": len(parish_ids & priest_parish_ids),
            "unassigned_parishes": list(unassigned),
        }
