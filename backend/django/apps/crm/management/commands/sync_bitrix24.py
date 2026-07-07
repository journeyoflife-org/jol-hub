"""
Bitrix24 Synchronization Management Command

Usage:
    python manage.py sync_bitrix24 --tenant=<tenant_id> --entity=contact
    python manage.py sync_bitrix24 --tenant=<tenant_id> --entity=deal --all
    python manage.py sync_bitrix24 --tenant=<tenant_id> --entity=contact --ids=<id1>,<id2>
"""

import logging
from typing import Optional

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.crm.models import Contact, Deal
from apps.crm.bitrix24_service import CRMBitrix24ServiceSync, SyncStatus

logger = logging.getLogger('jolhub.crm.management')


class Command(BaseCommand):
    help = 'Synchronize CRM entities with Bitrix24'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--tenant',
            type=str,
            required=True,
            help='Tenant/organization ID to sync',
        )
        parser.add_argument(
            '--entity',
            type=str,
            choices=['contact', 'deal', 'all'],
            default='all',
            help='Entity type to sync',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Sync all entities (not just pending)',
        )
        parser.add_argument(
            '--ids',
            type=str,
            help='Comma-separated list of entity IDs to sync',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be synced without actually syncing',
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=50,
            help='Number of entities to process per batch',
        )
    
    def handle(self, *args, **options):
        tenant_id = options['tenant']
        entity_type = options['entity']
        sync_all = options['all']
        entity_ids = options['ids']
        dry_run = options['dry_run']
        batch_size = options['batch_size']
        
        # Initialize sync service
        service = CRMBitrix24ServiceSync(tenant_id)
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('Dry run mode - no changes will be made')
            )
        
        # Parse entity IDs if provided
        ids_list = None
        if entity_ids:
            ids_list = [id.strip() for id in entity_ids.split(',')]
        
        # Sync based on entity type
        results = {
            'contacts': {'synced': 0, 'failed': 0, 'skipped': 0},
            'deals': {'synced': 0, 'failed': 0, 'skipped': 0},
        }
        
        if entity_type in ['contact', 'all']:
            results['contacts'] = self._sync_contacts(
                service=service,
                tenant_id=tenant_id,
                sync_all=sync_all,
                ids_list=ids_list,
                dry_run=dry_run,
                batch_size=batch_size,
            )
        
        if entity_type in ['deal', 'all']:
            results['deals'] = self._sync_deals(
                service=service,
                tenant_id=tenant_id,
                sync_all=sync_all,
                ids_list=ids_list,
                dry_run=dry_run,
                batch_size=batch_size,
            )
        
        # Print summary
        self._print_summary(results)
    
    def _sync_contacts(
        self,
        service: CRMBitrix24ServiceSync,
        tenant_id: str,
        sync_all: bool,
        ids_list: Optional[list],
        dry_run: bool,
        batch_size: int,
    ) -> dict:
        """Sync contacts to Bitrix24."""
        results = {'synced': 0, 'failed': 0, 'skipped': 0}
        
        # Build queryset
        queryset = Contact.objects.filter(organization_id=tenant_id)
        
        if ids_list:
            queryset = queryset.filter(id__in=ids_list)
        elif not sync_all:
            queryset = queryset.filter(bitrix24_sync_status='pending')
        
        total = queryset.count()
        self.stdout.write(f"Processing {total} contacts...")
        
        for contact in queryset[:batch_size]:
            if dry_run:
                self.stdout.write(f"  Would sync: {contact.full_name} (ID: {contact.id})")
                results['skipped'] += 1
                continue
            
            try:
                result = service.sync_contact(contact)
                
                if result.success:
                    results['synced'] += 1
                    self.stdout.write(
                        f"  Synced: {contact.full_name} -> Bitrix24 ID: {result.bitrix24_id}"
                    )
                else:
                    results['failed'] += 1
                    self.stderr.write(
                        f"  Failed: {contact.full_name} - {result.error}"
                    )
            except Exception as e:
                results['failed'] += 1
                self.stderr.write(f"  Error: {contact.full_name} - {e}")
        
        return results
    
    def _sync_deals(
        self,
        service: CRMBitrix24ServiceSync,
        tenant_id: str,
        sync_all: bool,
        ids_list: Optional[list],
        dry_run: bool,
        batch_size: int,
    ) -> dict:
        """Sync deals to Bitrix24."""
        results = {'synced': 0, 'failed': 0, 'skipped': 0}
        
        # Build queryset
        queryset = Deal.objects.filter(organization_id=tenant_id)
        
        if ids_list:
            queryset = queryset.filter(id__in=ids_list)
        elif not sync_all:
            queryset = queryset.filter(bitrix24_sync_status='pending')
        
        total = queryset.count()
        self.stdout.write(f"Processing {total} deals...")
        
        for deal in queryset[:batch_size]:
            if dry_run:
                self.stdout.write(f"  Would sync: {deal.title} (ID: {deal.id})")
                results['skipped'] += 1
                continue
            
            try:
                result = service.sync_deal(deal)
                
                if result.success:
                    results['synced'] += 1
                    self.stdout.write(
                        f"  Synced: {deal.deal_number} -> Bitrix24 ID: {result.bitrix24_id}"
                    )
                else:
                    results['failed'] += 1
                    self.stderr.write(
                        f"  Failed: {deal.deal_number} - {result.error}"
                    )
            except Exception as e:
                results['failed'] += 1
                self.stderr.write(f"  Error: {deal.deal_number} - {e}")
        
        return results
    
    def _print_summary(self, results: dict):
        """Print sync summary."""
        self.stdout.write("\n" + "=" * 50)
        self.stdout.write(self.style.SUCCESS("SYNC SUMMARY"))
        self.stdout.write("=" * 50)
        
        for entity_type, stats in results.items():
            self.stdout.write(f"\n{entity_type.upper()}:")
            self.stdout.write(f"  Synced:  {stats['synced']}")
            self.stdout.write(f"  Failed:  {stats['failed']}")
            self.stdout.write(f"  Skipped: {stats['skipped']}")
        
        total_synced = sum(r['synced'] for r in results.values())
        total_failed = sum(r['failed'] for r in results.values())
        
        self.stdout.write("\n" + "-" * 50)
        if total_failed == 0:
            self.stdout.write(
                self.style.SUCCESS(f"Completed: {total_synced} entities synced successfully")
            )
        else:
            self.stdout.write(
                self.style.WARNING(
                    f"Completed with errors: {total_synced} synced, {total_failed} failed"
                )
            )
