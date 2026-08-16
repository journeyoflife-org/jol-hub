from django.urls import path
from . import views

app_name = 'integrations'

urlpatterns = [
    # Payment webhooks
    # Model A (ADR-0005): NO Stripe webhook endpoint in jol-hub. Stripe
    # webhooks land ONLY on the marketplace payment boundary, which
    # forwards signed per-product events to hub. Purged STEP 18.
    path('webhooks/paypal/', views.PayPalWebhookView.as_view(), name='paypal-webhook'),
    
    # Bitrix24 CRM webhooks (GDPR Article 44 compliant)
    path('webhooks/bitrix24/', views.Bitrix24WebhookView.as_view(), name='bitrix24-webhook'),
    path('webhooks/bitrix24/health/', views.Bitrix24WebhookHealthView.as_view(), name='bitrix24-webhook-health'),
]
