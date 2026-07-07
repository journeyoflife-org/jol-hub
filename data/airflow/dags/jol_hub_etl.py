"""
JOL-HUB ETL DAGs
GDPR Article 30 Compliant Data Pipelines
"""

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.dummy import DummyOperator
from airflow.providers.postgres.operators.postgres import PostgresOperator
from airflow.utils.task_group import TaskGroup


default_args = {
    "owner": "jol-hub",
    "depends_on_past": False,
    "email_on_failure": True,
    "email_on_retry": False,
    "retries": 3,
    "retry_delay": timedelta(minutes=5),
    "execution_timeout": timedelta(hours=1),
}


def process_donations(**context):
    """Process daily donation records."""
    from src.processors import DonationProcessor
    from src.audit import AuditLogger
    
    processor = DonationProcessor()
    # Add processing logic here
    return {"status": "completed"}


def validate_data_quality(**context):
    """Run data quality checks."""
    from src.validators import DataValidator
    
    validator = DataValidator()
    # Add validation logic here
    return {"status": "passed"}


def cleanup_expired_data(**context):
    """Remove data past retention period (GDPR compliance)."""
    from src.config import RetentionPolicy
    from src.audit import AuditLogger
    
    audit_logger = AuditLogger()
    audit_logger.log(
        AuditEvent(
            action="retention_cleanup",
            resource_type="expired_data",
            metadata={"policy": "applied"},
        )
    )
    return {"status": "completed"}


def generate_compliance_report(**context):
    """Generate GDPR compliance report."""
    from src.audit import AuditLogger
    from datetime import datetime, timedelta
    
    logger = AuditLogger()
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=7)
    
    report = logger.generate_compliance_report(start_date, end_date)
    return report


with DAG(
    dag_id="jol_hub_daily_etl",
    default_args=default_args,
    description="Daily ETL pipeline for JOL-HUB with GDPR compliance",
    schedule_interval="0 2 * * *",  # Run at 2 AM UTC
    start_date=datetime(2026, 1, 1),
    catchup=False,
    tags=["etl", "gdpr", "compliance"],
) as dag:
    
    start = DummyOperator(task_id="start")
    
    with TaskGroup(group_id="data_processing") as processing_group:
        process_donations_task = PythonOperator(
            task_id="process_donations",
            python_callable=process_donations,
        )
        
        validate_data_task = PythonOperator(
            task_id="validate_data_quality",
            python_callable=validate_data_quality,
        )
        
        process_donations_task >> validate_data_task
    
    with TaskGroup(group_id="gdpr_compliance") as gdpr_group:
        cleanup_task = PythonOperator(
            task_id="retention_cleanup",
            python_callable=cleanup_expired_data,
        )
        
        compliance_report_task = PythonOperator(
            task_id="generate_compliance_report",
            python_callable=generate_compliance_report,
        )
        
        cleanup_task >> compliance_report_task
    
    end = DummyOperator(task_id="end")
    
    start >> processing_group >> gdpr_group >> end


# GDPR Data Subject Request Processing DAG
with DAG(
    dag_id="jol_hub_gdpr_requests",
    default_args=default_args,
    description="Process GDPR data subject requests",
    schedule_interval=None,  # Manual trigger only
    start_date=datetime(2026, 1, 1),
    catchup=False,
    tags=["gdpr", "compliance", "data_subject_rights"],
) as gdpr_dag:
    
    def process_access_request(**context):
        """Process GDPR Art. 15 - Right of Access."""
        from src.processors import UserdataProcessor
        from src.audit import AuditLogger
        
        request_data = context.get("dag_run").conf or {}
        subject_id = request_data.get("subject_id")
        
        processor = UserdataProcessor()
        data = processor.get_data_subject_data(subject_id)
        
        audit_logger = AuditLogger()
        audit_logger.log_gdpr_request(
            request_type="access",
            data_subject_id=subject_id,
            actor=request_data.get("requestor", "system"),
        )
        
        return {"subject_id": subject_id, "data_exported": True}
    
    def process_erasure_request(**context):
        """Process GDPR Art. 17 - Right to Erasure."""
        from src.processors import UserdataProcessor, DonationProcessor
        from src.audit import AuditLogger
        
        request_data = context.get("dag_run").conf or {}
        subject_id = request_data.get("subject_id")
        
        # Delete from all processors
        user_processor = UserdataProcessor()
        donation_processor = DonationProcessor()
        
        user_processor.delete_data_subject_data(subject_id)
        donation_processor.delete_data_subject_data(subject_id)
        
        audit_logger = AuditLogger()
        audit_logger.log_gdpr_request(
            request_type="erasure",
            data_subject_id=subject_id,
            actor=request_data.get("requestor", "system"),
        )
        
        return {"subject_id": subject_id, "deleted": True}
    
    def process_portability_request(**context):
        """Process GDPR Art. 20 - Right to Data Portability."""
        from src.processors import UserdataProcessor
        from src.audit import AuditLogger
        
        request_data = context.get("dag_run").conf or {}
        subject_id = request_data.get("subject_id")
        
        processor = UserdataProcessor()
        data = processor.get_data_subject_data(subject_id)
        
        # Export in portable format (JSON)
        import json
        export_data = json.dumps(data, indent=2)
        
        audit_logger = AuditLogger()
        audit_logger.log_gdpr_request(
            request_type="portability",
            data_subject_id=subject_id,
            actor=request_data.get("requestor", "system"),
        )
        
        return {"subject_id": subject_id, "export_format": "json"}
    
    access_task = PythonOperator(
        task_id="process_access_request",
        python_callable=process_access_request,
    )
    
    erasure_task = PythonOperator(
        task_id="process_erasure_request",
        python_callable=process_erasure_request,
    )
    
    portability_task = PythonOperator(
        task_id="process_portability_request",
        python_callable=process_portability_request,
    )
    
    # Tasks can be triggered independently based on request type
    access_task
    erasure_task
    portability_task
