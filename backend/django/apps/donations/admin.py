from django.contrib import admin
from .models import Donation


@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display = ('organization', 'donor_email', 'amount', 'currency',
                    'status', 'payment_method', 'is_recurring', 'processed_at')
    list_filter = ('status', 'payment_method', 'currency', 'is_recurring', 'gift_aid')
    search_fields = ('donor_email', 'donor_name', 'transaction_id', 'organization__name')
    readonly_fields = ('id', 'transaction_id', 'gateway_response',
                       'processed_at', 'created_at', 'updated_at')
    date_hierarchy = 'created_at'
