"""
JOL-HUB Data Module CLI
Command-line interface for data operations
"""

import click
import json
from datetime import datetime, timedelta
from pathlib import Path
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

from src.config import PROCESSING_ACTIVITIES, RetentionPolicy
from src.audit import AuditLogger, get_audit_logger


console = Console()


@click.group()
@click.version_option(version="1.0.0")
def cli():
    """JOL-HUB Data Module - GDPR Compliant Data Processing"""
    pass


@cli.command()
def list_activities():
    """List all GDPR Article 30 processing activities."""
    table = Table(title="Processing Activities (GDPR Art. 30)")
    
    table.add_column("Name", style="cyan")
    table.add_column("Purpose", style="white")
    table.add_column("Legal Basis", style="green")
    table.add_column("Classification", style="yellow")
    
    for activity in PROCESSING_ACTIVITIES:
        table.add_row(
            activity.name,
            activity.purpose[:50] + "..." if len(activity.purpose) > 50 else activity.purpose,
            activity.legal_basis,
            activity.classification.value,
        )
    
    console.print(table)


@cli.command()
@click.option("--days", default=7, help="Number of days to report on")
def compliance_report(days: int):
    """Generate GDPR compliance report."""
    logger = get_audit_logger()
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    report = logger.generate_compliance_report(start_date, end_date)
    
    console.print(Panel(
        json.dumps(report, indent=2),
        title=f"GDPR Compliance Report ({days} days)",
        expand=False,
    ))


@cli.command()
@click.argument("subject_id")
@click.option("--output", "-o", type=click.Path(), help="Output file path")
def export_data(subject_id: str, output: str):
    """Export data for a data subject (GDPR Art. 20)."""
    from src.utils import generate_data_subject_export
    
    console.print(f"[yellow]Exporting data for subject: {subject_id}[/]")
    
    export = generate_data_subject_export(subject_id)
    
    if output:
        Path(output).write_text(json.dumps(export, indent=2, cls=DateTimeEncoder))
        console.print(f"[green]Export saved to: {output}[/]")
    else:
        console.print_json(data=export)
    
    # Log the export
    logger = get_audit_logger()
    logger.log_gdpr_request(
        request_type="portability",
        data_subject_id=subject_id,
        actor="cli_user",
    )


@cli.command()
def retention_policies():
    """Display data retention policies."""
    table = Table(title="Data Retention Policies")
    
    table.add_column("Policy", style="cyan")
    table.add_column("Duration", style="white")
    table.add_column("Days", style="green")
    
    for policy in RetentionPolicy:
        days = policy.value.days
        years = days / 365
        duration_str = f"{years:.1f} years" if years >= 1 else f"{days} days"
        
        table.add_row(
            policy.name,
            duration_str,
            str(days),
        )
    
    console.print(table)


@cli.command()
@click.option("--path", default="/var/log/jol-hub/audit", help="Audit log directory")
def query_audit(path: str):
    """Query recent audit events."""
    logger = AuditLogger(log_dir=path)
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=1)
    
    events = logger.query_events(start_date=start_date, end_date=end_date)
    
    table = Table(title="Recent Audit Events (24h)")
    
    table.add_column("Time", style="dim")
    table.add_column("Action", style="cyan")
    table.add_column("Resource", style="white")
    table.add_column("Actor", style="green")
    
    for event in events[:20]:  # Show last 20
        table.add_row(
            event.timestamp.strftime("%H:%M:%S"),
            event.action,
            f"{event.resource_type}:{event.resource_id or '-'}",
            event.actor,
        )
    
    console.print(table)


if __name__ == "__main__":
    cli()
