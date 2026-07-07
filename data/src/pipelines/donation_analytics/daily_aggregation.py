"""
Donation Analytics Pipeline
GDPR Classification: INTERNAL (aggregated, k-anonymized)
Data Controller: JOL-HUB

Generates anonymized analytics from sacred financial data.
All outputs are k-anonymized (k=5) to protect donor privacy.
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime, date, timedelta
from typing import Any, Dict, List, Optional
from decimal import Decimal
from enum import Enum

from src.audit import AuditLogger, AuditEvent
from src.gdpr.anonymizer import KAnonymizer


logger = logging.getLogger(__name__)


class AggregationPeriod(Enum):
    """Time periods for aggregation."""
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"


@dataclass
class DonationMetrics:
    """Aggregated donation metrics (k-anonymized)."""
    period: str
    period_start: date
    period_end: date
    total_amount: Decimal
    donation_count: int
    unique_donors: int  # k-anonymized count
    average_amount: Decimal
    median_amount: Decimal
    currency: str
    country: str
    organization_type: str
    
    # Percentile distributions (no individual data)
    percentile_25: Optional[Decimal] = None
    percentile_75: Optional[Decimal] = None
    percentile_95: Optional[Decimal] = None


@dataclass
class DailyAggregationConfig:
    """Configuration for daily aggregation."""
    k_anonymity_threshold: int = 5
    min_donors_for_reporting: int = 5
    currencies: List[str] = field(default_factory=lambda: ["EUR", "USD", "GBP"])
    include_percentiles: bool = True


class DailyAggregationPipeline:
    """
    Daily aggregation pipeline for donation analytics.
    
    GDPR Compliance:
    - All outputs are k-anonymized (k=5 minimum)
    - No individual donor data in outputs
    - Aggregation suppresses small groups (< 5 donors)
    - Full audit trail of processing
    """
    
    def __init__(
        self,
        config: Optional[DailyAggregationConfig] = None,
        audit_logger: Optional[AuditLogger] = None,
    ):
        self.config = config or DailyAggregationConfig()
        self.audit_logger = audit_logger or AuditLogger()
        self.anonymizer = KAnonymizer(k=self.config.k_anonymity_threshold)
    
    def aggregate(
        self,
        donations: List[Dict[str, Any]],
        period: date,
        group_by_country: bool = True,
        group_by_organization: bool = True,
    ) -> List[DonationMetrics]:
        """
        Aggregate donations for a period.
        
        Args:
            donations: List of donation records
            period: Date for aggregation
            group_by_country: Group results by country
            group_by_organization: Group by organization type
            
        Returns:
            List of k-anonymized DonationMetrics
        """
        self.audit_logger.log(AuditEvent(
            action="daily_aggregation_start",
            resource_type="donation_analytics",
            metadata={
                "period": period.isoformat(),
                "donation_count": len(donations),
            }
        ))
        
        results = []
        
        # Group donations
        groups = self._group_donations(
            donations, 
            by_country=group_by_country,
            by_organization=group_by_organization
        )
        
        for group_key, group_donations in groups.items():
            # Check k-anonymity threshold
            unique_donors = len(set(d.get("donor_id") for d in group_donations))
            
            if unique_donors < self.config.min_donors_for_reporting:
                # Suppress small groups for privacy
                logger.info(f"Suppressing group {group_key}: only {unique_donors} donors")
                continue
            
            # Calculate metrics
            metrics = self._calculate_metrics(group_donations, group_key, period)
            results.append(metrics)
        
        self.audit_logger.log(AuditEvent(
            action="daily_aggregation_complete",
            resource_type="donation_analytics",
            metadata={
                "period": period.isoformat(),
                "groups_produced": len(results),
                "groups_suppressed": len(groups) - len(results),
            }
        ))
        
        return results
    
    def _group_donations(
        self,
        donations: List[Dict],
        by_country: bool,
        by_organization: bool,
    ) -> Dict[str, List[Dict]]:
        """Group donations for aggregation."""
        groups: Dict[str, List[Dict]] = {}
        
        for donation in donations:
            key_parts = []
            
            if by_country:
                key_parts.append(donation.get("country", "UNKNOWN"))
            
            if by_organization:
                key_parts.append(donation.get("organization_type", "UNKNOWN"))
            
            key = "_".join(key_parts) if key_parts else "all"
            
            if key not in groups:
                groups[key] = []
            groups[key].append(donation)
        
        return groups
    
    def _calculate_metrics(
        self,
        donations: List[Dict],
        group_key: str,
        period: date,
    ) -> DonationMetrics:
        """Calculate aggregated metrics for a group."""
        amounts = [Decimal(str(d.get("amount", 0))) for d in donations]
        amounts_sorted = sorted(amounts)
        
        total = sum(amounts)
        count = len(amounts)
        
        # K-anonymize donor count
        unique_donors = len(set(d.get("donor_id") for d in donations))
        anonymized_donor_count = self.anonymizer.anonymize_count(unique_donors)
        
        # Calculate percentiles
        p25, p75, p95 = None, None, None
        if self.config.include_percentiles and count >= 5:
            p25 = amounts_sorted[int(count * 0.25)]
            p75 = amounts_sorted[int(count * 0.75)]
            p95 = amounts_sorted[int(count * 0.95)]
        
        # Parse group key
        parts = group_key.split("_")
        country = parts[0] if len(parts) > 0 else "UNKNOWN"
        org_type = parts[1] if len(parts) > 1 else "UNKNOWN"
        
        return DonationMetrics(
            period="daily",
            period_start=period,
            period_end=period,
            total_amount=total,
            donation_count=count,
            unique_donors=anonymized_donor_count,
            average_amount=total / count if count > 0 else Decimal(0),
            median_amount=amounts_sorted[count // 2] if count > 0 else Decimal(0),
            currency=donations[0].get("currency", "EUR"),
            country=country,
            organization_type=org_type,
            percentile_25=p25,
            percentile_75=p75,
            percentile_95=p95,
        )
    
    def generate_trends(
        self,
        daily_metrics: List[DonationMetrics],
        days: int = 30,
    ) -> Dict[str, Any]:
        """
        Generate trend analysis from daily metrics.
        
        Returns anonymized trend data only.
        """
        if len(daily_metrics) < days:
            days = len(daily_metrics)
        
        recent = daily_metrics[-days:]
        
        total_amount = sum(m.total_amount for m in recent)
        total_count = sum(m.donation_count for m in recent)
        
        return {
            "period_days": days,
            "total_donations": total_count,
            "total_amount": float(total_amount),
            "average_daily_amount": float(total_amount / days) if days > 0 else 0,
            "average_daily_count": total_count / days if days > 0 else 0,
            # No individual-level data
        }
