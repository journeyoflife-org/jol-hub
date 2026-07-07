"""
Entity-Specific ROPA Processing Activities
GDPR Article 30 - Records of Processing Activities

This module extends the base ROPA generator with entity-specific processing
activities for all 10 JOL-HUB entity types in Lithuania.

Entity Types:
1. Basilica - Catholic minor/major basilica
2. Cathedral - Catholic cathedral
3. Diocese - Catholic archdiocese/diocese
4. Deanery - Catholic deanery
5. Church - Catholic parish church
6. Protestant - Protestant congregation
7. Orthodox - Orthodox parish
8. Greek Catholic - Greek Catholic parish
9. Funeral - Funeral home services
10. Cemetery - Cemetery services

Compliance Matrix:
- GDPR Art. 5-7 (Consent): All entities
- GDPR Art. 9(2)(d) (Religious): Catholic entities
- PCI-DSS: Basilica, Cathedral, Church, Funeral, Cemetery
- SOC2 Type II: Basilica, Cathedral, Church, Funeral, Cemetery
- Canon Law: Catholic entities (CIC 535 §1-5)
"""

from dataclasses import dataclass
from typing import List, Dict, Any
from datetime import datetime

from .ropa_generator import ProcessingActivity


# =============================================================================
# ENTITY TYPE PROCESSING ACTIVITIES
# =============================================================================

def get_entity_processing_activities(entity_type: str, entity_config: Dict[str, Any]) -> List[ProcessingActivity]:
    """
    Get entity-specific processing activities for ROPA.
    
    Args:
        entity_type: One of 'basilica', 'cathedral', 'diocese', 'deanery', 'church',
                     'protestant', 'orthodox', 'greek_catholic', 'funeral', 'cemetery'
        entity_config: Entity configuration from entity.yml
        
    Returns:
        List of ProcessingActivity objects for the entity
    """
    activities_map = {
        'basilica': get_basilica_activities,
        'cathedral': get_cathedral_activities,
        'diocese': get_diocese_activities,
        'deanery': get_deanery_activities,
        'church': get_church_activities,
        'protestant': get_protestant_activities,
        'orthodox': get_orthodox_activities,
        'greek_catholic': get_greek_catholic_activities,
        'funeral': get_funeral_activities,
        'cemetery': get_cemetery_activities,
    }
    
    generator = activities_map.get(entity_type, get_generic_activities)
    return generator(entity_config)


def _create_base_activity(
    activity_id: str,
    name: str,
    purpose: str,
    legal_basis: str,
    entity_name: str,
    entity_contact: str,
    data_categories: List[str],
    data_subjects: List[str],
    recipients: List[str],
    retention_days: int,
    security_measures: List[str],
    sensitive_data: bool = False,
    third_country: List[str] = None,
) -> ProcessingActivity:
    """Helper to create a ProcessingActivity with standard fields."""
    return ProcessingActivity(
        id=activity_id,
        name=name,
        purpose=purpose,
        legal_basis=legal_basis,
        controller_name=entity_name,
        controller_contact=entity_contact,
        data_categories=data_categories,
        data_subjects=data_subjects,
        recipients=recipients,
        retention_period_days=retention_days,
        security_measures=security_measures,
        sensitive_data=sensitive_data,
        third_country_transfers=third_country or [],
    )


# =============================================================================
# CATHOLIC ENTITIES (Canon Law CIC 535 §1-5)
# =============================================================================

