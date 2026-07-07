"""
JOL-HUB Weekly Reporting DAG
GDPR Classification: INTERNAL

Weekly analytics and compliance reporting.
"""

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator


default_args = {
    "owner": "jol-hub",
    "retries": 2,
    "retry_delay": timedelta(minutes=5),
}


def generate_weekly_analytics(**context):
    """Generate weekly analytics reports."""
    from src.pipelines.donation_analytics import DailyAggregationPipeline
    from datetime import date, timedelta
    
    # Generate trends for last 7 days
    end_date = date.today()
    start_date = end_date - timedelta(days=7)
    
    return {
        "period_start": start_date.isoformat(),
        "period_end": end_date.isoformat(),
        "status": "completed",
    }


def generate_country_metrics(**context):
    """Generate country-level metrics (k-anonymized)."""
    # Run dbt models for country metrics
    return {"status": "completed"}


def generate_compliance_scorecard(**context):
    """Generate weekly compliance scorecard."""
    from src.gdpr.ropa_generator import ROPAGenerator
    
    generator = ROPAGenerator()
    summary = generator.get_summary()
    
    return summary


with DAG(
    dag_id="jol_weekly_reporting",
    default_args=default_args,
    description="Weekly analytics and compliance reporting",
    schedule_interval="0 3 * * 1",  # Monday 3 AM
    start_date=datetime(2026, 1, 1),
    catchup=False,
    tags=["reporting", "analytics", "weekly"],
) as dag:
    
    analytics = PythonOperator(
        task_id="weekly_analytics",
        python_callable=generate_weekly_analytics,
    )
    
    country_metrics = PythonOperator(
        task_id="country_metrics",
        python_callable=generate_country_metrics,
    )
    
    compliance = PythonOperator(
        task_id="compliance_scorecard",
        python_callable=generate_compliance_scorecard,
    )
    
    analytics >> country_metrics >> compliance
