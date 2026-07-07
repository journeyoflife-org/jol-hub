#!/usr/bin/env python3
"""
Entity Scaffolding Workflow

Creates entity websites at scale for:
- Multiple entity types (basilica, cathedral, church, diocese, deanery, etc.)
- Multiple countries (LT, LV, EE - Lithuania, Latvia, Estonia)
- Batch operations for bulk scaffolding

GDPR Article 44: All entities are country-scoped.
GDPR Article 30: ROPA templates auto-generated.
Canon Law: Jurisdiction fields validated.
"""

import csv
import json
import re
import sys
from dataclasses import dataclass, field, asdict
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Dict, List, Optional, Any
from uuid import uuid4


class EntityType(str, Enum):
    """Entity types supported by JOL-HUB."""
    BASILICA = 'basilica'
    CATHEDRAL = 'cathedral'
    CHURCH = 'church'
    DIOCESE = 'diocese'
    DEANERY = 'deanery'
    PROTESTANT = 'protestant'
    ORTHODOX = 'orthodox'
    GREEK_CATHOLIC = 'greek_catholic'
    FUNERAL_HOME = 'funeral_home'
    CEMETERY = 'cemetery'


class Denomination(str, Enum):
    """Religious denominations."""
    CATHOLIC = 'catholic'
    ORTHODOX = 'orthodox'
    GREEK_CATHOLIC = 'greek_catholic'
    PROTESTANT = 'protestant'
    LUTHERAN = 'lutheran'
    OTHER = 'other'


COUNTRY_CONFIGS = {
    'lt': {
        'name': 'Lithuania',
        'timezone': 'Europe/Vilnius',
        'currency': 'EUR',
        'language': 'lt',
        'languages': ['lt', 'en', 'pl'],
        'default_jurisdiction': 'Vilnius Archdiocese',
        'domain': 'gyvenimo-kelias.lt',
        'domain_en': 'life-path.lt',
        'dioceses': [
            {'id': 'vilnius-archdiocese', 'name': 'Vilniaus arkivyskupija', 'name_en': 'Vilnius Archdiocese'},
            {'id': 'kaunas-archdiocese', 'name': 'Kauno arkivyskupija', 'name_en': 'Kaunas Archdiocese'},
        ],
        'orthodox_jurisdiction': 'Vilnius Orthodox Diocese',
        'lutheran_jurisdiction': 'Lithuanian Evangelical Lutheran Church',
    },
    'lv': {
        'name': 'Latvia',
        'timezone': 'Europe/Riga',
        'currency': 'EUR',
        'language': 'lv',
        'languages': ['lv', 'en', 'ru'],
        'default_jurisdiction': 'Riga Archdiocese',
        'domain': 'dzives-cels.lv',
        'domain_en': 'life-path.lv',
        'dioceses': [
            {'id': 'riga-archdiocese', 'name': 'Rīgas arhidiecēze', 'name_en': 'Riga Archdiocese'},
            {'id': 'liepaja-diocese', 'name': 'Liepājas diecēze', 'name_en': 'Liepaja Diocese'},
            {'id': 'jelgava-diocese', 'name': 'Jelgavas diecēze', 'name_en': 'Jelgava Diocese'},
            {'id': 'rezekne-diocese', 'name': 'Rēzeknes diecēze', 'name_en': 'Rezekne Diocese'},
        ],
        'orthodox_jurisdiction': 'Riga Orthodox Diocese',
        'lutheran_jurisdiction': 'Evangelical Lutheran Church of Latvia',
    },
    'ee': {
        'name': 'Estonia',
        'timezone': 'Europe/Tallinn',
        'currency': 'EUR',
        'language': 'et',
        'languages': ['et', 'en', 'ru'],
        'default_jurisdiction': 'Estonian Apostolic Administration',
        'domain': 'elu-tee.ee',
        'domain_en': 'life-path.ee',
        'dioceses': [
            {'id': 'estonia-apostolic', 'name': 'Eesti Apostellik Administratuur', 'name_en': 'Estonian Apostolic Administration'},
        ],
        'orthodox_jurisdiction': 'Estonian Orthodox Church',
        'lutheran_jurisdiction': 'Estonian Evangelical Lutheran Church',
    },
}