def get_basilica_activities(config: Dict[str, Any]) -> List[ProcessingActivity]:
    """Processing activities for Catholic basilica."""
    entity_name = config.get('entity', {}).get('name_en', 'Basilica')
    entity_contact = config.get('entity', {}).get('contact', {}).get('email', 'dpo@jol-hub.eu')
    
    return [
        _create_base_activity(
            activity_id="BAS001",
            name="Sacramental Records Management",
            purpose="Maintain permanent sacramental registers (baptism, confirmation, marriage, death) per Canon Law CIC 535",
            legal_basis="Art. 9(2)(d) - Processing for religious purposes",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "religious", "family"],
            data_subjects=["parishioners", "godparents", "witnesses"],
            recipients=["diocesan_archive", "ecclesiastical_authority"],
            retention_period_days=36500,  # 100 years (permanent)
            security_measures=["encryption_at_rest", "access_control", "audit_logging", "canonical_seal"],
            sensitive_data=True,
        ),
        _create_base_activity(
            activity_id="BAS002",
            name="Mass Intention Booking",
            purpose="Process mass intention requests and donations",
            legal_basis="Art. 6(1)(b) - Contract performance",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "financial", "religious"],
            data_subjects=["donors", "deceased_persons"],
            recipients=["payment_processors", "clergy"],
            retention_period_days=2555,  # 7 years
            security_measures=["encryption", "pci_dss_compliance", "audit_logging"],
            sensitive_data=True,
        ),
        _create_base_activity(
            activity_id="BAS003",
            name="Pilgrimage Registration",
            purpose="Manage pilgrimage event registrations",
            legal_basis="Art. 6(1)(b) - Contract performance",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "contact"],
            data_subjects=["pilgrims"],
            recipients=["tour_operators", "transport_providers"],
            retention_period_days=1825,  # 5 years
            security_measures=["encryption", "access_control"],
        ),
        _create_base_activity(
            activity_id="BAS004",
            name="Donation Processing",
            purpose="Process charitable donations and issue tax receipts",
            legal_basis="Art. 6(1)(b) - Contract performance",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "financial"],
            data_subjects=["donors"],
            recipients=["payment_processors", "tax_authority"],
            retention_period_days=2555,  # 7 years (tax law)
            security_measures=["pci_dss_level_1", "encryption", "audit_logging"],
        ),
    ]


def get_cathedral_activities(config: Dict[str, Any]) -> List[ProcessingActivity]:
    """Processing activities for Catholic cathedral."""
    entity_name = config.get('entity', {}).get('name_en', 'Cathedral')
    entity_contact = config.get('entity', {}).get('contact', {}).get('email', 'dpo@jol-hub.eu')
    
    return [
        _create_base_activity(
            activity_id="CAT001",
            name="Sacramental Records Management",
            purpose="Maintain permanent sacramental registers per Canon Law",
            legal_basis="Art. 9(2)(d) - Religious purposes",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "religious", "family"],
            data_subjects=["parishioners"],
            recipients=["diocesan_archive"],
            retention_period_days=36500,
            security_measures=["encryption", "audit_logging", "canonical_seal"],
            sensitive_data=True,
        ),
        _create_base_activity(
            activity_id="CAT002",
            name="Heritage Conservation Records",
            purpose="Document cathedral heritage and restoration activities",
            legal_basis="Art. 6(1)(f) - Legitimate interest",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "professional"],
            data_subjects=["contractors", "conservators"],
            recipients=["heritage_authority"],
            retention_period_days=3650,  # 10 years
            security_measures=["access_control", "backup"],
        ),
        _create_base_activity(
            activity_id="CAT003",
            name="Concert Event Management",
            purpose="Organize sacred music concerts and cultural events",
            legal_basis="Art. 6(1)(b) - Contract performance",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "contact"],
            data_subjects=["attendees", "performers"],
            recipients=["ticketing_platform"],
            retention_period_days=730,
            security_measures=["encryption", "access_control"],
        ),
        _create_base_activity(
            activity_id="CAT004",
            name="Bishop's Schedule Management",
            purpose="Coordinate episcopal liturgies and pastoral visits",
            legal_basis="Art. 6(1)(f) - Legitimate interest",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "calendar"],
            data_subjects=["clergy", "faithful"],
            recipients=["diocesan_curia"],
            retention_period_days=365,
            security_measures=["access_control"],
        ),
    ]


def get_diocese_activities(config: Dict[str, Any]) -> List[ProcessingActivity]:
    """Processing activities for Catholic diocese."""
    entity_name = config.get('entity', {}).get('name_en', 'Diocese')
    entity_contact = config.get('entity', {}).get('contact', {}).get('email', 'dpo@jol-hub.eu')
    
    return [
        _create_base_activity(
            activity_id="DIO001",
            name="Priest Personnel Records",
            purpose="Manage clergy assignments and personnel files",
            legal_basis="Art. 9(2)(d) - Religious purposes",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "religious", "professional"],
            data_subjects=["priests", "deacons", "seminarians"],
            recipients=["vatican_congregation", "apostolic_nunciature"],
            retention_period_days=36500,
            security_measures=["encryption", "access_control", "audit_logging"],
            sensitive_data=True,
        ),
        _create_base_activity(
            activity_id="DIO002",
            name="Parish Registry Management",
            purpose="Maintain registry of all parishes in the diocese",
            legal_basis="Art. 6(1)(f) - Legitimate interest",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "organizational"],
            data_subjects=["parish_administrators"],
            recipients=["ecclesiastical_authority"],
            retention_period_days=36500,
            security_measures=["access_control", "backup"],
        ),
        _create_base_activity(
            activity_id="DIO003",
            name="Vocations Discernment",
            purpose="Track vocations inquiries and formation progress",
            legal_basis="Art. 9(2)(d) - Religious purposes",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "religious", "educational"],
            data_subjects=["vocations_candidates"],
            recipients=["seminary", "formation_director"],
            retention_period_days=3650,
            security_measures=["encryption", "access_control"],
            sensitive_data=True,
        ),
        _create_base_activity(
            activity_id="DIO004",
            name="Canonical Marriage Tribunal",
            purpose="Process marriage nullity cases",
            legal_basis="Art. 9(2)(d) - Religious purposes",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "family", "religious", "legal"],
            data_subjects=["petitioners", "respondents", "witnesses"],
            recipients=["tribunal_judges", "advocates", "rotal_court"],
            retention_period_days=36500,
            security_measures=["encryption", "legal_hold", "audit_logging"],
            sensitive_data=True,
        ),
    ]


