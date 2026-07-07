#!/usr/bin/env python3
"""
Qoder - JOL-HUB Workflow CLI Tool

A command-line interface for running JOL-HUB workflows including:
- Parish site generation
- Deployment workflows
- Data migration tasks
"""

import argparse
import sys
import os
from pathlib import Path
from typing import Optional

# Add project root to path for imports
PROJECT_ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from tools.qoder.workflows.generate_parish_site import GenerateParishSiteWorkflow
from tools.qoder.workflows.scaffold_entities import EntityScaffoldWorkflow, BulkEntityScaffold
from tools.qoder.workflows.generate_ropa import ROPAGeneratorWorkflow


class QoderCLI:
    """Main CLI handler for Qoder workflows."""

    def __init__(self):
        self.parser = argparse.ArgumentParser(
            prog='qoder',
            description='JOL-HUB Workflow CLI Tool',
            formatter_class=argparse.RawDescriptionHelpFormatter,
            epilog="""
Examples:
  qoder workflow run generate_parish_site --country lt --diocese vilnius --name "Test Parish"
  qoder workflow list
  qoder scaffold create --country lt --type church --name "Šv. Petro bažnyčia"
  qoder scaffold bulk --csv entities.csv
  qoder scaffold deploy-country --country lt --types diocese,church
  qoder ropa generate --country lt --format json
  qoder ropa generate --all
            """
        )
        self._setup_subparsers()

    def _setup_subparsers(self):
        """Setup subcommands."""
        subparsers = self.parser.add_subparsers(dest='command', help='Available commands')

        # Workflow command
        workflow_parser = subparsers.add_parser('workflow', help='Manage and run workflows')
        workflow_subparsers = workflow_parser.add_subparsers(dest='workflow_action', help='Workflow actions')

        # workflow run
        run_parser = workflow_subparsers.add_parser('run', help='Run a workflow')
        run_parser.add_argument('workflow_name', help='Name of the workflow to run')
        run_parser.add_argument('--country', '-c', required=True, help='Country code (e.g., lt, de, fr)')
        run_parser.add_argument('--diocese', '-d', required=True, help='Diocese identifier')
        run_parser.add_argument('--name', '-n', required=True, help='Parish name')
        run_parser.add_argument('--subdomain', '-s', help='Custom subdomain (auto-generated if not provided)')
        run_parser.add_argument('--template', '-t', default='default', help='Template to use (default: default)')
        run_parser.add_argument('--dry-run', action='store_true', help='Show what would be done without making changes')

        # workflow list
        list_parser = workflow_subparsers.add_parser('list', help='List available workflows')

        # Scaffold command
        scaffold_parser = subparsers.add_parser('scaffold', help='Scaffold entity websites at scale')
        scaffold_subparsers = scaffold_parser.add_subparsers(dest='scaffold_action', help='Scaffold actions')

        # scaffold create
        create_parser = scaffold_subparsers.add_parser('create', help='Create a single entity')
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

        # scaffold bulk
        bulk_parser = scaffold_subparsers.add_parser('bulk', help='Create entities from CSV')
        bulk_parser.add_argument('--csv', '-f', required=True, help='Path to CSV file')
        bulk_parser.add_argument('--dry-run', action='store_true', help='Show what would be done')
        bulk_parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')

        # scaffold deploy-country
        deploy_parser = scaffold_subparsers.add_parser('deploy-country', help='Deploy entities for a country')
        deploy_parser.add_argument('--country', '-c', required=True, help='Country code (lt, lv, ee)')
        deploy_parser.add_argument('--types', '-t', help='Comma-separated entity types')
        deploy_parser.add_argument('--limit', '-l', type=int, help='Limit number of entities')
        deploy_parser.add_argument('--dry-run', action='store_true', help='Show what would be done')
        deploy_parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')

        # scaffold sample-csv
        sample_parser = scaffold_subparsers.add_parser('sample-csv', help='Generate sample CSV file')
        sample_parser.add_argument('--output', '-o', required=True, help='Output file path')
        sample_parser.add_argument('--country', '-c', default='lt', help='Country code for sample')

        # ROPA command (GDPR Article 30)
        ropa_parser = subparsers.add_parser('ropa', help='Generate GDPR Article 30 ROPA reports')
        ropa_subparsers = ropa_parser.add_subparsers(dest='ropa_action', help='ROPA actions')

        # ropa generate
        ropa_gen_parser = ropa_subparsers.add_parser('generate', help='Generate ROPA reports')
        ropa_gen_parser.add_argument('--entity', '-e', help='Path to entity.yml file')
        ropa_gen_parser.add_argument('--country', '-c', help='Country code (lt, lv, ee)')
        ropa_gen_parser.add_argument('--all', '-a', action='store_true', help='Generate for all countries')
        ropa_gen_parser.add_argument('--types', '-t', help='Comma-separated entity types')
        ropa_gen_parser.add_argument('--format', '-f', choices=['json', 'markdown'], default='json',
                                     help='Output format (default: json)')
        ropa_gen_parser.add_argument('--output', '-o', help='Output directory')
        ropa_gen_parser.add_argument('--dry-run', action='store_true', help='Show what would be done')
        ropa_gen_parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')

    def run(self, args: Optional[list] = None) -> int:
        """Run the CLI with given arguments."""
        parsed = self.parser.parse_args(args)

        if not parsed.command:
            self.parser.print_help()
            return 1

        if parsed.command == 'workflow':
            return self._handle_workflow(parsed)
        
        if parsed.command == 'scaffold':
            return self._handle_scaffold(parsed)
        
        if parsed.command == 'ropa':
            return self._handle_ropa(parsed)

        return 0

    def _handle_workflow(self, parsed) -> int:
        """Handle workflow subcommands."""
        if not parsed.workflow_action:
            print("Error: Please specify a workflow action (run, list)")
            return 1

        if parsed.workflow_action == 'list':
            return self._list_workflows()

        if parsed.workflow_action == 'run':
            return self._run_workflow(parsed)

        return 0

    def _list_workflows(self) -> int:
        """List all available workflows."""
        print("Available workflows:")
        print("  generate_parish_site  - Generate a new parish website")
        print("")
        print("Run 'qoder workflow run <workflow_name> --help' for workflow-specific options")
        return 0

    def _run_workflow(self, parsed) -> int:
        """Run a specific workflow."""
        workflow_name = parsed.workflow_name

        if workflow_name == 'generate_parish_site':
            workflow = GenerateParishSiteWorkflow(
                country=parsed.country,
                diocese=parsed.diocese,
                name=parsed.name,
                subdomain=parsed.subdomain,
                template=parsed.template,
                dry_run=parsed.dry_run
            )
            return workflow.run()
        else:
            print(f"Error: Unknown workflow '{workflow_name}'")
            print("Run 'qoder workflow list' to see available workflows")
            return 1

    def _handle_scaffold(self, parsed) -> int:
        """Handle scaffold subcommands."""
        if not parsed.scaffold_action:
            print("Error: Please specify a scaffold action (create, bulk, deploy-country, sample-csv)")
            return 1

        if parsed.scaffold_action == 'create':
            return self._scaffold_create(parsed)
        
        if parsed.scaffold_action == 'bulk':
            return self._scaffold_bulk(parsed)
        
        if parsed.scaffold_action == 'deploy-country':
            return self._scaffold_deploy_country(parsed)
        
        if parsed.scaffold_action == 'sample-csv':
            return self._scaffold_sample_csv(parsed)
        
        return 0
    
    def _scaffold_create(self, parsed) -> int:
        """Create a single entity."""
        workflow = EntityScaffoldWorkflow(
            country=parsed.country,
            entity_type=parsed.entity_type,
            name=parsed.name,
            name_en=parsed.name_en,
            subdomain=parsed.subdomain,
            denomination=parsed.denomination,
            jurisdiction=parsed.jurisdiction,
            diocese_id=parsed.diocese_id,
            dry_run=parsed.dry_run,
            verbose=parsed.verbose,
        )
        result = workflow.run()
        return 0 if result.success else 1
    
    def _scaffold_bulk(self, parsed) -> int:
        """Bulk create entities from CSV."""
        bulk = BulkEntityScaffold(
            dry_run=parsed.dry_run,
            verbose=parsed.verbose,
        )
        results = bulk.from_csv(Path(parsed.csv))
        
        success_count = sum(1 for r in results if r.success)
        print(f"\n{'='*60}")
        print(f"Bulk scaffolding complete: {success_count}/{len(results)} successful")
        print(f"{'='*60}")
        return 0 if success_count == len(results) else 1
    
    def _scaffold_deploy_country(self, parsed) -> int:
        """Deploy entities for a country."""
        entity_types = parsed.types.split(',') if parsed.types else None
        bulk = BulkEntityScaffold(
            dry_run=parsed.dry_run,
            verbose=parsed.verbose,
        )
        results = bulk.deploy_country(
            country=parsed.country,
            entity_types=entity_types,
            limit=parsed.limit,
        )
        
        success_count = sum(1 for r in results if r.success)
        print(f"\n{'='*60}")
        print(f"Country deployment complete: {success_count}/{len(results)} successful")
        print(f"{'='*60}")
        return 0 if success_count == len(results) else 1
    
    def _scaffold_sample_csv(self, parsed) -> int:
        """Generate sample CSV file."""
        BulkEntityScaffold.generate_sample_csv(
            output_path=Path(parsed.output),
            country=parsed.country,
        )
        return 0

    def _handle_ropa(self, parsed) -> int:
        """Handle ROPA subcommands."""
        if not parsed.ropa_action:
            print("Error: Please specify a ROPA action (generate)")
            return 1
        
        if parsed.ropa_action == 'generate':
            return self._ropa_generate(parsed)
        
        return 0
    
    def _ropa_generate(self, parsed) -> int:
        """Generate ROPA reports."""
        workflow = ROPAGeneratorWorkflow(
            output_format=parsed.format,
            output_dir=Path(parsed.output) if parsed.output else None,
            verbose=parsed.verbose,
            dry_run=parsed.dry_run,
        )
        
        results = []
        
        if parsed.entity:
            # Single entity
            result = workflow.generate_for_entity(Path(parsed.entity))
            results = [result]
        elif parsed.country:
            # Country-wide
            entity_types = parsed.types.split(',') if parsed.types else None
            results = workflow.generate_for_country(parsed.country, entity_types)
        elif parsed.all:
            # All countries
            results = workflow.generate_all()
        else:
            print("Error: Please specify --entity, --country, or --all")
            return 1
        
        # Print summary
        success_count = sum(1 for r in results if r.success)
        total_activities = sum(r.activities_count for r in results)
        
        print(f"\n{'='*60}")
        print(f"ROPA Generation Complete (GDPR Article 30)")
        print(f"{'='*60}")
        print(f"Entities processed: {success_count}/{len(results)}")
        print(f"Total processing activities: {total_activities}")
        
        if results and parsed.verbose:
            print(f"\nOutput files:")
            for r in results:
                if r.output_path:
                    print(f"  - {r.output_path}")
        
        return 0 if success_count == len(results) else 1


def main():
    """Entry point for the CLI."""
    cli = QoderCLI()
    sys.exit(cli.run())


if __name__ == '__main__':
    main()
