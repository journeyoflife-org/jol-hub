"""
ROPA Generator (Records of Processing Activities)
GDPR Classification: INTERNAL

Generates GDPR Article 30 Records of Processing Activities.
"""

import json
import logging
from dataclasses import dataclass, field, asdict
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional


logger = logging.getLogger(__name__)


@dataclass
class ProcessingActivity:
    """GDPR Article 30 - Record of Processing Activity."""
    id: str
    name: str
    purpose: str
    legal_basis: str
    controller_name: str
    controller_contact: str
    data_categories: List[str]
    data_subjects: List[str]
    recipients: List[str]
    retention_period_days: int
    security_measures: List[str]
    sensitive_data: bool = False
    third_country_transfers: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data["created_at"] = self.created_at.isoformat()
        data["updated_at"] = self.updated_at.isoformat()
        return data


# Standard processing activities
JOL_HUB_PROCESSING_ACTIVITIES = [
    ProcessingActivity(
        id="PA001",
        name="Donation Processing",
        purpose="Process and record charitable donations",
        legal_basis="Contract performance (Art. 6(1)(b))",
        controller_name="JOL-HUB",
        controller_contact="dpo@jol-hub.eu",
        data_categories=["financial", "identification"],
        data_subjects=["donors"],
        recipients=["payment_processors"],
        retention_period_days=2555,
        security_measures=["encryption", "access_control", "audit_logging"],
    ),
    ProcessingActivity(
        id="PA002",
        name="User Account Management",
        purpose="Manage user accounts and authentication",
        legal_basis="Contract performance (Art. 6(1)(b))",
        controller_name="JOL-HUB",
        controller_contact="dpo@jol-hub.eu",
        data_categories=["identification", "authentication"],
        data_subjects=["users"],
        recipients=[],
        retention_period_days=730,
        security_measures=["encryption", "mfa", "access_control"],
    ),
    ProcessingActivity(
        id="PA003",
        name="Analytics Reporting",
        purpose="Generate anonymized analytics",
        legal_basis="Legitimate interest (Art. 6(1)(f))",
        controller_name="JOL-HUB",
        controller_contact="dpo@jol-hub.eu",
        data_categories=["behavioral"],
        data_subjects=["visitors"],
        recipients=["internal_analytics"],
        retention_period_days=90,
        security_measures=["pseudonymization", "k_anonymity"],
    ),
    ProcessingActivity(
        id="PA004",
        name="Religious Entity Registration",
        purpose="Maintain registry of religious entities",
        legal_basis="Legitimate interest (Art. 6(1)(f))",
        controller_name="JOL-HUB",
        controller_contact="dpo@jol-hub.eu",
        data_categories=["identification", "professional"],
        data_subjects=["priests", "parish_staff"],
        recipients=["religious_authorities"],
        retention_period_days=2555,
        security_measures=["encryption", "access_control"],
        sensitive_data=True,
    ),
]


class ROPAGenerator:
    """Generates GDPR Article 30 Records of Processing Activities."""
    
    def __init__(
        self,
        activities: List[ProcessingActivity] = None,
        output_dir: str = "/var/log/jol-hub/ropa",
    ):
        self.activities = activities or JOL_HUB_PROCESSING_ACTIVITIES
        self.output_dir = Path(output_dir)
        try:
            self.output_dir.mkdir(parents=True, exist_ok=True)
        except PermissionError:
            # Use temp directory if default is not writable
            import tempfile
            self.output_dir = Path(tempfile.gettempdir()) / "jol-hub" / "ropa"
            self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def generate_report(self, format: str = "json") -> str:
        """Generate ROPA report in specified format."""
        report_data = {
            "ropa_version": "1.0",
            "generated_at": datetime.utcnow().isoformat(),
            "controller": {
                "name": "JOL-HUB",
                "contact": "dpo@jol-hub.eu",
            },
            "processing_activities": [a.to_dict() for a in self.activities],
        }
        
        if format == "json":
            return json.dumps(report_data, indent=2)
        elif format == "markdown":
            return self._generate_markdown(report_data)
        else:
            raise ValueError(f"Unsupported format: {format}")
    
    def _generate_markdown(self, data: Dict) -> str:
        """Generate ROPA in Markdown format."""
        lines = [
            "# Records of Processing Activities (ROPA)",
            "",
            f"**Generated:** {data['generated_at']}",
            "",
            "## Processing Activities",
            "",
        ]
        
        for a in data["processing_activities"]:
            lines.extend([
                f"### {a['id']}: {a['name']}",
                "",
                f"**Purpose:** {a['purpose']}",
                f"**Legal Basis:** {a['legal_basis']}",
                f"**Retention:** {a['retention_period_days']} days",
                "",
            ])
        
        return "\n".join(lines)
    
    def save_report(self, format: str = "json") -> Path:
        """Save ROPA report to file."""
        report = self.generate_report(format=format)
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filepath = self.output_dir / f"ropa_{timestamp}.{format}"
        filepath.write_text(report)
        return filepath
    
    def get_summary(self) -> Dict[str, Any]:
        """Get summary of processing activities."""
        return {
            "total_activities": len(self.activities),
            "activities_with_sensitive_data": sum(
                1 for a in self.activities if a.sensitive_data
            ),
            "data_subjects_covered": list(set(
                s for a in self.activities for s in a.data_subjects
            )),
        }