def get_deanery_activities(config: Dict[str, Any]) -> List[ProcessingActivity]:
    """Processing activities for Catholic deanery."""
    entity_name = config.get('entity', {}).get('name_en', 'Deanery')
    entity_contact = config.get('entity', {}).get('contact', {}).get('email', 'dpo@jol-hub.eu')
    
    return [
        _create_base_activity(
            activity_id="DEA001",
            name="Parish Coordination",
            purpose="Coordinate activities between parishes in the deanery",
            legal_basis="Art. 6(1)(f) - Legitimate interest",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "organizational"],
            data_subjects=["parish_priests", "parish_staff"],
            recipients=["diocesan_curia"],
            retention_period_days=3650,
            security_measures=["access_control"],
        ),
        _create_base_activity(
            activity_id="DEA002",
            name="Deanery Events Calendar",
            purpose="Organize deanery-wide liturgical and pastoral events",
            legal_basis="Art. 6(1)(f) - Legitimate interest",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "calendar"],
            data_subjects=["clergy", "faithful"],
            recipients=["parishes"],
            retention_period_days=365,
            security_measures=["access_control"],
        ),
        _create_base_activity(
            activity_id="DEA003",
            name="Shared Resource Management",
            purpose="Manage shared resources between parishes",
            legal_basis="Art. 6(1)(f) - Legitimate interest",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["organizational"],
            data_subjects=["parishes"],
            recipients=[],
            retention_period_days=1825,
            security_measures=["access_control"],
        ),
    ]


def get_church_activities(config: Dict[str, Any]) -> List[ProcessingActivity]:
    """Processing activities for Catholic parish church."""
    entity_name = config.get('entity', {}).get('name_en', 'Parish Church')
    entity_contact = config.get('entity', {}).get('contact', {}).get('email', 'dpo@jol-hub.eu')
    
    return [
        _create_base_activity(
            activity_id="CHR001",
            name="Parishioner Registration",
            purpose="Maintain parish registry of faithful",
            legal_basis="Art. 9(2)(d) - Religious purposes",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "contact", "family", "religious"],
            data_subjects=["parishioners"],
            recipients=["diocese"],
            retention_period_days=3650,
            security_measures=["encryption", "access_control"],
            sensitive_data=True,
        ),
        _create_base_activity(
            activity_id="CHR002",
            name="Sacramental Records",
            purpose="Maintain sacramental registers per Canon Law CIC 535",
            legal_basis="Art. 9(2)(d) - Religious purposes",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "religious", "family"],
            data_subjects=["parishioners", "godparents", "witnesses"],
            recipients=["diocesan_archive"],
            retention_period_days=36500,
            security_measures=["encryption", "canonical_seal", "audit_logging"],
            sensitive_data=True,
        ),
        _create_base_activity(
            activity_id="CHR003",
            name="Religious Education Enrollment",
            purpose="Manage catechism and sacramental preparation programs",
            legal_basis="Art. 6(1)(b) - Contract performance",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "educational", "religious"],
            data_subjects=["students", "parents", "catechists"],
            recipients=["diocese"],
            retention_period_days=1825,
            security_measures=["encryption", "access_control"],
            sensitive_data=True,
        ),
        _create_base_activity(
            activity_id="CHR004",
            name="Parish Donation Management",
            purpose="Process donations and issue tax receipts",
            legal_basis="Art. 6(1)(b) - Contract performance",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "financial"],
            data_subjects=["donors"],
            recipients=["payment_processors", "tax_authority"],
            retention_period_days=2555,
            security_measures=["pci_dss", "encryption", "audit_logging"],
        ),
    ]