ENTITY_TEMPLATES = {
    EntityType.BASILICA: {
        'denomination': Denomination.CATHOLIC,
        'compliance_level': 'canonical',
        'features': ['mass_schedules', 'sacraments', 'donations', 'pilgrimages', 'gift_shop'],
    },
    EntityType.CATHEDRAL: {
        'denomination': Denomination.CATHOLIC,
        'compliance_level': 'canonical',
        'features': ['mass_schedules', 'sacraments', 'donations', 'events', 'tours'],
    },
    EntityType.CHURCH: {
        'denomination': Denomination.CATHOLIC,
        'compliance_level': 'canonical',
        'features': ['mass_schedules', 'sacraments', 'donations', 'announcements'],
    },
    EntityType.DIOCESE: {
        'denomination': Denomination.CATHOLIC,
        'compliance_level': 'canonical',
        'features': ['governance', 'clergy_directory', 'parish_finder', 'news', 'events'],
    },
    EntityType.DEANERY: {
        'denomination': Denomination.CATHOLIC,
        'compliance_level': 'gdpr',
        'features': ['parish_list', 'events', 'announcements', 'shared_calendar'],
    },
    EntityType.PROTESTANT: {
        'denomination': Denomination.PROTESTANT,
        'compliance_level': 'gdpr',
        'features': ['services', 'community', 'events', 'donations'],
    },
    EntityType.ORTHODOX: {
        'denomination': Denomination.ORTHODOX,
        'compliance_level': 'canonical',
        'features': ['services', 'sacraments', 'calendar', 'donations'],
        'calendar': 'julian',  # Julian calendar for Orthodox
    },
    EntityType.GREEK_CATHOLIC: {
        'denomination': Denomination.GREEK_CATHOLIC,
        'compliance_level': 'canonical',
        'features': ['services', 'sacraments', 'byzantine_calendar', 'donations'],
        'calendar': 'gregorian',  # Gregorian for Greek Catholic
    },
    EntityType.FUNERAL_HOME: {
        'denomination': Denomination.OTHER,
        'compliance_level': 'pci_dss',
        'features': ['obituaries', 'pre_need', 'services', 'online_payments'],
    },
    EntityType.CEMETERY: {
        'denomination': Denomination.OTHER,
        'compliance_level': 'pci_dss',
        'features': ['grave_search', 'pre_need', 'services', 'online_payments'],
    },
}


@dataclass
class EntityConfig:
    """Configuration for a new entity."""
    id: str
    name: str
    name_en: str
    subdomain: str
    entity_type: str
    country: str
    denomination: str
    jurisdiction: str
    diocese_id: Optional[str] = None
    template: str = 'default'
    features: List[str] = field(default_factory=list)
    compliance_level: str = 'gdpr'
    bitrix24_portal: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    status: str = 'active'
    
    def __post_init__(self):
        if not self.id:
            self.id = f"{self.country}-{self.entity_type}-{uuid4().hex[:8]}"


@dataclass
class ScaffoldingResult:
    """Result of a scaffolding operation."""
    entity_id: str
    entity_name: str
    entity_type: str
    country: str
    subdomain: str
    success: bool
    files_created: List[str] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)


