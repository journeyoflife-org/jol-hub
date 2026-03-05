from django.urls import path
from . import views

app_name = 'integrations'

urlpatterns = [
    path('webhooks/stripe/', views.StripeWebhookView.as_view(), name='stripe-webhook'),
    path('webhooks/paypal/', views.PayPalWebhookView.as_view(), name='paypal-webhook'),
]