# =============================================================================
# NON-CATHOLIC CHRISTIAN ENTITIES
# =============================================================================

def get_protestant_activities(config: Dict[str, Any]) -> List[ProcessingActivity]:
    """Processing activities for Protestant congregation."""
    entity_name = config.get('entity', {}).get('name_en', 'Protestant Church')
    entity_contact = config.get('entity', {}).get('contact', {}).get('email', 'dpo@jol-hub.eu')
    
    return [
        _create_base_activity(
            activity_id="PRO001",
            name="Congregation Membership",
            purpose="Maintain congregation membership roster",
            legal_basis="Art. 6(1)(f) - Legitimate interest",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "contact"],
            data_subjects=["members"],
            recipients=[],
            retention_period_days=3650,
            security_measures=["encryption", "access_control"],
        ),
        _create_base_activity(
            activity_id="PRO002",
            name="Service Attendance",
            purpose="Track worship service attendance",
            legal_basis="Art. 6(1)(f) - Legitimate interest",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["behavioral"],
            data_subjects=["attendees"],
            recipients=[],
            retention_period_days=365,
            security_measures=["anonymization"],
        ),
        _create_base_activity(
            activity_id="PRO003",
            name="Community Events",
            purpose="Organize community outreach events",
            legal_basis="Art. 6(1)(b) - Contract performance",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "contact"],
            data_subjects=["participants"],
            recipients=[],
            retention_period_days=730,
            security_measures=["access_control"],
        ),
        _create_base_activity(
            activity_id="PRO004",
            name="Donation Processing",
            purpose="Process offerings and donations",
            legal_basis="Art. 6(1)(b) - Contract performance",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "financial"],
            data_subjects=["donors"],
            recipients=["payment_processors"],
            retention_period_days=2555,
            security_measures=["encryption", "audit_logging"],
        ),
    ]


def get_orthodox_activities(config: Dict[str, Any]) -> List[ProcessingActivity]:
    """Processing activities for Orthodox parish."""
    entity_name = config.get('entity', {}).get('name_en', 'Orthodox Church')
    entity_contact = config.get('entity', {}).get('contact', {}).get('email', 'dpo@jol-hub.eu')
    
    return [
        _create_base_activity(
            activity_id="ORT001",
            name="Parish Registry",
            purpose="Maintain parish membership records",
            legal_basis="Art. 9(2)(d) - Religious purposes (conditional)",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "religious", "family"],
            data_subjects=["parishioners"],
            recipients=["patriarchate"],
            retention_period_days=36500,
            security_measures=["encryption", "access_control"],
            sensitive_data=True,
        ),
        _create_base_activity(
            activity_id="ORT002",
            name="Sacramental Records",
            purpose="Maintain sacramental registers (Julian calendar)",
            legal_basis="Art. 9(2)(d) - Religious purposes",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "religious"],
            data_subjects=["parishioners", "godparents"],
            recipients=["diocese", "patriarchate"],
            retention_period_days=36500,
            security_measures=["encryption", "canonical_seal"],
            sensitive_data=True,
        ),
        _create_base_activity(
            activity_id="ORT003",
            name="Icon Shop Sales",
            purpose="Process sales of religious items",
            legal_basis="Art. 6(1)(b) - Contract performance",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "financial"],
            data_subjects=["customers"],
            recipients=["payment_processors"],
            retention_period_days=2555,
            security_measures=["encryption", "audit_logging"],
        ),
    ]


def get_greek_catholic_activities(config: Dict[str, Any]) -> List[ProcessingActivity]:
    """Processing activities for Greek Catholic parish."""
    entity_name = config.get('entity', {}).get('name_en', 'Greek Catholic Church')
    entity_contact = config.get('entity', {}).get('contact', {}).get('email', 'dpo@jol-hub.eu')
    
    return [
        _create_base_activity(
            activity_id="GRE001",
            name="Byzantine Sacramental Records",
            purpose="Maintain sacramental registers per CCEO Canon Law",
            legal_basis="Art. 9(2)(d) - Religious purposes",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "religious", "family"],
            data_subjects=["parishioners"],
            recipients=["eparchy", "vatican"],
            retention_period_days=36500,
            security_measures=["encryption", "canonical_seal", "audit_logging"],
            sensitive_data=True,
        ),
        _create_base_activity(
            activity_id="GRE002",
            name="Byzantine Calendar Events",
            purpose="Manage liturgical calendar per Byzantine rite",
            legal_basis="Art. 6(1)(f) - Legitimate interest",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["calendar", "religious"],
            data_subjects=["clergy", "faithful"],
            recipients=["eparchy"],
            retention_period_days=365,
            security_measures=["access_control"],
        ),
        _create_base_activity(
            activity_id="GRE003",
            name="Eastern Christian Store",
            purpose="Process sales of Eastern Christian items",
            legal_basis="Art. 6(1)(b) - Contract performance",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "financial"],
            data_subjects=["customers"],
            recipients=["payment_processors"],
            retention_period_days=2555,
            security_measures=["encryption", "audit_logging"],
        ),
    ]


