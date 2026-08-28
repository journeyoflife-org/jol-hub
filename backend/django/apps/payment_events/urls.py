"""Internal ingress routes for payment events (contract v1.0.0)."""

from django.urls import path

from . import views

urlpatterns = [
    path("payment-events", views.receive_payment_event, name="internal-payment-events"),
]
