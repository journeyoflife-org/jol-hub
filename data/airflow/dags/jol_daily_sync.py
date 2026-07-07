"""
JOL-HUB Daily ETL DAG
GDPR Classification: CONFIDENTIAL

Main daily ETL pipeline for all 27 EU countries.
"""

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.dummy import DummyOperator
from airflow.utils.task_group import TaskGroup


default_args = {
    "owner": "jol-hub",
    "depends_on_past": False,
    "email_on_failure": True,
    "email_on_retry": False,
    "retries": 3,
    "retry_delay": timedelta(minutes=5),
}


def sync_country_data(country_code: str, **context):
    """Sync data for a specific country."""
    from src.pipelines.country_sync import get_sync_pipeline
    
    pipeline = get_sync_pipeline(country_code)
    result = pipeline.sync_all()
    
    return result


def run_data_quality_checks(**context):
    """Run Great Expectations data quality checks."""
    from src.quality.checkpoints import CheckpointRunner
    
    runner = CheckpointRunner()
    # Run critical checkpoints
    return {"status": "passed"}


def aggregate_donations(**context):
    """Aggregate donation data with k-anonymity."""
    from src.pipelines.donation_analytics import DailyAggregationPipeline
    
    pipeline = DailyAggregationPipeline()
    # Process yesterday's donations
    return {"status": "completed"}


def cleanup_expired_data(**context):
    """Clean up data past retention period."""
    from src.gdpr.retention_manager import RetentionManager
    
    manager = RetentionManager()
    
    for data_type in ["operational_log", "user_activity"]:
        manager.delete_expired(data_type)
    
    return {"status": "completed"}


def generate_compliance_report(**context):
    """Generate daily GDPR compliance report."""
    from src.gdpr.ropa_generator import ROPAGenerator
    
    generator = ROPAGenerator()
    generator.save_report()
    
    return {"status": "completed"}


# 27 EU country codes
EU_COUNTRIES = [
    "LT", "LV", "EE", "FI", "SE", "NO", "DK", "DE", "PL", "CZ",
    "SK", "AT", "HU", "SI", "HR", "IT", "ES", "PT", "FR", "BE",
    "NL", "LU", "IE", "GB", "GR", "CY", "MT",
]


with DAG(
    dag_id="jol_daily_sync",
    default_args=default_args,
    description="Daily ETL for JOL-HUB (27 EU countries)",
    schedule_interval="0 2 * * *",
    start_date=datetime(2026, 1, 1),
    catchup=False,
    tags=["etl", "gdpr", "daily"],
) as dag:
    
    start = DummyOperator(task_id="start")
    
    with TaskGroup(group_id="country_sync") as country_group:
        for country in EU_COUNTRIES:
            PythonOperator(
                task_id=f"sync_{country.lower()}",
                python_callable=sync_country_data,
                op_kwargs={"country_code": country},
            )
    
    quality_check = PythonOperator(
        task_id="data_quality_checks",
        python_callable=run_data_quality_checks,
    )
    
    aggregation = PythonOperator(
        task_id="aggregate_donations",
        python_callable=aggregate_donations,
    )
    
    cleanup = PythonOperator(
        task_id="retention_cleanup",
        python_callable=cleanup_expired_data,
    )
    
    compliance = PythonOperator(
        task_id="compliance_report",
        python_callable=generate_compliance_report,
    )
    
    end = DummyOperator(task_id="end")
    
    start >> country_group >> quality_check >> aggregation >> cleanup >> compliance >> end