# =============================================================================
# COMMERCIAL ENTITIES (PCI-DSS, SOC2)
# =============================================================================

def get_funeral_activities(config: Dict[str, Any]) -> List[ProcessingActivity]:
    """Processing activities for funeral home."""
    entity_name = config.get('entity', {}).get('name_en', 'Funeral Home')
    entity_contact = config.get('entity', {}).get('contact', {}).get('email', 'dpo@jol-hub.eu')
    
    return [
        _create_base_activity(
            activity_id="FUN001",
            name="Client Family Records",
            purpose="Manage funeral service arrangements with families",
            legal_basis="Art. 6(1)(b) - Contract performance",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "contact", "family"],
            data_subjects=["clients", "deceased"],
            recipients=["cemeteries", "clergy", "civil_registrar"],
            retention_period_days=27375,  # 75 years
            security_measures=["encryption", "access_control", "audit_logging"],
        ),
        _create_base_activity(
            activity_id="FUN002",
            name="Pre-Need Contracts",
            purpose="Manage pre-arranged funeral contracts",
            legal_basis="Art. 6(1)(b) - Contract performance",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "financial", "health"],
            data_subjects=["contract_holders"],
            recipients=["insurance_providers", "trustees"],
            retention_period_days=27375,
            security_measures=["encryption", "pci_dss", "audit_logging"],
            sensitive_data=True,
        ),
        _create_base_activity(
            activity_id="FUN003",
            name="Obituary Publishing",
            purpose="Publish obituaries with family consent",
            legal_basis="Art. 6(1)(a) - Consent",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "biographical"],
            data_subjects=["deceased", "family"],
            recipients=["media_outlets", "website"],
            retention_period_days=3650,
            security_measures=["access_control", "consent_tracking"],
        ),
        _create_base_activity(
            activity_id="FUN004",
            name="Payment Processing",
            purpose="Process funeral service payments",
            legal_basis="Art. 6(1)(b) - Contract performance",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "financial"],
            data_subjects=["clients"],
            recipients=["payment_processors"],
            retention_period_days=2555,
            security_measures=["pci_dss_level_2", "encryption", "audit_logging"],
        ),
        _create_base_activity(
            activity_id="FUN005",
            name="Vendor Coordination",
            purpose="Coordinate with third-party vendors (florists, transport, etc.)",
            legal_basis="Art. 6(1)(b) - Contract performance",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "contact", "service_details"],
            data_subjects=["vendors", "clients"],
            recipients=["vendors"],
            retention_period_days=1825,
            security_measures=["access_control"],
        ),
    ]


def get_cemetery_activities(config: Dict[str, Any]) -> List[ProcessingActivity]:
    """Processing activities for cemetery services."""
    entity_name = config.get('entity', {}).get('name_en', 'Cemetery')
    entity_contact = config.get('entity', {}).get('contact', {}).get('email', 'dpo@jol-hub.eu')
    
    return [
        _create_base_activity(
            activity_id="CEM001",
            name="Plot Ownership Records",
            purpose="Maintain cemetery plot ownership registry",
            legal_basis="Art. 6(1)(b) - Contract performance",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "property", "family"],
            data_subjects=["plot_owners", "deceased"],
            recipients=["land_registry", "municipality"],
            retention_period_days=27375,  # 75 years
            security_measures=["encryption", "access_control", "audit_logging"],
        ),
        _create_base_activity(
            activity_id="CEM002",
            name="Interment Records",
            purpose="Record all interments and burials",
            legal_basis="Art. 6(1)(c) - Legal obligation",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "location", "family"],
            data_subjects=["deceased", "family"],
            recipients=["civil_registrar", "religious_authority"],
            retention_period_days=27375,
            security_measures=["encryption", "access_control", "backup"],
        ),
        _create_base_activity(
            activity_id="CEM003",
            name="Monument Permit System",
            purpose="Manage headstone and monument permits",
            legal_basis="Art. 6(1)(b) - Contract performance",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "property"],
            data_subjects=["plot_owners", "monument_makers"],
            recipients=[],
            retention_period_days=3650,
            security_measures=["access_control"],
        ),
        _create_base_activity(
            activity_id="CEM004",
            name="Maintenance Contracts",
            purpose="Manage perpetual care and maintenance contracts",
            legal_basis="Art. 6(1)(b) - Contract performance",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "financial"],
            data_subjects=["contract_holders"],
            recipients=["payment_processors"],
            retention_period_days=27375,
            security_measures=["encryption", "audit_logging"],
        ),
        _create_base_activity(
            activity_id="CEM005",
            name="Grave Location Search",
            purpose="Enable public grave location search",
            legal_basis="Art. 6(1)(f) - Legitimate interest",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "location"],
            data_subjects=["deceased", "visitors"],
            recipients=[],
            retention_period_days=27375,
            security_measures=["access_control", "public_access_controls"],
        ),
    ]


