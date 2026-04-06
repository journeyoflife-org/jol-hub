from django.urls import path
from . import views

app_name = 'integrations'

urlpatterns = [
    # Payment webhooks
    path('webhooks/stripe/', views.StripeWebhookView.as_view(), name='stripe-webhook'),
    path('webhooks/paypal/', views.PayPalWebhookView.as_view(), name='paypal-webhook'),
    
    # Bitrix24 CRM webhooks (GDPR Article 44 compliant)
    path('webhooks/bitrix24/', views.Bitrix24WebhookView.as_view(), name='bitrix24-webhook'),
    path('webhooks/bitrix24/health/', views.Bitrix24WebhookHealthView.as_view(), name='bitrix24-webhook-health'),
]