class EntityScaffoldWorkflow:
    """
    Workflow to scaffold entity websites at scale.
    
    Supports:
    - Single entity creation
    - Batch creation from CSV
    - Country-wide deployment
    - Multi-country deployment (LT, LV, EE)
    
    Usage:
        # Single entity
        workflow = EntityScaffoldWorkflow(
            country='lt',
            entity_type='church',
            name='Šv. Petro bažnyčia',
            name_en='St. Peter Church',
        )
        
        # Batch from CSV
        workflow = EntityScaffoldWorkflow.from_csv('entities.csv')
        
        # Deploy all dioceses for a country
        workflow = EntityScaffoldWorkflow.deploy_country('lt')
    """
    
    def __init__(
        self,
        country: str,
        entity_type: str,
        name: str,
        name_en: Optional[str] = None,
        subdomain: Optional[str] = None,
        denomination: Optional[str] = None,
        jurisdiction: Optional[str] = None,
        diocese_id: Optional[str] = None,
        bitrix24_portal: Optional[str] = None,
        template: str = 'default',
        dry_run: bool = False,
        verbose: bool = False,
    ):
        self.country = country.lower()
        self.entity_type = entity_type.lower()
        self.name = name
        self.name_en = name_en or name
        self.subdomain = subdomain
        self.denomination = denomination
        self.jurisdiction = jurisdiction
        self.diocese_id = diocese_id
        self.bitrix24_portal = bitrix24_portal
        self.template = template
        self.dry_run = dry_run
        self.verbose = verbose
        
        self.project_root = Path(__file__).parent.parent.parent.parent
        self.countries_dir = self.project_root / 'countries'
        self.frontend_dir = self.project_root / 'frontend'
        
        self._validate_entity_type()
        
        # Set defaults from templates
        self._apply_template_defaults()
        
        # Generate subdomain if not provided
        if not self.subdomain:
            self.subdomain = self._generate_subdomain()
    
    def _validate_entity_type(self):
        """Validate entity type."""
        valid_types = [e.value for e in EntityType]
        # Also accept aliases
        aliases = {
            'church_protestant': 'protestant',
            'church_orthodox': 'orthodox',
            'funeral_service': 'funeral_home',
            'funeral': 'funeral_home',
            'cemetery_service': 'cemetery',
        }
        
        if self.entity_type in aliases:
            self.entity_type = aliases[self.entity_type]
        
        if self.entity_type not in valid_types:
            raise ValueError(f"Invalid entity type: {self.entity_type}. Valid types: {valid_types}")
    
    def _apply_template_defaults(self):
        """Apply default values from entity template."""
        try:
            entity_type_enum = EntityType(self.entity_type)
            template = ENTITY_TEMPLATES.get(entity_type_enum, {})
            
            if not self.denomination:
                self.denomination = template.get('denomination', Denomination.OTHER).value
            
            self.compliance_level = template.get('compliance_level', 'gdpr')
            self.features = template.get('features', [])
            self.calendar = template.get('calendar', 'gregorian')
        except ValueError:
            self.denomination = self.denomination or 'other'
            self.compliance_level = 'gdpr'
            self.features = []
            self.calendar = 'gregorian'
    
    def _generate_subdomain(self) -> str:
        """Generate a subdomain from the entity name."""
        # Remove diacritics and special characters
        subdomain = self.name.lower()
        subdomain = re.sub(r'[^\w\s-]', '', subdomain)
        subdomain = re.sub(r'\s+', '-', subdomain)
        subdomain = subdomain.strip('-')
        
        # Add country prefix for uniqueness
        subdomain = f"{subdomain}-{self.country}"
        
        return subdomain
    
    def run(self) -> ScaffoldingResult:
        """Execute the scaffolding workflow."""
        result = ScaffoldingResult(
            entity_id=f"{self.country}-{self.entity_type}-{uuid4().hex[:8]}",
            entity_name=self.name,
            entity_type=self.entity_type,
            country=self.country,
            subdomain=self.subdomain,
            success=False,
        )
        
        self._log(f"{'='*60}")
        self._log(f"Entity Scaffolding Workflow")
        self._log(f"{'='*60}")
        self._log(f"Entity: {self.name} ({self.name_en})")
        self._log(f"Type: {self.entity_type}")
        self._log(f"Country: {self.country.upper()}")
        self._log(f"Subdomain: {self.subdomain}")
        self._log("")
        
        if self.dry_run:
            self._log("[DRY RUN MODE - No changes will be made]")
            self._log("")
        
        # Step 1: Validate country
        if not self._validate_country():
            result.errors.append(f"Invalid country code: {self.country}")
            return result
        
        # Step 2: Create entity configuration
        config = self._create_entity_config()
        result.entity_id = config.id
        
        # Step 3: Create directory structure
        entity_dir = self._create_directory_structure(config)
        if entity_dir:
            result.files_created.append(str(entity_dir))
        else:
            result.errors.append("Failed to create directory structure")
            return result
        
        # Step 4: Generate entity.yml
        entity_yml_path = self._generate_entity_yml(config, entity_dir)
        if entity_yml_path:
            result.files_created.append(str(entity_yml_path))
        else:
            result.errors.append("Failed to generate entity.yml")
            return result
        
        # Step 5: Generate country config (parish.json)
        parish_json_path = self._generate_parish_json(config, entity_dir)
        if parish_json_path:
            result.files_created.append(str(parish_json_path))
        
        # Step 6: Generate ROPA template
        ropa_path = self._generate_ropa_template(config, entity_dir)
        if ropa_path:
            result.files_created.append(str(ropa_path))
        
        # Step 7: Create frontend app scaffold (optional)
        frontend_path = self._create_frontend_scaffold(config)
        if frontend_path:
            result.files_created.append(str(frontend_path))
        
        result.success = True
        self._log(f"{'='*60}")
        self._log(f"Scaffolding completed successfully!")
        self._log(f"{'='*60}")
        
        return result
    
    def _log(self, message: str):
        """Log message if verbose mode."""
        if self.verbose or self.dry_run:
            print(message)
    
    def _validate_country(self) -> bool:
        """Validate country code."""
        if self.country not in COUNTRY_CONFIGS:
            self._log(f"Error: Invalid country code '{self.country}'")
            self._log(f"Valid codes: {list(COUNTRY_CONFIGS.keys())}")
            return False
        return True
    
    def _create_entity_config(self) -> EntityConfig:
        """Create the entity configuration."""
        country_config = COUNTRY_CONFIGS.get(self.country, {})
        
        # Get jurisdiction
        jurisdiction = self.jurisdiction or country_config.get('default_jurisdiction', '')
        
        # Get denomination
        denomination = self.denomination or 'catholic'
        
        config = EntityConfig(
            id=f"{self.country}-{self.entity_type}-{uuid4().hex[:8]}",
            name=self.name,
            name_en=self.name_en,
            subdomain=self.subdomain,
            entity_type=self.entity_type,
            country=self.country,
            denomination=denomination,
            jurisdiction=jurisdiction,
            diocese_id=self.diocese_id,
            template=self.template,
            features=self.features,
            compliance_level=self.compliance_level,
            bitrix24_portal=self.bitrix24_portal,
        )
        
        return config
    
    def _create_directory_structure(self, config: EntityConfig) -> Optional[Path]:
        """Create the directory structure for the entity."""
        self._log("Step 3: Creating directory structure...")
        
        # Determine the path based on entity type
        if config.entity_type in [EntityType.FUNERAL_HOME.value, EntityType.CEMETERY.value]:
            # Services go in services directory
            if config.entity_type == EntityType.FUNERAL_HOME.value:
                category = 'funeral-homes'
            else:
                category = 'cemetery-services'
            entity_dir = (
                self.countries_dir / config.country / 'examples' / 'services' / 
                category / config.subdomain
            )
        elif config.denomination == Denomination.CATHOLIC.value:
            # Catholic entities
            entity_dir = (
                self.countries_dir / config.country / 'examples' / 'catholic' / 
                config.entity_type / config.subdomain
            )
        elif config.denomination == Denomination.ORTHODOX.value:
            entity_dir = (
                self.countries_dir / config.country / 'examples' / 'orthodox' / 
                config.subdomain
            )
        elif config.denomination == Denomination.PROTESTANT.value:
            entity_dir = (
                self.countries_dir / config.country / 'examples' / 'protestant' / 
                config.subdomain
            )
        elif config.denomination == Denomination.GREEK_CATHOLIC.value:
            entity_dir = (
                self.countries_dir / config.country / 'examples' / 'other-christian' / 
                config.subdomain
            )
        else:
            # Generic path
            entity_dir = (
                self.countries_dir / config.country / 'examples' / config.denomination / 
                config.entity_type / config.subdomain
            )
        
        if self.dry_run:
            self._log(f"[DRY RUN] Would create: {entity_dir}")
            return entity_dir
        
        try:
            entity_dir.mkdir(parents=True, exist_ok=True)
            self._log(f"Created: {entity_dir}")
            return entity_dir
        except Exception as e:
            self._log(f"Error creating directory: {e}")
            return None
    
    def _generate_entity_yml(self, config: EntityConfig, entity_dir: Path) -> Optional[Path]:
        """Generate the entity.yml configuration file."""
        self._log("Step 4: Generating entity.yml...")
        
        yml_content = self._render_entity_yml(config)
        yml_path = entity_dir / 'entity.yml'
        
        if self.dry_run:
            self._log(f"[DRY RUN] Would write to: {yml_path}")
            self._log(f"Content preview:\n{yml_content[:500]}...")
            return yml_path
        
        try:
            yml_path.write_text(yml_content)
            self._log(f"Created: {yml_path}")
            return yml_path
        except Exception as e:
            self._log(f"Error writing entity.yml: {e}")
            return None
    
    def _render_entity_yml(self, config: EntityConfig) -> str:
        """Render the entity.yml content."""
        country_config = COUNTRY_CONFIGS.get(config.country, {})
        
        yml = f"""# {config.name_en}
# Entity Configuration for JOL-HUB
# Generated: {config.created_at}

entity:
  id: "{config.id}"
  name: "{config.name}"
  name_en: "{config.name_en}"
  type: "{config.entity_type}"
  status: "{config.status}"
  country: "{config.country}"
  
  # Canonical Information
  canonical:
    rite: "{self._get_rite()}"
    jurisdiction: "{config.jurisdiction}"
    jurisdiction_type: "{config.entity_type}"
"""
        
        # Add diocese reference for churches
        if config.diocese_id:
            yml += f"""    parent_diocese: "{config.diocese_id}"
"""
        
        # Add hierarchy section for churches, basilicas, cathedrals
        if config.entity_type in ['church', 'basilica', 'cathedral'] and config.denomination == Denomination.CATHOLIC.value:
            default_diocese = self._get_default_diocese_id()
            parent_diocese = config.diocese_id or default_diocese
            yml += f"""  
  # Hierarchical Structure
  hierarchy:
    parent_diocese: "{parent_diocese}"
"""
        
        # Add address placeholder
        yml += f"""  
  # Location
  address:
    street: ""
    city: ""
    postal_code: ""
    country: "{country_config.get('name', config.country.upper())}"
    coordinates:
      latitude: 0.0
      longitude: 0.0
      
  # Contact Information
  contact:
    email: ""
    phone: ""
    website: ""
"""
        
        # Add Bitrix24 configuration
        if config.bitrix24_portal:
            yml += f"""  
  # Bitrix24 Integration
  bitrix24:
    portal_domain: "{config.bitrix24_portal}"
    shared_crm: true
    contact_group_id: 1
"""
        
        # Add website configuration
        yml += f"""  
  # Website Configuration
  website:
    domain: "{config.subdomain}.jol.lt"
    ssl_enabled: true
    default_language: "{country_config.get('language', 'en')}"
    supported_languages:
"""
        for lang in country_config.get('languages', ['en']):
            yml += f'      - "{lang}"\n'
        
        # Add features based on entity type
        if self.features:
            yml += f"""    
  # Features
  features:
"""
            for feature in self.features:
                yml += f'    - "{feature}"\n'
        
        # Add compliance configuration
        yml += f"""  
  # Compliance Configuration
  compliance:
    level: "{config.compliance_level}"
    audit_logging: true
    data_retention:
      sacramental_records: "permanent"
      parishioner_data: 10
      financial_records: 10
"""
        
        return yml
    
    def _get_rite(self) -> str:
        """Get the liturgical rite based on denomination."""
        rite_map = {
            Denomination.CATHOLIC.value: 'roman',
            Denomination.ORTHODOX.value: 'byzantine',
            Denomination.GREEK_CATHOLIC.value: 'byzantine',
            Denomination.PROTESTANT.value: 'western',
            Denomination.LUTHERAN.value: 'western',
        }
        return rite_map.get(self.denomination, 'roman')
    
    def _get_default_diocese_id(self) -> str:
        """Get the default diocese ID for the country."""
        country_config = COUNTRY_CONFIGS.get(self.country, {})
        dioceses = country_config.get('dioceses', [])
        if dioceses:
            return dioceses[0]['id']
        return f"{self.country}-catholic-diocese-001"
    
    def _generate_parish_json(self, config: EntityConfig, entity_dir: Path) -> Optional[Path]:
        """Generate the parish.json configuration file."""
        self._log("Step 5: Generating parish.json...")
        
        country_config = COUNTRY_CONFIGS.get(config.country, {})
        
        parish_config = {
            'id': config.id,
            'name': config.name,
            'name_en': config.name_en,
            'subdomain': config.subdomain,
            'entity_type': config.entity_type,
            'country': config.country,
            'denomination': config.denomination,
            'jurisdiction': config.jurisdiction,
            'template': config.template,
            'created_at': config.created_at,
            'status': config.status,
            'settings': {
                'language': country_config.get('language', 'en'),
                'timezone': country_config.get('timezone', 'UTC'),
                'currency': country_config.get('currency', 'EUR'),
            },
        }
        
        json_path = entity_dir / 'parish.json'
        
        if self.dry_run:
            self._log(f"[DRY RUN] Would write to: {json_path}")
            return json_path
        
        try:
            json_path.write_text(json.dumps(parish_config, indent=2))
            self._log(f"Created: {json_path}")
            return json_path
        except Exception as e:
            self._log(f"Error writing parish.json: {e}")
            return None
    
    def _generate_ropa_template(self, config: EntityConfig, entity_dir: Path) -> Optional[Path]:
        """Generate ROPA (Record of Processing Activities) template."""
        self._log("Step 6: Generating ROPA template...")
        
        ropa_path = entity_dir / 'ropa.json'
        
        ropa_content = {
            'entity_id': config.id,
            'entity_name': config.name,
            'entity_type': config.entity_type,
            'country': config.country,
            'generated_at': config.created_at,
            'processing_activities': self._get_processing_activities(config),
            'legal_basis': [
                {
                    'article': 'GDPR Article 9(2)(d)',
                    'description': 'Processing necessary for archiving purposes in the public interest, or for historical, statistical or scientific purposes',
                    'applies_to': ['sacramental_records', 'religious_affiliation'],
                },
            ],
            'data_retention': {
                'sacramental_records': 'permanent',
                'parishioner_data': '10 years',
                'financial_records': '10 years',
                'audit_logs': '7 years',
            },
        }
        
        if self.dry_run:
            self._log(f"[DRY RUN] Would write to: {ropa_path}")
            return ropa_path
        
        try:
            ropa_path.write_text(json.dumps(ropa_content, indent=2))
            self._log(f"Created: {ropa_path}")
            return ropa_path
        except Exception as e:
            self._log(f"Error writing ROPA template: {e}")
            return None
    
    def _get_processing_activities(self, config: EntityConfig) -> List[Dict]:
        """Get processing activities based on entity type."""
        activities = [
            {
                'id': f"{config.entity_type.upper()}-001",
                'name': 'Parishioner Registration',
                'description': 'Registration of parish members',
                'data_categories': ['identity', 'contact', 'religious_affiliation'],
                'legal_basis': 'consent',
            },
            {
                'id': f"{config.entity_type.upper()}-002",
                'name': 'Sacramental Records',
                'description': 'Recording of sacraments (baptism, marriage, etc.)',
                'data_categories': ['identity', 'religious_affiliation', 'family_relationships'],
                'legal_basis': 'gdpr_article_9_2_d',
                'canon_law': 'CIC 535',
            },
        ]
        
        if config.entity_type in [EntityType.FUNERAL_HOME.value, EntityType.CEMETERY.value]:
            activities.extend([
                {
                    'id': f"{config.entity_type.upper()}-003",
                    'name': 'Pre-Need Contracts',
                    'description': 'Pre-arranged funeral/cemetery services',
                    'data_categories': ['identity', 'contact', 'financial', 'health'],
                    'legal_basis': 'contract',
                },
                {
                    'id': f"{config.entity_type.upper()}-004",
                    'name': 'Payment Processing',
                    'description': 'Processing of payments for services',
                    'data_categories': ['financial'],
                    'legal_basis': 'contract',
                    'pci_dss': True,
                },
            ])
        
        return activities
    
    def _create_frontend_scaffold(self, config: EntityConfig) -> Optional[Path]:
        """Create frontend app scaffold."""
        self._log("Step 7: Creating frontend scaffold...")
        
        # For now, just note that this would be done
        # In production, this would create the Next.js app files
        if self.dry_run:
            self._log(f"[DRY RUN] Would create frontend app for {config.subdomain}")
        
        return None