def get_generic_activities(config: Dict[str, Any]) -> List[ProcessingActivity]:
    """Default processing activities for unknown entity types."""
    entity_name = config.get('entity', {}).get('name_en', 'Entity')
    entity_contact = config.get('entity', {}).get('contact', {}).get('email', 'dpo@jol-hub.eu')
    
    return [
        _create_base_activity(
            activity_id="GEN001",
            name="Contact Management",
            purpose="Manage contact information",
            legal_basis="Art. 6(1)(f) - Legitimate interest",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "contact"],
            data_subjects=["contacts"],
            recipients=[],
            retention_period_days=1825,
            security_measures=["encryption", "access_control"],
        ),
        _create_base_activity(
            activity_id="GEN002",
            name="Service Delivery",
            purpose="Deliver services to data subjects",
            legal_basis="Art. 6(1)(b) - Contract performance",
            entity_name=entity_name,
            entity_contact=entity_contact,
            data_categories=["identification", "service"],
            data_subjects=["clients"],
            recipients=[],
            retention_period_days=1825,
            security_measures=["encryption", "access_control"],
        ),
    ]


# =============================================================================
# ROPA REPORT GENERATOR
# =============================================================================

def generate_entity_ropa_report(
    entity_type: str,
    entity_config: Dict[str, Any],
    format: str = "json"
) -> Dict[str, Any]:
    """
    Generate a complete ROPA report for a specific entity.
    
    Args:
        entity_type: Entity type identifier
        entity_config: Entity configuration
        format: Output format (json or markdown)
        
    Returns:
        ROPA report dictionary
    """
    activities = get_entity_processing_activities(entity_type, entity_config)
    entity_name = entity_config.get('entity', {}).get('name_en', 'Unknown Entity')
    
    return {
        "ropa_version": "2.0",
        "generated_at": datetime.utcnow().isoformat(),
        "entity_type": entity_type,
        "controller": {
            "name": entity_name,
            "contact": entity_config.get('entity', {}).get('contact', {}).get('email', 'dpo@jol-hub.eu'),
            "country": entity_config.get('entity', {}).get('country', 'lt'),
        },
        "compliance_framework": get_compliance_framework(entity_type),
        "processing_activities": [a.to_dict() for a in activities],
        "summary": {
            "total_activities": len(activities),
            "activities_with_sensitive_data": sum(1 for a in activities if a.sensitive_data),
            "max_retention_years": max(a.retention_period_days for a in activities) // 365,
        }
    }


def get_compliance_framework(entity_type: str) -> List[str]:
    """Get applicable compliance frameworks for entity type."""
    frameworks = ["GDPR"]  # All entities
    
    # PCI-DSS entities (process payments)
    if entity_type in ['basilica', 'cathedral', 'church', 'funeral', 'cemetery']:
        frameworks.append("PCI-DSS")
    
    # SOC2 entities (commercial/financial)
    if entity_type in ['basilica', 'cathedral', 'church', 'funeral', 'cemetery']:
        frameworks.append("SOC2-Type-II")
    
    # Canon Law (Catholic entities)
    if entity_type in ['basilica', 'cathedral', 'diocese', 'deanery', 'church']:
        frameworks.append("Canon-Law-CIC")
    
    # CCEO (Eastern Catholic)
    if entity_type == 'greek_catholic':
        frameworks.append("Canon-Law-CCEO")
    
    return frameworks