class BulkEntityScaffold:
    """
    Bulk scaffolding operations for multi-entity deployment.
    
    Supports:
    - CSV import
    - Country-wide deployment
    - Multi-country deployment
    """
    
    def __init__(
        self,
        dry_run: bool = False,
        verbose: bool = False,
        output_dir: Optional[Path] = None,
    ):
        self.dry_run = dry_run
        self.verbose = verbose
        self.project_root = Path(__file__).parent.parent.parent.parent
        self.output_dir = output_dir or self.project_root / 'countries'
    
    def from_csv(self, csv_path: Path) -> List[ScaffoldingResult]:
        """
        Scaffold entities from a CSV file.
        
        Expected CSV columns:
        - name: Entity name (local language)
        - name_en: Entity name (English)
        - entity_type: Entity type (basilica, cathedral, etc.)
        - country: Country code (lt, lv, ee)
        - denomination: Religious denomination
        - jurisdiction: Canonical jurisdiction
        - diocese_id: Parent diocese ID (optional)
        - subdomain: Custom subdomain (optional)
        """
        results = []
        
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                self._log(f"\nProcessing: {row.get('name', 'Unknown')}")
                
                try:
                    workflow = EntityScaffoldWorkflow(
                        country=row['country'],
                        entity_type=row['entity_type'],
                        name=row['name'],
                        name_en=row.get('name_en'),
                        subdomain=row.get('subdomain'),
                        denomination=row.get('denomination'),
                        jurisdiction=row.get('jurisdiction'),
                        diocese_id=row.get('diocese_id'),
                        dry_run=self.dry_run,
                        verbose=self.verbose,
                    )
                    
                    result = workflow.run()
                    results.append(result)
                    
                except Exception as e:
                    self._log(f"Error processing row: {e}")
                    results.append(ScaffoldingResult(
                        entity_id='',
                        entity_name=row.get('name', 'Unknown'),
                        entity_type=row.get('entity_type', 'unknown'),
                        country=row.get('country', 'unknown'),
                        subdomain='',
                        success=False,
                        errors=[str(e)],
                    ))
        
        return results
    
    def deploy_country(
        self,
        country: str,
        entity_types: Optional[List[str]] = None,
        limit: Optional[int] = None,
    ) -> List[ScaffoldingResult]:
        """
        Deploy entities for a country based on existing dioceses.
        
        This reads the country configuration and creates entities
        for each diocese and deanery.
        """
        results = []
        country_config = COUNTRY_CONFIGS.get(country)
        
        if not country_config:
            self._log(f"Error: Unknown country code: {country}")
            return results
        
        self._log(f"Deploying entities for {country_config['name']}")
        
        # Create dioceses
        if not entity_types or 'diocese' in entity_types:
            for diocese in country_config['dioceses']:
                self._log(f"\nCreating diocese: {diocese['name_en']}")
                
                workflow = EntityScaffoldWorkflow(
                    country=country,
                    entity_type='diocese',
                    name=diocese['name'],
                    name_en=diocese['name_en'],
                    subdomain=diocese['id'],
                    denomination='catholic',
                    jurisdiction=diocese['name_en'],
                    dry_run=self.dry_run,
                    verbose=self.verbose,
                )
                
                result = workflow.run()
                results.append(result)
                
                if limit and len(results) >= limit:
                    break
        
        return results
    
    def _log(self, message: str):
        """Log message if verbose mode."""
        if self.verbose or self.dry_run:
            print(message)
    
    @staticmethod
    def generate_sample_csv(output_path: Path, country: str = 'lt') -> None:
        """Generate a sample CSV file for bulk import."""
        sample_data = [
            {
                'name': 'Šv. Petro ir Povilo bažnyčia',
                'name_en': 'St. Peter and Paul Church',
                'entity_type': 'church',
                'country': country,
                'denomination': 'catholic',
                'jurisdiction': 'Vilnius Archdiocese',
                'diocese_id': 'lt-catholic-diocese-001',
                'subdomain': 'st-peter-paul-vilnius',
            },
            {
                'name': 'Šv. Onos bažnyčia',
                'name_en': 'St. Anne Church',
                'entity_type': 'church',
                'country': country,
                'denomination': 'catholic',
                'jurisdiction': 'Vilnius Archdiocese',
                'diocese_id': 'lt-catholic-diocese-001',
                'subdomain': 'st-anne-vilnius',
            },
            {
                'name': 'Vilniaus laidojimo namai',
                'name_en': 'Vilnius Funeral Home',
                'entity_type': 'funeral_home',
                'country': country,
                'denomination': 'other',
                'jurisdiction': 'N/A',
                'diocese_id': '',
                'subdomain': 'vilnius-funeral',
            },
        ]
        
        with open(output_path, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['name', 'name_en', 'entity_type', 'country', 'denomination', 
                         'jurisdiction', 'diocese_id', 'subdomain']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(sample_data)
        
        print(f"Sample CSV written to: {output_path}")


def main():
    """CLI entry point for entity scaffolding."""
    import argparse
    
    parser = argparse.ArgumentParser(
        prog='scaffold-entities',
        description='Scaffold entity websites at scale for JOL-HUB',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Single entity
  scaffold-entities create --country lt --type church --name "Šv. Petro bažnyčia"
  
  # Bulk from CSV
  scaffold-entities bulk --csv entities.csv
  
  # Deploy country
  scaffold-entities deploy-country --country lt --types diocese,church
  
  # Generate sample CSV
  scaffold-entities sample-csv --output sample.csv
        """,
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # create command
    create_parser = subparsers.add_parser('create', help='Create a single entity')
    create_parser.add_argument('--country', '-c', required=True, help='Country code (lt, lv, ee)')
    create_parser.add_argument('--type', '-t', required=True, dest='entity_type', 
                               help='Entity type (basilica, cathedral, church, etc.)')
    create_parser.add_argument('--name', '-n', required=True, help='Entity name (local language)')
    create_parser.add_argument('--name-en', help='Entity name (English)')
    create_parser.add_argument('--subdomain', '-s', help='Custom subdomain')
    create_parser.add_argument('--denomination', '-d', help='Religious denomination')
    create_parser.add_argument('--jurisdiction', '-j', help='Canonical jurisdiction')
    create_parser.add_argument('--diocese-id', help='Parent diocese ID')
    create_parser.add_argument('--dry-run', action='store_true', help='Show what would be done')
    create_parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    
    # bulk command
    bulk_parser = subparsers.add_parser('bulk', help='Create entities from CSV')
    bulk_parser.add_argument('--csv', '-f', required=True, help='Path to CSV file')
    bulk_parser.add_argument('--dry-run', action='store_true', help='Show what would be done')
    bulk_parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    
    # deploy-country command
    deploy_parser = subparsers.add_parser('deploy-country', help='Deploy entities for a country')
    deploy_parser.add_argument('--country', '-c', required=True, help='Country code (lt, lv, ee)')
    deploy_parser.add_argument('--types', '-t', help='Comma-separated entity types')
    deploy_parser.add_argument('--limit', '-l', type=int, help='Limit number of entities')
    deploy_parser.add_argument('--dry-run', action='store_true', help='Show what would be done')
    deploy_parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    
    # sample-csv command
    sample_parser = subparsers.add_parser('sample-csv', help='Generate sample CSV file')
    sample_parser.add_argument('--output', '-o', required=True, help='Output file path')
    sample_parser.add_argument('--country', '-c', default='lt', help='Country code for sample')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return 1
    
    if args.command == 'create':
        workflow = EntityScaffoldWorkflow(
            country=args.country,
            entity_type=args.entity_type,
            name=args.name,
            name_en=args.name_en,
            subdomain=args.subdomain,
            denomination=args.denomination,
            jurisdiction=args.jurisdiction,
            diocese_id=args.diocese_id,
            dry_run=args.dry_run,
            verbose=args.verbose,
        )
        result = workflow.run()
        return 0 if result.success else 1
    
    elif args.command == 'bulk':
        bulk = BulkEntityScaffold(
            dry_run=args.dry_run,
            verbose=args.verbose,
        )
        results = bulk.from_csv(Path(args.csv))
        
        success_count = sum(1 for r in results if r.success)
        print(f"\n{'='*60}")
        print(f"Bulk scaffolding complete: {success_count}/{len(results)} successful")
        print(f"{'='*60}")
        return 0 if success_count == len(results) else 1
    
    elif args.command == 'deploy-country':
        entity_types = args.types.split(',') if args.types else None
        bulk = BulkEntityScaffold(
            dry_run=args.dry_run,
            verbose=args.verbose,
        )
        results = bulk.deploy_country(
            country=args.country,
            entity_types=entity_types,
            limit=args.limit,
        )
        
        success_count = sum(1 for r in results if r.success)
        print(f"\n{'='*60}")
        print(f"Country deployment complete: {success_count}/{len(results)} successful")
        print(f"{'='*60}")
        return 0 if success_count == len(results) else 1
    
    elif args.command == 'sample-csv':
        BulkEntityScaffold.generate_sample_csv(
            output_path=Path(args.output),
            country=args.country,
        )
        return 0
    
    return 0


if __name__ == '__main__':
    sys.exit(main())
